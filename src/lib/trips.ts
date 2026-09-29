import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { TripInput, TripPlan } from "./travel-types";

export type TripRow = {
  id: string;
  status: string;
  destination: TripInput["destination"] | null;
  origin: TripInput["origin"];
  start_date: string | null;
  end_date: string | null;
  budget: number;
  currency: string;
  plan: TripPlan | null;
  input: TripInput | null;
  updated_at: string;
};

const CACHE = "rootify-trips-cache";

function readCache(): Record<string, TripRow> {
  try {
    return JSON.parse(localStorage.getItem(CACHE) ?? "{}");
  } catch {
    return {};
  }
}
function writeCache(rows: TripRow[], replace = false) {
  try {
    const c = replace ? {} : readCache();
    for (const r of rows) c[r.id] = r;
    localStorage.setItem(CACHE, JSON.stringify(c));
  } catch {
    /* storage full — ignore */
  }
}
function dropCache(id: string) {
  const c = readCache();
  delete c[id];
  localStorage.setItem(CACHE, JSON.stringify(c));
}

function toRow(r: any): TripRow {
  return {
    id: r.id,
    status: r.status,
    destination: r.destination,
    origin: r.origin,
    start_date: r.start_date,
    end_date: r.end_date,
    budget: Number(r.budget),
    currency: r.currency,
    plan: r.plan?.plan ?? null,
    input: r.plan?.input ?? null,
    updated_at: r.updated_at,
  };
}

function getValidUserId(rawId?: string): string {
  if (rawId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId)) {
    return rawId;
  }
  if (typeof window !== "undefined") {
    let stored = localStorage.getItem("rootify_user_uuid");
    if (stored && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stored)) {
      return stored;
    }
    stored = "00000000-0000-4000-8000-000000000001";
    try {
      localStorage.setItem("rootify_user_uuid", stored);
    } catch {
      // ignore
    }
    return stored;
  }
  return "00000000-0000-4000-8000-000000000001";
}

export async function listTrips(): Promise<{ rows: TripRow[]; offline: boolean }> {
  try {
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data && data.length > 0) {
      const rows = data.map(toRow);
      writeCache(rows, false);
      return { rows, offline: false };
    }
  } catch {
    // fallback to cache
  }
  const cached = Object.values(readCache()).sort((a, b) =>
    b.updated_at.localeCompare(a.updated_at),
  );
  return { rows: cached, offline: true };
}

export async function getTrip(id: string): Promise<{ row: TripRow; offline: boolean }> {
  try {
    const { data, error } = await supabase.from("trips").select("*").eq("id", id).maybeSingle();
    if (!error && data) {
      const row = toRow(data);
      writeCache([row]);
      return { row, offline: false };
    }
  } catch {
    // fallback to cache
  }
  const c = readCache()[id];
  if (c) return { row: c, offline: true };
  throw new Error("Trip not found");
}

export async function saveTrip(opts: {
  id?: string;
  status: "draft" | "planned";
  input: TripInput;
  plan: TripPlan | null;
}) {
  let userId = getValidUserId();
  try {
    const { data: u } = await supabase.auth.getUser();
    if (u?.user?.id) userId = getValidUserId(u.user.id);
  } catch {
    // ignore
  }

  const i = opts.input;
  const record = {
    user_id: userId,
    status: opts.status,
    origin: i.origin as unknown as Json,
    destination: i.destination as unknown as Json,
    start_date: i.startDate || null,
    end_date: i.endDate || null,
    day_start: i.dayStart,
    day_end: i.dayEnd,
    budget: i.budget,
    currency: i.currency,
    group_type: i.group,
    interests: i.interests,
    other_interest: i.otherInterest,
    transport: i.transport,
    less_walking: i.lessWalking,
    wheelchair: i.wheelchair,
    plan: { input: i, plan: opts.plan } as unknown as Json,
  };

  try {
    const q = opts.id
      ? supabase.from("trips").update(record).eq("id", opts.id).select("*").single()
      : supabase.from("trips").insert(record).select("*").single();
    const { data, error } = await q;
    if (!error && data) {
      const row = toRow(data);
      writeCache([row]);
      return row;
    }
  } catch {
    // ignore
  }

  const id = opts.id || `local_trip_${Date.now()}`;
  const localRow: TripRow = {
    id,
    status: opts.status,
    destination: i.destination,
    origin: i.origin,
    start_date: i.startDate || null,
    end_date: i.endDate || null,
    budget: i.budget,
    currency: i.currency,
    plan: opts.plan,
    input: i,
    updated_at: new Date().toISOString(),
  };
  writeCache([localRow]);
  return localRow;
}

export async function updatePlan(id: string, input: TripInput, plan: TripPlan) {
  const { data, error } = await supabase
    .from("trips")
    .update({ plan: { input, plan } as unknown as Json })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  writeCache([toRow(data)]);
}

export async function deleteTrip(id: string) {
  const { data, error } = await supabase.from("trips").select("*").eq("id", id).single();
  if (error) throw error;
  const { error: e2 } = await supabase.from("trips").delete().eq("id", id);
  if (e2) throw e2;
  dropCache(id);
  return data;
}

export async function restoreTrip(raw: any) {
  const { error } = await supabase.from("trips").insert(raw);
  if (error) throw error;
}

export function tripToIcs(row: TripRow) {
  const plan = row.plan;
  if (!plan) return "";
  const esc = (s: string) => s.replace(/[,;\\]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rootify//EN",
    `X-WR-TIMEZONE:${plan.destination.timezone}`,
  ];
  for (const d of plan.days) {
    for (const s of d.slots) {
      const p = s.options[s.chosen]?.place;
      if (!p) continue;
      const dt = (t: string) => `${d.date.replace(/-/g, "")}T${t.replace(":", "")}00`;
      lines.push(
        "BEGIN:VEVENT",
        `UID:${row.id}-${d.date}-${s.key}@rootify`,
        `DTSTAMP:${stamp}`,
        `DTSTART;TZID=${plan.destination.timezone}:${dt(s.start)}`,
        `DTEND;TZID=${plan.destination.timezone}:${dt(s.end)}`,
        `SUMMARY:${esc(`${s.label}: ${p.name}`)}`,
        `LOCATION:${esc(p.address ?? p.name)}`,
        `GEO:${p.lat};${p.lon}`,
        `URL:${p.mapsUrl}`,
        "END:VEVENT",
      );
    }
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
