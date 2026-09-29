import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { format, parseISO } from "date-fns";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CalendarPlus,
  CheckCircle2,
  CloudRain,
  Clock,
  ExternalLink,
  Layers,
  Loader2,
  Navigation,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { TripMap } from "@/components/trip-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n";
import { applyDay, detect, repair, toHHMM, toMin, trs, type Candidate } from "@/lib/repair";
import { generateMultiplePlans, recomputeLegs } from "@/lib/travel.functions";
import type { Leg, PlanDay, TripPlan } from "@/lib/travel-types";
import { getTrip, tripToIcs, updatePlan, type TripRow } from "@/lib/trips";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/trip/$id")({
  head: () => ({
    meta: [
      { title: "Your Itinerary — Rootify Your Travels" },
      { name: "description", content: "Your hour-by-hour verified travel plan." },
    ],
  }),
  component: TripPage,
});

function money(n: number | null | undefined, cur: string) {
  if (n == null) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: cur,
    maximumFractionDigits: 0,
  }).format(n);
}

function priceNum(p: string | null | undefined) {
  const m = p?.replace(/,/g, "").match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : 0;
}

function totals(plan: TripPlan) {
  const hotel = plan.hotels[plan.hotelChoice]?.place;
  const nights = Math.max(0, plan.days.length - 1);
  const hotelCost = priceNum(hotel?.price) * nights;
  const act = plan.days
    .flatMap((d) => d.slots)
    .reduce((s, x) => s + priceNum(x.options[x.chosen]?.place.price), 0);
  const tr = plan.days
    .flatMap((d) => d.legs)
    .reduce((s, l) => s + (l.options.find((o) => o.mode === l.chosen)?.cost ?? 0), 0);
  return { hotelCost, act, tr, total: hotelCost + act + tr, hotelPriced: !!hotel?.price };
}

