import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Category, Place, TransportMode, TripInput } from "./travel-types";

const geo = z.object({
  id: z.string(),
  name: z.string(),
  admin1: z.string().nullish(),
  country: z.string(),
  countryCode: z.string().nullish(),
  lat: z.number(),
  lon: z.number(),
  timezone: z.string(),
});

export const getServerTime = createServerFn({ method: "GET" }).handler(async () => {
  const now = new Date();
  return {
    iso: now.toISOString(),
    timestamp: now.getTime(),
    hours: now.getHours(),
  };
});

export const searchDestinations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ q: z.string().trim().min(2).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const { geocode } = await import("./travel.server");
    return geocode(data.q);
  });

export const searchNearbyPlaces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        centre: z.object({ lat: z.number(), lon: z.number(), name: z.string().max(120) }),
        category: z.string(),
        keyword: z.string().max(80).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { searchPlaces } = await import("./travel.server");
    return searchPlaces({
      centre: data.centre,
      category: data.category as Category,
      keyword: data.keyword || undefined,
    });
  });

export const destinationWeather = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ lat: z.number(), lon: z.number() }).parse(d))
  .handler(async ({ data }) => {
    const { currentWeather } = await import("./travel.server");
    return currentWeather(data);
  });

const tripInput = z.object({
  origin: geo.nullable(),
  destination: geo,
  startDate: z.string().date(),
  endDate: z.string().date(),
  dayStart: z.string().regex(/^\d\d:\d\d$/),
  dayEnd: z.string().regex(/^\d\d:\d\d$/),
  budget: z.number().min(0),
  currency: z.string().max(5),
  group: z.enum(["Solo", "Family", "Friends"]),
  interests: z.array(z.string()),
  otherInterest: z.string().max(120),
  transport: z.array(z.enum(["Walk", "Taxi", "Auto", "Bus", "Metro", "Own vehicle"])).min(1),
  lessWalking: z.boolean(),
  wheelchair: z.boolean(),
});

export const generatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => {
    const v = tripInput.parse(d);
    const days = (Date.parse(v.endDate) - Date.parse(v.startDate)) / 86400000 + 1;
    if (days < 1 || days > 10) throw new Error("Trips can be 1 to 10 days long.");
    return v as TripInput;
  })
  .handler(async ({ data }) => {
    const { buildPlan } = await import("./travel.server");
    return buildPlan(data);
  });

export const generateMultiplePlans = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => {
    const v = tripInput.parse(d);
    const days = (Date.parse(v.endDate) - Date.parse(v.startDate)) / 86400000 + 1;
    if (days < 1 || days > 10) throw new Error("Trips can be 1 to 10 days long.");
    return v as TripInput;
  })
  .handler(async ({ data }) => {
    const { buildMultiplePlans } = await import("./travel.server");
    return buildMultiplePlans(data);
  });

export const recomputeLegs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        stops: z.array(z.any()).min(2).max(12),
        modes: z.array(z.string()).min(1),
        currency: z.string(),
        date: z.string().date(),
        departs: z.array(z.string()),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { buildLegs } = await import("./travel.server");
    const r = await buildLegs(
      data.stops as Place[],
      data.modes as TransportMode[],
      data.currency,
      data.date,
      data.departs,
      { left: 6 },
    );
    if (r.geometry && r.legs[0]) r.legs[0].geometry = r.geometry;
    return r.legs;
  });

export const askGeminiTravelAgent = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        prompt: z.string().min(1).max(1000),
        destination: z.string().optional(),
        planSummary: z.string().optional(),
        language: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { askGeminiTravelAdvisor } = await import("./gemini.server");
    return askGeminiTravelAdvisor(data);
  });
