import type { PlanDay, Slot, TripPlan } from "./travel-types";

export const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
export const toHHMM = (m: number) =>
  `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export type Constraints = { budget: number; spent: number; wheelchair: boolean; backBy: string };
export type Candidate = {
  id: string;
  title: string;
  reason: string;
  day: PlanDay;
  changed: number;
  costDelta: number;
  timeDelta: number;
  match: number;
  confidence: number;
  rejected: string | null;
};

export type Trigger = { slotIndex: number; reason: string };

/** Detect the first problem on a day given "now" (minutes) and when the traveller is still at a stop. */
export function detect(day: PlanDay, nowMin: number, stayingAt: number | null): Trigger | null {
  if (stayingAt != null) {
    const s = day.slots[stayingAt];
    if (s && nowMin > toMin(s.end) + 10)
      return {
        slotIndex: stayingAt + 1,
        reason: `You are still at ${s.options[s.chosen]!.place.name}, ${nowMin - toMin(s.end)} min past the planned end.`,
      };
  }
  for (let i = 0; i < day.slots.length; i++) {
    const s = day.slots[i]!;
    if (s.weatherFlag) return { slotIndex: i, reason: s.weatherFlag };
    if (s.options[s.chosen]!.place.wheelchair === null && (day as any).__wheelchair)
      return { slotIndex: i, reason: "Accessibility not verified for this stop." };
  }
  return null;
}

function shift(slots: Slot[], from: number, by: number) {
  return slots.map((s, i) =>
    i >= from ? { ...s, start: toHHMM(toMin(s.start) + by), end: toHHMM(toMin(s.end) + by) } : s,
  );
}

/** Build ranked Plan B options with minimal change, enforcing hard constraints in code. */
export function repair(day: PlanDay, t: Trigger, lateBy: number, c: Constraints): Candidate[] {
  const out: Candidate[] = [];
  const idx = Math.min(t.slotIndex, day.slots.length - 1);
  const backBy = toMin(c.backBy);
  const check = (d: PlanDay, cost: number): string | null => {
    const last = d.slots.at(-1);
    if (last && toMin(last.end) > backBy) return `Ends after ${c.backBy}, your back-at-hotel time`;
    if (c.spent + cost > c.budget) return "Goes over your total budget";
    if (c.wheelchair && d.slots.some((s) => s.options[s.chosen]!.place.wheelchair === false))
      return "Not wheelchair accessible";
    return null;
  };
  // 1) shorten flexible stops: absorb delay by trimming this and following stops
  {
    const slots = day.slots.map((s) => ({ ...s }));
    let remaining = lateBy;
    for (let i = idx; i < slots.length && remaining > 0; i++) {
      const s = slots[i]!;
      const dur = toMin(s.end) - toMin(s.start);
      const cut = Math.min(remaining, Math.max(0, dur - 30));
      slots[i] = {
        ...s,
        start: toHHMM(toMin(s.start) + remaining),
        end: toHHMM(toMin(s.end) + remaining - cut),
      };
      remaining -= cut;
      for (let j = i + 1; j < slots.length; j++)
        slots[j] = {
          ...slots[j]!,
          start: toHHMM(toMin(slots[j]!.start) + remaining),
          end: toHHMM(toMin(slots[j]!.end) + remaining),
        };
      if (remaining <= 0) break;
    }
    const d = { ...day, slots };
    out.push({
      id: "shorten",
      title: "Shorten the next stops",
      reason: "Keeps every stop; trims time at the following stops.",
      day: d,
      changed: 0,
      costDelta: 0,
      timeDelta: Math.max(0, remaining),
      match: 92,
      confidence: 1,
      rejected: check(d, 0),
    });
  }
  // 2) swap affected stop with nearest backup
  const s = day.slots[idx];
  if (s) {
    s.options.forEach((o, oi) => {
      if (oi === s.chosen) return;
      const slots = shift(day.slots, idx, lateBy).map((x, i) =>
        i === idx ? { ...x, chosen: oi, weatherFlag: null } : x,
      );
      const d = { ...day, slots };
      out.push({
        id: `swap-${oi}`,
        title: `Swap to ${o.place.name}`,
        reason: `A backup you were already shown, ${o.place.distanceKm.toFixed(1)} km from centre.`,
        day: d,
        changed: 1,
        costDelta: 0,
        timeDelta: lateBy,
        match: o.match,
        confidence: o.place.source === "google" ? 0.9 : 0.75,
        rejected:
          check(d, 0) ||
          (c.wheelchair && o.place.wheelchair === false ? "Not wheelchair accessible" : null),
      });
    });
  }
  // 3) drop the stop
  {
    const slots = day.slots.filter((_, i) => i !== idx);
    const d = { ...day, slots, legs: [] };
    out.push({
      id: "drop",
      title: `Skip ${s?.options[s.chosen]!.place.name ?? "this stop"}`,
      reason: "Frees the time; the rest of the day stays on schedule.",
      day: d,
      changed: 1,
      costDelta: 0,
      timeDelta: 0,
      match: 60,
      confidence: 1,
      rejected: check(d, 0),
    });
  }
  return out
    .sort(
      (a, b) =>
        (a.rejected ? 1 : 0) - (b.rejected ? 1 : 0) || a.changed - b.changed || b.match - a.match,
    )
    .slice(0, 4);
}

export type TrsWeights = { w1: number; w2: number; w3: number; w4: number };
export function trs(
  c: Candidate,
  totalConstraints = 4,
  w: TrsWeights = { w1: 0.25, w2: 0.25, w3: 0.25, w4: 0.25 },
) {
  const preserved = c.rejected ? totalConstraints - 1 : totalConstraints;
  const parts = {
    constraints: w.w1 * (preserved / totalConstraints),
    time: w.w2 * Math.min(1, c.timeDelta / 120),
    budget: w.w3 * Math.min(1, Math.abs(c.costDelta) / 1000),
    evidence: w.w4 * c.confidence,
  };
  return {
    score: +(parts.constraints - parts.time - parts.budget + parts.evidence).toFixed(3),
    parts,
  };
}

export function applyDay(plan: TripPlan, date: string, day: PlanDay): TripPlan {
  return { ...plan, days: plan.days.map((d) => (d.date === date ? day : d)) };
}