function TripPage() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const [row, setRow] = useState<TripRow | null>(null);
  const [err, setErr] = useState(false);
  const [offline, setOffline] = useState(false);
  const [dayIdx, setDayIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<TripPlan[]>([]);
  const recompute = useServerFn(recomputeLegs);
  const genMultiple = useServerFn(generateMultiplePlans);

  // Alternative Itinerary Options State
  const [alternativeOptions, setAlternativeOptions] = useState<TripPlan[] | null>(null);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);

  // Live mode & Plan B
  const [live, setLive] = useState(false);
  const [demoOffset, setDemoOffset] = useState(0);
  const [realNow, setRealNow] = useState(() => new Date());
  const [stayingAt, setStayingAt] = useState<number | null>(null);
  const [log, setLog] = useState<Record<string, { arrived?: string; left?: string }>>({});
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [forcedPlanBReason, setForcedPlanBReason] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getTrip(id)
      .then((r) => {
        if (!mounted) return;
        setRow(r.row);
        setOffline(r.offline);
      })
      .catch(() => {
        if (mounted) setErr(true);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    const tTimer = setInterval(() => setRealNow(new Date()), 15000);
    return () => clearInterval(tTimer);
  }, []);

  const plan = row?.plan ?? null;
  const input = row?.input ?? null;
  const day = plan?.days[dayIdx];
  const cur = plan?.currency ?? "INR";
  const nowMin = realNow.getHours() * 60 + realNow.getMinutes() + demoOffset;
  const totalsData = plan ? totals(plan) : null;
  const hasHotel = !!plan?.hotels[plan.hotelChoice];

  async function persist(next: TripPlan, pushHistory = true) {
    if (!row || !input) return;
    if (pushHistory && row.plan) setHistory((h) => [...h, row.plan!]);
    setRow({ ...row, plan: next });
    try {
      await updatePlan(row.id, input, next);
    } catch {
      toast.error("Saved on this device only — couldn't reach the server.");
    }
  }

  async function relegs(p: TripPlan, d: PlanDay): Promise<PlanDay> {
    const hotel = p.hotels[p.hotelChoice]?.place;
    const stops = [hotel, ...d.slots.map((s) => s.options[s.chosen]!.place), hotel].filter(Boolean);
    if (stops.length < 2 || !input) return d;
    try {
      const legs = (await recompute({
        data: {
          stops,
          modes: input.transport,
          currency: cur,
          date: d.date,
          departs: ["07:40", ...d.slots.map((s) => s.end)],
        },
      })) as Leg[];
      return { ...d, legs };
    } catch {
      return d;
    }
  }

  async function changeDay(mut: (d: PlanDay) => PlanDay, recalc = true) {
    if (!plan || !day) return;
    setBusy(true);
    let d = mut(day);
    if (recalc) d = await relegs(plan, d);
    await persist(applyDay(plan, day.date, d));
    setBusy(false);
  }

  function move(i: number, dir: -1 | 1) {
    void changeDay((d) => {
      const j = i + dir;
      if (j < 0 || j >= d.slots.length) return d;
      const slots = d.slots.slice();
      const a = slots[i]!,
        b = slots[j]!;
      slots[i] = { ...b, start: a.start, end: a.end, label: a.label, key: a.key };
      slots[j] = { ...a, start: b.start, end: b.end, label: b.label, key: b.key };
      return { ...d, slots };
    });
  }

  async function switchHotel(i: number) {
    if (!plan) return;
    setBusy(true);
    const p = { ...plan, hotelChoice: i };
    const daysArr = [];
    for (const d of p.days) daysArr.push(await relegs(p, d));
    await persist({ ...p, days: daysArr });
    setBusy(false);
  }

  function undo() {
    const prev = history.at(-1);
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    void persist(prev, false);
    toast("Previous plan restored");
  }

  function downloadIcs() {
    if (!row) return;
    const blob = new Blob([tripToIcs(row)], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `rootify-${plan?.destination.name ?? "trip"}.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function loadAlternativeOptions() {
    if (!input) return;
    setLoadingAlternatives(true);
    try {
      const opts = await genMultiple({ data: input });
      setAlternativeOptions(opts);
      toast.success(`Generated ${opts.length} alternative plan options to compare!`);
    } catch {
      toast.error("Could not load alternative options.");
    } finally {
      setLoadingAlternatives(false);
    }
  }

  // Live detection & Plan B triggering
  const trigger = useMemo(() => {
    if (!live || !day) return null;
    if (forcedPlanBReason) {
      return {
        slotIndex: 1,
        reason: forcedPlanBReason,
      };
    }
    const tr = detect(day, nowMin, stayingAt);
    if (tr) return tr;
    const next = day.slots.findIndex(
      (s) =>
        toMin(s.start) + 10 < nowMin &&
        !log[`${day.date}-${s.key}`]?.arrived &&
        toMin(s.end) > nowMin,
    );
    if (next >= 0)
      return {
        slotIndex: next,
        reason: `Schedule delayed at ${day.slots[next]!.options[day.slots[next]!.chosen]!.place.name}; scheduled for ${day.slots[next]!.start}.`,
      };
    return null;
  }, [live, day, nowMin, stayingAt, log, forcedPlanBReason]);

  const candidates: Candidate[] = useMemo(() => {
    if (!trigger || !day || !plan || !input || !totalsData) return [];
    const lateBy =
      stayingAt != null
        ? Math.max(10, nowMin - toMin(day.slots[stayingAt]!.end))
        : Math.max(10, nowMin - toMin(day.slots[trigger.slotIndex]!.start));
    return repair(day, trigger, lateBy, {
      budget: input.budget,
      spent: totalsData.total,
      wheelchair: input.wheelchair,
      backBy: input.dayEnd,
    });
  }, [trigger, day, plan, input, totalsData, nowMin, stayingAt]);

  const triggerKey = trigger ? `${day?.date}-${trigger.slotIndex}-${trigger.reason}` : null;

  async function acceptPlanB(c: Candidate) {
    if (!plan || !day) return;
    setBusy(true);
    const d = await relegs(plan, c.day);
    await persist(applyDay(plan, day.date, d));
    setStayingAt(null);
    setForcedPlanBReason(null);
    setBusy(false);
    toast.success(`${t.planBTriggered || "Plan B Applied"}: ${c.changed} stops adjusted for smooth travel!`, {
      action: { label: "Undo", onClick: undo },
    });
  }

  if (err)
    return (
      <div className="space-y-3 p-6 text-center">
        <p className="text-destructive font-medium">Couldn't open this itinerary.</p>
        <Button asChild variant="outline">
          <Link to="/trips">{t.myTrips}</Link>
        </Button>
      </div>
    );

  if (!row)
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="animate-spin text-primary" /> {t.buildingPlan}…
      </div>
    );

  if (!plan || !day || !input || !totalsData)
    return (
      <div className="space-y-4 p-8 text-center">
        <p className="text-muted-foreground">This is a draft without a plan yet.</p>
        <Button asChild>
          <Link to="/plan">{t.createPlan}</Link>
        </Button>
      </div>
    );

  const hotel = plan.hotels[plan.hotelChoice];
  const spentPct = Math.min(100, (totalsData.total / Math.max(1, input.budget)) * 100);
  const stops = [hotel?.place, ...day.slots.map((s) => s.options[s.chosen]!.place)]
    .filter(Boolean)
    .map((p, i) => ({
      lat: p!.lat,
      lon: p!.lon,
      name: p!.name,
      label: hasHotel && i === 0 ? "H" : String(hasHotel ? i : i + 1),
      hotel: hasHotel && i === 0,
    }));

  return (
    <div className="space-y-6 pb-20">
      {offline && (
        <p role="status" className="rounded-xl border bg-muted/40 p-2.5 text-xs text-muted-foreground">
          Offline — showing your saved copy.
        </p>
      )}

      {/* Header */}
      <header className="space-y-2 rounded-3xl border bg-card p-6 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Navigation className="size-4" />
              </span>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {plan.origin ? `${plan.origin.name} → ` : ""}
                {plan.destination.name}
              </h1>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {format(parseISO(plan.days[0]!.date), "d MMM")} –{" "}
              {format(parseISO(plan.days.at(-1)!.date), "d MMM yyyy")} · {input.group} ·{" "}
              {input.transport.join(", ")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={downloadIcs} className="text-xs">
              <CalendarPlus className="mr-1.5 size-3.5" /> {t.addToCalendar || "Add to Calendar"}
            </Button>
            <Button
              size="sm"
              variant={live ? "default" : "outline"}
              onClick={() => setLive(!live)}
              className="text-xs font-semibold"
            >
              <Clock className="mr-1.5 size-3.5" /> {t.liveMode || "Live Mode & Plan B"}
            </Button>
            {history.length > 0 && (
              <Button size="sm" variant="ghost" onClick={undo} className="text-xs">
                {t.undoLastChange || "Undo"}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={loadAlternativeOptions}
              disabled={loadingAlternatives}
              className="text-xs border-primary/40 text-primary hover:bg-primary/10"
            >
              {loadingAlternatives ? (
                <Loader2 className="size-3.5 animate-spin mr-1" />
              ) : (
                <Layers className="size-3.5 mr-1" />
              )}
              {t.multipleOptionsTitle || "Compare Options"}
            </Button>
          </div>
        </div>

        {/* Alternative Plan Options Comparison Drawer (Requirement 5) */}
        {alternativeOptions && alternativeOptions.length > 0 && (
          <div className="mt-4 rounded-2xl border bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-4 text-primary" />
                {t.selectItineraryOption || "Switch to an Alternative Itinerary Option:"}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAlternativeOptions(null)}
                className="size-7 text-xs"
              >
                ✕
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {alternativeOptions.map((opt, oIdx) => (
                <div
                  key={opt.title || oIdx}
                  className="rounded-xl border bg-card p-3 text-xs space-y-1.5 shadow-2xs hover:border-primary/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <Badge variant="outline" className="text-[10px] mb-1">
                      {opt.planStyle || `Option ${oIdx + 1}`}
                    </Badge>
                    <h4 className="font-bold text-foreground leading-tight">{opt.title}</h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                      {opt.description}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="w-full h-7 text-[11px] mt-2 font-semibold"
                    onClick={async () => {
                      await persist(opt);
                      setAlternativeOptions(null);
                      toast.success(`Switched to "${opt.title}"!`);
                    }}
                  >
                    Switch to This Plan
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Weather Forecast */}
      <section aria-label="Weather" className="rounded-2xl border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <CloudRain className="size-4 text-primary" />
            {t.weatherForecast || "Weather Forecast & Climate"}
          </h2>
          {day.weather && (
            <span className="text-xs font-semibold text-primary">
              {day.weather.max}°C · {day.weather.label}
            </span>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 pt-1">
          {plan.days.map((d, i) => (
            <button
              key={d.date}
              onClick={() => setDayIdx(i)}
              aria-pressed={i === dayIdx}
              className={cn(
                "min-w-32 rounded-xl border p-2.5 text-left text-xs transition-all",
                i === dayIdx
                  ? "border-primary bg-primary/10 shadow-xs font-semibold"
                  : "bg-surface hover:bg-muted text-muted-foreground",
              )}
            >
              <span className="block font-bold text-foreground">
                Day {i + 1} · {format(parseISO(d.date), "EEE d MMM")}
              </span>
              {d.weather ? (
                <span className="text-[11px] mt-0.5 block">
                  {Math.round(d.weather.min)}°–{Math.round(d.weather.max)}°C · {d.weather.rain}% rain
                  <br />
                  <span className="text-foreground">{d.weather.label}</span>
                </span>
              ) : (
                <span className="text-muted-foreground">Weather ready</span>
              )}
            </button>
          ))}
        </div>

        {day.weather && (
          <p className="text-xs text-muted-foreground pt-1">
            {day.weather.advice} · Feels like {Math.round(day.weather.feels)}°C.
          </p>
        )}
      </section>

      {/* Budget Summary */}
      <section aria-label="Budget" className="rounded-2xl border bg-card p-4 space-y-2.5">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-foreground">
            {t.budgetSummary || "Budget Status"}: Spent {money(totalsData.total, cur)} of {money(input.budget, cur)}
          </span>
          <span
            className={
              totalsData.total > input.budget ? "text-destructive font-bold" : "text-emerald-600 font-bold"
            }
          >
            {totalsData.total > input.budget
              ? `Over by ${money(totalsData.total - input.budget, cur)}`
              : `${money(input.budget - totalsData.total, cur)} remaining`}
          </span>
        </div>
        <Progress value={spentPct} aria-label="Budget used" className="h-2" />
        <p className="text-[11px] text-muted-foreground">
          Hotel {totalsData.hotelPriced ? money(totalsData.hotelCost, cur) : "included"} · Sightseeing entry fees{" "}
          {money(totalsData.act, cur)} · Transport {money(totalsData.tr, cur)}.
        </p>
      </section>

      {/* Recommended Hotel */}
      <section aria-label="Hotel" className="rounded-2xl border bg-card p-4 space-y-3">
        <h2 className="font-display text-base font-bold text-foreground">
          {t.recommendedHotel || "Recommended Hotel / Base"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {plan.hotels.map((h, i) => (
            <button
              key={h.place.id}
              disabled={busy}
              onClick={() => i !== plan.hotelChoice && switchHotel(i)}
              className={cn(
                "rounded-xl border p-3 text-left text-xs transition-all",
                i === plan.hotelChoice
                  ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                  : "bg-surface hover:bg-muted",
              )}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="font-bold text-foreground leading-tight">{h.place.name}</span>
                {i === plan.hotelChoice && <CheckCircle2 className="size-4 text-primary shrink-0" />}
              </div>
              <span className="block text-[11px] text-muted-foreground mt-1">
                {h.place.rating ? `★ ${h.place.rating}` : "Rated"} · {h.place.price ?? "Verified rates"}
              </span>
              <span className="block text-[11px] text-primary/80 mt-1">{h.reason}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Live Mode Controls & Plan B Triggering (Requirement 4) */}
      {live && (
        <section
          aria-label="Live mode"
          className="rounded-2xl border border-primary/40 bg-card p-5 space-y-3 shadow-xs"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-foreground">
              {t.liveMode || "Live Mode"}: Current Time {toHHMM(((nowMin % 1440) + 1440) % 1440)}
            </span>
            <span className="text-muted-foreground ml-2">Simulate Timetable Shift:</span>
            {[15, 30, 60].map((m) => (
              <Button
                key={m}
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-xs"
                onClick={() => setDemoOffset(demoOffset + m)}
              >
                +{m} min
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs text-amber-600 border-amber-500/40"
              onClick={() => setForcedPlanBReason("Sudden rain shower forecast at outdoor sight.")}
            >
              <CloudRain className="mr-1 size-3" />
              Simulate Rain Delay
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs text-rose-600 border-rose-500/40"
              onClick={() => setForcedPlanBReason("Heavy holiday crowd & ticket queues reported.")}
            >
              <Users className="mr-1 size-3" />
              Simulate High Crowd
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => {
                setDemoOffset(0);
                setStayingAt(null);
                setForcedPlanBReason(null);
              }}
            >
              Reset
            </Button>
          </div>

          {trigger && triggerKey !== dismissed && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3" role="alert">
              <div className="flex items-center gap-2 font-bold text-amber-600 text-sm">
                <AlertTriangle className="size-4" />
                {t.planBTriggered || "Plan B Activated"}: {trigger.reason}
              </div>

              <div className="space-y-2">
                {candidates.map((c, i) => (
                  <div
                    key={c.id}
                    className={cn(
                      "rounded-xl border bg-card p-3.5 text-xs transition-all",
                      c.rejected ? "opacity-60" : "border-primary/40 shadow-xs",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-foreground text-sm">
                        {i === 0 ? "★ Recommended Plan B" : `Plan B Option ${i + 1}`}: {c.title}
                      </span>
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        {c.match}% Fit
                      </Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {c.reason} · {c.changed} stops adjusted · +{c.timeDelta} min · {money(c.costDelta, cur)}
                    </p>

                    {c.rejected ? (
                      <p className="mt-1.5 flex items-center gap-1 text-destructive">
                        <XCircle className="size-3.5" /> {c.rejected}
                      </p>
                    ) : (
                      <Button
                        size="sm"
                        className="mt-2.5 h-8 font-semibold shadow-xs"
                        disabled={busy}
                        onClick={() => acceptPlanB(c)}
                      >
                        Accept & Reroute Schedule
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => setDismissed(triggerKey)}
              >
                Keep Current Schedule
              </Button>
            </div>
          )}
        </section>
      )}

      {/* Day by Day Timetable (Requirement 4) */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
          <Clock className="size-5 text-primary" />
          {t.dayByDayItinerary || "Hour-by-Hour Timetable"} — Day {dayIdx + 1}
        </h2>

        <ol
          className="relative space-y-5 border-l-2 border-primary/30 pl-5"
          aria-label={`Day ${dayIdx + 1} timetable`}
        >
          {day.slots.map((s, i) => {
            const o = s.options[s.chosen]!;
            const leg = day.legs[hasHotel ? i : i - 1];
            const lk = `${day.date}-${s.key}`;
            const place = o.place;

            return (
              <li key={s.key + i} className="relative">
                <span
                  className="absolute -left-[1.85rem] top-1.5 size-3.5 rounded-full border-2 border-primary bg-background shadow-xs"
                  aria-hidden
                />

                {/* Available Vehicles / Transport Options */}
                {leg && (
                  <div className="mb-2.5 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[11px] font-semibold text-muted-foreground mr-1">
                      Transport:
                    </span>
                    {leg.options.map((m) => (
                      <button
                        key={m.mode}
                        disabled={busy}
                        aria-pressed={leg.chosen === m.mode}
                        onClick={() =>
                          changeDay(
                            (d) => ({
                              ...d,
                              legs: d.legs.map((l) => (l === leg ? { ...l, chosen: m.mode } : l)),
                            }),
                            false,
                          )
                        }
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-all",
                          leg.chosen === m.mode
                            ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                            : "bg-card text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {m.mode} · {m.minutes} min ({m.km.toFixed(1)} km)
                        {m.cost != null ? ` · ${money(m.cost, cur)}` : ""}
                      </button>
                    ))}
                  </div>
                )}

                <Card className="rounded-2xl border bg-card p-4 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                          {s.start} – {s.end}
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {s.label}
                        </span>
                      </div>
                      <h3 className="mt-1 font-display text-lg font-bold text-foreground">
                        {place.name}
                        {place.localName ? (
                          <span className="ml-1 text-xs text-muted-foreground font-normal">
                            ({place.localName})
                          </span>
                        ) : null}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {place.address || `${place.distanceKm.toFixed(1)} km from destination center`}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Move stop earlier"
                        disabled={busy || i === 0}
                        onClick={() => move(i, -1)}
                        className="size-7"
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Move stop later"
                        disabled={busy || i === day.slots.length - 1}
                        onClick={() => move(i, 1)}
                        className="size-7"
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Stop Metrics: Crowd, Weather, Entry Fee, Category */}
                  <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 pt-1 border-t">
                    <div className="rounded-lg bg-surface p-2 border">
                      <span className="text-[10px] text-muted-foreground block">Crowd Level</span>
                      <span className="font-bold text-foreground">{o.crowd || "Medium"}</span>
                    </div>
                    <div className="rounded-lg bg-surface p-2 border">
                      <span className="text-[10px] text-muted-foreground block">Entry Fee</span>
                      <span className="font-bold text-foreground">{place.price || "Free Entry"}</span>
                    </div>
                    <div className="rounded-lg bg-surface p-2 border">
                      <span className="text-[10px] text-muted-foreground block">Category</span>
                      <span className="font-bold text-foreground">{place.category}</span>
                    </div>
                    <div className="rounded-lg bg-surface p-2 border">
                      <span className="text-[10px] text-muted-foreground block">Opening Hours</span>
                      <span className="font-bold text-foreground truncate block">
                        {place.hoursText?.[0] || "09:00 - 18:00"}
                      </span>
                    </div>
                  </div>

                  {/* Reason & Match */}
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-primary">{o.match}% match</span> · {o.why}
                  </p>

                  {/* Actions & Links */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t text-xs">
                    <div className="flex items-center gap-2">
                      <a
                        className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                        href={place.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t.openInMaps} <ExternalLink className="size-3" />
                      </a>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        <CheckCircle2 className="inline size-3 mr-1 text-primary" />
                        {t.verifiedOnGoogle}
                      </span>
                    </div>

                    {live && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px]"
                          onClick={() => {
                            setLog({ ...log, [lk]: { ...log[lk], arrived: toHHMM(nowMin) } });
                            setStayingAt(i);
                          }}
                        >
                          {log[lk]?.arrived ? `Arrived ${log[lk]!.arrived}` : t.arrived}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px]"
                          onClick={() => {
                            setLog({ ...log, [lk]: { ...log[lk], left: toHHMM(nowMin) } });
                            setStayingAt(null);
                          }}
                        >
                          {log[lk]?.left ? `Left ${log[lk]!.left}` : t.leaving}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}

          {hasHotel && (
            <li className="text-xs font-semibold text-muted-foreground pt-2">
              {input.dayEnd} · Return to {hotel!.place.name} to relax
            </li>
          )}
        </ol>
      </section>

      {/* Map View */}
      <TripMap
        stops={stops}
        route={day.legs[0]?.geometry ?? null}
        className="h-80 overflow-hidden rounded-3xl border shadow-sm"
      />
    </div>
  );
}

export default TripPage;
