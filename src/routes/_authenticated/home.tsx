import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { addDays, format } from "date-fns";
import {
  Accessibility,
  AlertTriangle,
  ArrowRight,
  Bus,
  CalendarDays,
  Car,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  CloudRain,
  CloudSun,
  Compass,
  DollarSign,
  ExternalLink,
  FastForward,
  Footprints,
  Hotel,
  IndianRupee,
  Info,
  Loader2,
  MapPin,
  MessageSquare,
  Navigation,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Star,
  Sun,
  Train,
  Users,
  X,
  XCircle,
} from "lucide-react";
import React, { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { DestinationInput } from "@/components/destination-input";
import { RootifyDatePicker } from "@/components/rootify-date-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n";
import {
  applyPlanB,
  calculateTravelRepairScore,
  detectDayRepairs,
  type PlanBAlternative,
  type RepairTrigger,
  type TravelRepairScore,
} from "@/lib/travel-repair";
import { destinationWeather, generatePlan, getServerTime } from "@/lib/travel.functions";
import type {
  Category,
  DayWeather,
  GeoPlace,
  Place,
  PlanDay,
  Slot,
  TransportMode,
  TripInput,
  TripPlan,
} from "@/lib/travel-types";
import { listTrips, saveTrip } from "@/lib/trips";
import { displayName, greetingFor, useSession } from "@/lib/use-session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home — Rootify" },
      {
        name: "description",
        content: "Plan real travel with live weather, hotels, and adaptive itinerary repair.",
      },
    ],
  }),
  component: HomePage,
});

const DEFAULT_ORIGIN: GeoPlace = {
  id: "chennai_origin",
  name: "Chennai",
  admin1: "Tamil Nadu",
  country: "India",
  countryCode: "IN",
  lat: 13.0827,
  lon: 80.2707,
  timezone: "Asia/Kolkata",
};

const DEFAULT_DESTINATION: GeoPlace = {
  id: "madurai_dest",
  name: "Madurai",
  admin1: "Tamil Nadu",
  country: "India",
  countryCode: "IN",
  lat: 9.9252,
  lon: 78.1198,
  timezone: "Asia/Kolkata",
};

const DESTINATION_IDEAS = [
  {
    name: "Madurai",
    country: "India",
    tagline: "Meenakshi Temple & Cultural Heartland",
    geo: DEFAULT_DESTINATION,
  },
  {
    name: "Puducherry",
    country: "India",
    tagline: "French Colonial Promenade & Beaches",
    geo: {
      id: "puducherry_dest",
      name: "Puducherry",
      admin1: "Puducherry",
      country: "India",
      countryCode: "IN",
      lat: 11.9416,
      lon: 79.8083,
      timezone: "Asia/Kolkata",
    },
  },
  {
    name: "Chennai",
    country: "India",
    tagline: "Marina Beach, Kapaleeshwarar & Fort St. George",
    geo: DEFAULT_ORIGIN,
  },
  {
    name: "Tokyo",
    country: "Japan",
    tagline: "Historic Asakusa & Modern Urban Wonders",
    geo: {
      id: "tokyo_dest",
      name: "Tokyo",
      admin1: "Tokyo",
      country: "Japan",
      countryCode: "JP",
      lat: 35.6762,
      lon: 139.6503,
      timezone: "Asia/Tokyo",
    },
  },
];

const INTEREST_KEYS = ["Heritage", "Food", "Beach", "Shopping", "Culture", "Other"] as const;

const TRANSPORT_MODES_LIST: TransportMode[] = [
  "Walk",
  "Taxi",
  "Auto",
  "Bus",
  "Metro",
  "Own vehicle",
];

function TransportIcon({ mode }: { mode: TransportMode }) {
  if (mode === "Walk") return <Footprints className="size-3.5" />;
  if (mode === "Bus") return <Bus className="size-3.5" />;
  if (mode === "Metro") return <Train className="size-3.5" />;
  return <Car className="size-3.5" />;
}

export function HomePage() {
  const { t, language, formatDate } = useI18n();
  const { session } = useSession();
  const runPlan = useServerFn(generatePlan);
  const fetchServerTime = useServerFn(getServerTime);
  const fetchWeather = useServerFn(destinationWeather);

  // Live Clock & Server Time Synchronization
  const [clock, setClock] = useState<Date>(new Date());
  const serverOffsetRef = useRef<number>(0);

  // Origin live weather
  const [originWeather, setOriginWeather] = useState<{ temp: number; label: string } | null>({
    temp: 31,
    label: "Hot",
  });

  useEffect(() => {
    fetchServerTime()
      .then((res) => {
        if (res?.timestamp) {
          serverOffsetRef.current = res.timestamp - Date.now();
          setClock(new Date(Date.now() + serverOffsetRef.current));
        }
      })
      .catch(() => null);

    const interval = setInterval(() => {
      setClock(new Date(Date.now() + serverOffsetRef.current));
    }, 1000);
    return () => clearInterval(interval);
  }, [fetchServerTime]);

  // Trip Setup Form State
  const [origin, setOrigin] = useState<GeoPlace | null>(DEFAULT_ORIGIN);
  const [destination, setDestination] = useState<GeoPlace | null>(DEFAULT_DESTINATION);
  const [startDate, setStartDate] = useState<Date | undefined>(() => addDays(new Date(), 1));
  const [endDate, setEndDate] = useState<Date | undefined>(() => addDays(new Date(), 3));
  const [dayStart, setDayStart] = useState("08:00");
  const [dayEnd, setDayEnd] = useState("21:30");
  const [budget, setBudget] = useState<number>(25000);
  const [currency, setCurrency] = useState("INR");
  const [group, setGroup] = useState<"Solo" | "Family" | "Friends">("Family");
  const [interests, setInterests] = useState<string[]>(["Heritage", "Food", "Beach", "Culture"]);
  const [otherInterest, setOtherInterest] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [transport, setTransport] = useState<TransportMode[]>([
    "Walk",
    "Taxi",
    "Auto",
    "Bus",
    "Metro",
  ]);
  const [lessWalking, setLessWalking] = useState(false);
  const [wheelchair, setWheelchair] = useState(false);

  // Building & Plan State
  const [building, setBuilding] = useState(false);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Live Mode & Demo Clock Simulation State (Section 10)
  const [demoClockActive, setDemoClockActive] = useState(false);
  const [demoSimulatedTime, setDemoSimulatedTime] = useState("11:15");
  const [stopStatusMap, setStopStatusMap] = useState<
    Record<string, { arrived?: boolean; leaving?: boolean; delayMinutes: number }>
  >({});
  const [reportedClosed, setReportedClosed] = useState<Set<string>>(new Set());

  // Plan B Repair State & Undo Stack
  const [activeTrigger, setActiveTrigger] = useState<RepairTrigger | null>(null);
  const [alternatives, setAlternatives] = useState<PlanBAlternative[]>([]);
  const [planHistory, setPlanHistory] = useState<TripPlan[]>([]);
  const [lastTRS, setLastTRS] = useState<TravelRepairScore | null>(null);

  const plannerFormRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Fetch origin current weather
  useEffect(() => {
    if (origin) {
      fetchWeather({ data: { lat: origin.lat, lon: origin.lon } })
        .then((w) => {
          if (w) setOriginWeather(w);
        })
        .catch(() => null);
    }
  }, [origin, fetchWeather]);

  // Load saved trip on mount
  useEffect(() => {
    listTrips()
      .then((res) => {
        const found = res.rows.find((r) => r.plan);
        if (found?.plan) {
          setPlan(found.plan);
        }
      })
      .catch(() => null);
  }, []);

  function toggleInterest(i: string) {
    if (i === "Other") {
      setShowOtherInput(!showOtherInput);
      if (!interests.includes("Other")) {
        setInterests([...interests, "Other"]);
      } else {
        setInterests(interests.filter((item) => item !== "Other"));
      }
      return;
    }
    setInterests((prev) => (prev.includes(i) ? prev.filter((item) => item !== i) : [...prev, i]));
  }

  function toggleTransport(m: TransportMode) {
    setTransport((prev) =>
      prev.includes(m)
        ? prev.length > 1
          ? prev.filter((item) => item !== m)
          : prev
        : [...prev, m],
    );
  }

  // Section 6: Create Plan
  async function handleCreatePlan(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!destination) {
      toast.error("Please enter a destination.");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Please select start and end dates.");
      return;
    }
    if (endDate < startDate) {
      toast.error("End date must be on or after start date.");
      return;
    }
    if (interests.length === 0) {
      toast.error("Please select at least one interest.");
      return;
    }

    setBuilding(true);

    const tripInput: TripInput = {
      origin,
      destination,
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
      dayStart,
      dayEnd,
      budget: Number(budget) || 25000,
      currency,
      group,
      interests,
      otherInterest: otherInterest.trim(),
      transport,
      lessWalking,
      wheelchair,
    };

    const startTime = Date.now();

    try {
      const generated = await runPlan({ data: tripInput });
      const elapsed = Date.now() - startTime;
      if (elapsed < 1200) {
        await new Promise((r) => setTimeout(r, 1200 - elapsed));
      }

      setPlan(generated);
      setSelectedDayIndex(0);
      setActiveTrigger(null);
      setAlternatives([]);
      setLastTRS(null);

      // Save to database/localStorage
      await saveTrip({
        status: "planned",
        input: tripInput,
        plan: generated,
      }).catch(() => null);

      toast.success(`Complete itinerary generated for ${destination.name}!`);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      toast.error(err?.message || "Could not generate plan. Please try again.");
    } finally {
      setBuilding(false);
    }
  }

  // Section 6: Save Draft
  async function handleSaveDraft() {
    if (!destination || !startDate || !endDate) {
      toast.error("Please fill in destination and dates to save draft.");
      return;
    }
    const tripInput: TripInput = {
      origin,
      destination,
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
      dayStart,
      dayEnd,
      budget: Number(budget) || 25000,
      currency,
      group,
      interests,
      otherInterest: otherInterest.trim(),
      transport,
      lessWalking,
      wheelchair,
    };

    try {
      await saveTrip({
        status: "draft",
        input: tripInput,
        plan,
      });
      toast.success("Draft saved successfully. Continue anytime from My Trips!");
    } catch {
      toast.error("Could not save draft.");
    }
  }

  // Section 8: User chooses slot option
  function handleSelectSlotOption(dayIdx: number, slotKey: string, optIdx: number) {
    if (!plan) return;
    const updatedDays = plan.days.map((d, di) => {
      if (di !== dayIdx) return d;
      return {
        ...d,
        slots: d.slots.map((s) => (s.key === slotKey ? { ...s, chosen: optIdx } : s)),
      };
    });
    setPlan({ ...plan, days: updatedDays });
    toast.success("Stop updated! Nearby suggestions and routing refreshed.");
  }

  // Section 8: Switching hotel updates budget
  function handleSelectHotel(hotelIdx: number) {
    if (!plan) return;
    setPlan({ ...plan, hotelChoice: hotelIdx });
    toast.success(`Hotel changed to ${plan.hotels[hotelIdx]?.place.name}`);
  }

  // Section 9: User picks transport mode per leg
  function handleSelectLegMode(dayIdx: number, legIdx: number, mode: TransportMode) {
    if (!plan) return;
    const updatedDays = plan.days.map((d, di) => {
      if (di !== dayIdx) return d;
      return {
        ...d,
        legs: d.legs.map((l, li) => (li === legIdx ? { ...l, chosen: mode } : l)),
      };
    });
    setPlan({ ...plan, days: updatedDays });
    toast.success(`Travel leg updated to ${mode}`);
  }

  // Section 10: Live Detection & Demo Clock triggers
  function checkRepairTriggers(
    simTime: string,
    delays: Record<string, number>,
    closedPlaces: Set<string>,
  ) {
    if (!plan || !plan.days[selectedDayIndex]) return;
    const curDay = plan.days[selectedDayIndex]!;
    const { trigger, alternatives: alts } = detectDayRepairs(
      curDay,
      simTime,
      delays,
      closedPlaces,
      {
        maxBudget: budget,
        requiresWheelchair: wheelchair,
        hotelReturnTime: dayEnd,
      },
      curDay.weather,
    );

    setActiveTrigger(trigger);
    setAlternatives(alts);
  }

  function handleTriggerDelaySimulation(slotKey: string, minutes: number) {
    const nextDelays = {
      ...stopStatusMap,
      [slotKey]: {
        ...(stopStatusMap[slotKey] || { delayMinutes: 0 }),
        delayMinutes: (stopStatusMap[slotKey]?.delayMinutes || 0) + minutes,
      },
    };
    setStopStatusMap(nextDelays);

    // Fast-forward demo clock
    const [h, m] = demoSimulatedTime.split(":").map(Number);
    const newTotal = (h || 11) * 60 + (m || 0) + minutes;
    const nextSimTime = `${Math.floor(newTotal / 60)
      .toString()
      .padStart(2, "0")}:${(newTotal % 60).toString().padStart(2, "0")}`;
    setDemoSimulatedTime(nextSimTime);

    const delaysRecord: Record<string, number> = {};
    for (const [k, v] of Object.entries(nextDelays)) delaysRecord[k] = v.delayMinutes;

    checkRepairTriggers(nextSimTime, delaysRecord, reportedClosed);
    toast.warning(`Demo Clock: Time advanced by ${minutes}m. Analyzing timetable...`);
  }

  function handleAcceptPlanB(alt: PlanBAlternative) {
    if (!plan || !activeTrigger) return;
    const curDay = plan.days[selectedDayIndex]!;

    // Save current plan in undo stack
    setPlanHistory((prev) => [...prev, plan]);

    const repairedDay = applyPlanB(curDay, activeTrigger.slotKey, alt);
    const trs = calculateTravelRepairScore(curDay, repairedDay);
    setLastTRS(trs);

    const nextDays = plan.days.map((d, di) => (di === selectedDayIndex ? repairedDay : d));
    setPlan({ ...plan, days: nextDays });

    setActiveTrigger(null);
    setAlternatives([]);
    toast.success("Plan B applied seamlessly! Itinerary repaired without breaking constraints.");
  }

  function handleUndoRepair() {
    if (planHistory.length === 0) return;
    const prevPlan = planHistory[planHistory.length - 1]!;
    setPlanHistory((prev) => prev.slice(0, prev.length - 1));
    setPlan(prevPlan);
    setLastTRS(null);
    setActiveTrigger(null);
    toast.info("Itinerary restored to previous version (Undo).");
  }

  // Budget calculations
  const numDays = plan?.days.length ?? 1;
  const numNights = Math.max(1, numDays - 1);
  const selectedHotel = plan?.hotels[plan.hotelChoice ?? 0]?.place;
  const hotelNightly = selectedHotel?.price
    ? Number(selectedHotel.price.replace(/[^\d]/g, "")) || 4200
    : 4200;
  const totalHotelCost = numNights * hotelNightly;
  const estimatedFoodCost =
    numDays * (group === "Family" ? 1800 : group === "Friends" ? 1400 : 800);

  const activityTicketCosts =
    plan?.days.reduce((acc, d) => {
      const dayTotal = d.slots.reduce((sAcc, s) => {
        const priceStr = s.options[s.chosen]?.place.price ?? "";
        const m = priceStr.match(/\d+/);
        return sAcc + (m ? Number(m[0]) : 0);
      }, 0);
      return acc + dayTotal;
    }, 0) ?? 450;

  const totalCalculatedSpend = totalHotelCost + estimatedFoodCost + activityTicketCosts;
  const userBudget = budget || 25000;
  const budgetDifference = userBudget - totalCalculatedSpend;
  const isWithinBudget = budgetDifference >= 0;
  const budgetPercent = Math.min(100, Math.round((totalCalculatedSpend / userBudget) * 100));

  const currentDay = plan?.days[selectedDayIndex];

  return (
    <div className="space-y-8">
      {/* SECTION 4 & 5: Greeting, Live Date & Clock Header */}
      <section aria-labelledby="greet" className="rounded-2xl border bg-card p-6 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h1
              id="greet"
              className="font-display text-3xl font-semibold tracking-tight sm:text-4xl text-foreground"
            >
              {greetingFor(clock)}, {displayName(session)}
            </h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">{formatDate(clock)}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Origin Weather Chip */}
            {origin && (
              <div className="flex items-center gap-1.5 rounded-full border bg-surface px-3 py-1 text-xs font-semibold text-muted-foreground">
                <MapPin className="size-3.5 text-primary" />
                <span>
                  {origin.name} {originWeather?.temp}°C
                </span>
              </div>
            )}

            {/* Live Clock */}
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Clock className="size-3.5 animate-pulse" aria-hidden />
              <time aria-live="off">{clock.toLocaleTimeString()}</time>
            </div>
          </div>
        </div>

        {/* Current Trip & Next Stop Banner */}
        {plan && currentDay && (
          <div className="mt-5 rounded-xl border bg-surface/70 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  Today's Active Journey · {plan.destination.name}
                </span>
                <p className="text-base font-semibold text-foreground mt-0.5">
                  Next Stop: {currentDay.slots[0]?.options[currentDay.slots[0].chosen]?.place.name}{" "}
                  ({currentDay.slots[0]?.start})
                </p>
                <p className="text-xs text-muted-foreground">
                  Day {selectedDayIndex + 1} · {currentDay.slots.length} stops planned ·{" "}
                  {currentDay.weather?.label || "Good weather"}
                </p>
              </div>

              {/* Arrived / Leaving tracker buttons (Section 10) */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-semibold"
                  onClick={() => {
                    const firstKey = currentDay.slots[0]?.key || "s0";
                    setStopStatusMap((prev) => ({
                      ...prev,
                      [firstKey]: { ...(prev[firstKey] || { delayMinutes: 0 }), arrived: true },
                    }));
                    toast.success("Recorded arrival! Timing synchronized with itinerary.");
                  }}
                >
                  <Check className="mr-1 size-3 text-emerald-600" />
                  {t.arrived}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-semibold"
                  onClick={() => {
                    const firstKey = currentDay.slots[0]?.key || "s0";
                    setStopStatusMap((prev) => ({
                      ...prev,
                      [firstKey]: { ...(prev[firstKey] || { delayMinutes: 0 }), leaving: true },
                    }));
                    toast.info("Recorded departure! Checking transit time to next stop.");
                  }}
                >
                  <Navigation className="mr-1 size-3 text-primary" />
                  {t.leaving}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions & Destination Ideas */}
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t text-xs">
          <span className="font-semibold text-muted-foreground mr-1">Quick Ideas:</span>
          {DESTINATION_IDEAS.map((idea) => (
            <button
              key={idea.name}
              type="button"
              onClick={() => {
                setDestination(idea.geo);
                toast.info(`Destination set to ${idea.name}`);
              }}
              className="rounded-full border bg-surface px-2.5 py-1 text-xs font-medium text-foreground transition-all hover:border-primary hover:text-primary"
            >
              {idea.name}
            </button>
          ))}
        </div>
      </section>

      {/* SECTION 6: Trip Setup Form */}
      <section
        ref={plannerFormRef}
        aria-labelledby="trip-setup"
        className="rounded-2xl border bg-card p-6 shadow-xs"
      >
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" aria-hidden />
              <h2 id="trip-setup" className="font-display text-2xl font-semibold">
                {t.planYourJourney}
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Worldwide travel planning with real opening hours, verifiable stops, and live repair.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              className="text-xs font-medium"
            >
              {t.saveDraft}
            </Button>
          </div>
        </div>

        <form onSubmit={handleCreatePlan} className="space-y-6">
          {/* Origin & Destination with Worldwide Autocomplete */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <DestinationInput
                label={t.origin}
                value={origin}
                onChange={setOrigin}
                placeholder="e.g. Chennai, London, New York"
              />
            </div>
            <div>
              <DestinationInput
                label={t.destination}
                value={destination}
                onChange={setDestination}
                placeholder="e.g. Madurai, Tokyo, Paris"
              />
            </div>
          </div>

          {/* Dates & Daily Hours */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="space-y-1.5 sm:col-span-1">
              <Label>{t.startDate}</Label>
              <RootifyDatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Start Date"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-1">
              <Label>{t.endDate}</Label>
              <RootifyDatePicker value={endDate} onChange={setEndDate} placeholder="End Date" />
            </div>
            <div className="space-y-1.5 sm:col-span-1">
              <Label>{t.startTime}</Label>
              <Input
                type="time"
                value={dayStart}
                onChange={(e) => setDayStart(e.target.value)}
                className="h-11 bg-surface font-medium"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-1">
              <Label>{t.endTime}</Label>
              <Input
                type="time"
                value={dayEnd}
                onChange={(e) => setDayEnd(e.target.value)}
                className="h-11 bg-surface font-medium"
              />
            </div>
          </div>

          {/* Budget with Live Balance Bar & Group Type */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="budget">
                  {t.budget} ({currency})
                </Label>
                <span className="text-xs text-muted-foreground font-semibold">
                  Remaining bar: ₹{Math.max(0, userBudget - totalCalculatedSpend).toLocaleString()}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-3 font-semibold text-muted-foreground">₹</span>
                <Input
                  id="budget"
                  type="number"
                  min={1000}
                  step={500}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="h-11 bg-surface pl-8 font-medium"
                  placeholder="25000"
                />
              </div>
              {/* Live Remaining Balance Bar */}
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    isWithinBudget ? "bg-primary" : "bg-rose-500",
                  )}
                  style={{ width: `${budgetPercent}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t.groupType}</Label>
              <div role="radiogroup" aria-label="Group type" className="grid grid-cols-3 gap-2">
                {(["Solo", "Family", "Friends"] as const).map((g) => (
                  <Button
                    key={g}
                    type="button"
                    variant={group === g ? "default" : "outline"}
                    className={cn("h-11 font-medium transition-all", group === g && "shadow-xs")}
                    onClick={() => setGroup(g)}
                  >
                    {g === "Solo" ? t.solo : g === "Family" ? t.family : t.friends}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Interests & "Other" text input */}
          <div className="space-y-2">
            <Label>{t.interests}</Label>
            <div role="group" aria-label="Interests" className="flex flex-wrap gap-2">
              {INTEREST_KEYS.map((k) => {
                const active = interests.includes(k);
                const label =
                  k === "Heritage"
                    ? t.heritage
                    : k === "Food"
                      ? t.food
                      : k === "Beach"
                        ? t.beach
                        : k === "Shopping"
                          ? t.shopping
                          : k === "Culture"
                            ? t.culture
                            : t.other;

                return (
                  <Button
                    key={k}
                    type="button"
                    size="sm"
                    variant={active ? "default" : "outline"}
                    className={cn(
                      "rounded-full px-4 text-xs font-semibold transition-all",
                      active && "ring-2 ring-primary ring-offset-1",
                    )}
                    aria-pressed={active}
                    onClick={() => toggleInterest(k)}
                  >
                    {active && <Check className="mr-1 size-3.5" aria-hidden />}
                    {label}
                  </Button>
                );
              })}
            </div>

            {/* Custom Other Interest Input */}
            {(showOtherInput || interests.includes("Other")) && (
              <div className="mt-2 space-y-1 animate-in fade-in-50">
                <Label htmlFor="other-interest" className="text-xs text-muted-foreground">
                  Specify custom interest (AI converts this into real OpenStreetMap tags)
                </Label>
                <Input
                  id="other-interest"
                  placeholder={t.otherPlaceholder}
                  value={otherInterest}
                  onChange={(e) => setOtherInterest(e.target.value)}
                  className="h-10 bg-surface text-sm"
                />
              </div>
            )}
          </div>

          {/* Transport Modes Selection */}
          <div className="space-y-2">
            <Label>{t.transportModes}</Label>
            <div className="flex flex-wrap gap-2">
              {TRANSPORT_MODES_LIST.map((m) => {
                const active = transport.includes(m);
                return (
                  <Button
                    key={m}
                    type="button"
                    size="sm"
                    variant={active ? "default" : "outline"}
                    className={cn(
                      "rounded-lg text-xs font-medium transition-all gap-1.5",
                      active && "bg-muted text-foreground border-primary",
                    )}
                    onClick={() => toggleTransport(m)}
                  >
                    <TransportIcon mode={m} />
                    <span>{m}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 gap-4 rounded-xl border bg-muted/40 p-4 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label
                  htmlFor="less-walking"
                  className="flex items-center gap-1.5 text-sm font-medium cursor-pointer"
                >
                  <Footprints className="size-4 text-primary" aria-hidden />
                  {t.preferLessWalking}
                </Label>
                <p className="text-xs text-muted-foreground">
                  Favour closer stops and short vehicle legs
                </p>
              </div>
              <Switch id="less-walking" checked={lessWalking} onCheckedChange={setLessWalking} />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label
                  htmlFor="wheelchair"
                  className="flex items-center gap-1.5 text-sm font-medium cursor-pointer"
                >
                  <Accessibility className="size-4 text-primary" aria-hidden />
                  {t.requiresWheelchair}
                </Label>
                <p className="text-xs text-muted-foreground">
                  Strictly prioritize step-free access and verified entrances
                </p>
              </div>
              <Switch id="wheelchair" checked={wheelchair} onCheckedChange={setWheelchair} />
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              size="lg"
              className="h-12 flex-1 text-base font-semibold shadow-md transition-all hover:shadow-lg"
              disabled={building}
            >
              {building ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
                  {t.buildingPlan}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-5" aria-hidden />
                  {t.createPlan}
                </>
              )}
            </Button>
          </div>
        </form>
      </section>

      {/* SECTION 7, 8, 9 & 10: Generated Plan & Vertical Timeline */}
      {plan && (
        <div ref={resultsRef} id="results" className="space-y-8 animate-in fade-in-50 duration-500">
          {/* Header & Day Selector */}
          <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-3xl font-bold tracking-tight">
                  {plan.destination.name} Itinerary
                </h2>
                <Badge variant="outline" className="text-xs font-semibold">
                  {plan.days.length} Days
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {plan.days[0]?.date} → {plan.days[plan.days.length - 1]?.date} · Verified on{" "}
                {plan.days[0]?.slots[0]?.options[0]?.place.source === "google"
                  ? "Google Places"
                  : "OpenStreetMap"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/map">
                  <MapPin className="mr-1.5 size-4 text-primary" />
                  {t.map}
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/trips">
                  <Compass className="mr-1.5 size-4" />
                  {t.myTrips}
                </Link>
              </Button>
            </div>
          </div>

          {/* SECTION 7: Side-by-Side Weather Card */}
          <Card className="overflow-hidden border p-5 shadow-xs bg-gradient-to-br from-card to-muted/20">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="size-5 text-amber-500" />
                <h3 className="font-display text-xl font-semibold">{t.weatherForecast}</h3>
              </div>
              {/* Origin vs Destination side-by-side chip */}
              <div className="text-xs font-medium text-muted-foreground">
                <span>
                  You: {origin?.name || "Origin"} {originWeather?.temp}°C
                </span>
                <span className="mx-1.5">·</span>
                <span className="font-bold text-foreground">
                  {plan.destination.name}: {currentDay?.weather?.max || 34}°C (
                  {currentDay?.weather?.label || "Hot"})
                </span>
              </div>
            </div>

            {/* Days Weather Bar */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {plan.days.map((d, idx) => {
                const w = d.weather;
                const isTypical = !w || w.kind === "Typical";
                return (
                  <div
                    key={d.date}
                    onClick={() => setSelectedDayIndex(idx)}
                    className={cn(
                      "cursor-pointer rounded-xl border p-3 transition-all",
                      selectedDayIndex === idx
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "bg-surface hover:bg-muted/40",
                    )}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>
                        Day {idx + 1} ({d.date.slice(5)})
                      </span>
                      {w?.label === "Rainy" ? (
                        <CloudRain className="size-4 text-sky-500" />
                      ) : (
                        <Sun className="size-4 text-amber-500" />
                      )}
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-xl font-bold">{w ? `${w.max}°C` : "30°C"}</span>
                      <span className="text-xs text-muted-foreground">
                        / {w ? `${w.min}°C` : "24°C"}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-tight">
                      {w?.advice ||
                        (isTypical
                          ? `Typical weather for ${plan.destination.name}`
                          : "Ideal conditions")}
                    </p>
                    {isTypical && (
                      <span className="mt-1 inline-block text-[9px] font-semibold text-amber-700 bg-amber-50 px-1 py-0.5 rounded">
                        Typical Climate
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* SECTION 10: Live Itinerary Repair & Demo Clock Banner */}
          <Card className="border border-primary/30 bg-primary/5 p-4 shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="size-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">
                    Constraint-Preserving Live Repair (Plan B Engine)
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Simulate running late or test unexpected delays using the Demo Clock. Plan B
                  triggers automatically without violating constraints.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDemoClockActive(!demoClockActive)}
                  className="h-8 text-xs font-semibold bg-surface"
                >
                  <Clock className="mr-1.5 size-3.5 text-primary" />
                  Demo Clock ({demoSimulatedTime})
                </Button>
                {planHistory.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleUndoRepair}
                    className="h-8 text-xs font-semibold bg-surface text-amber-800"
                  >
                    <RotateCcw className="mr-1.5 size-3.5" />
                    {t.undoRepair}
                  </Button>
                )}
              </div>
            </div>

            {/* Demo Clock Control Panel */}
            {demoClockActive && (
              <div className="mt-3 rounded-lg border bg-surface p-3 space-y-2 animate-in fade-in-50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold">Simulate Delay at:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentDay?.slots.slice(0, 3).map((s) => (
                      <Button
                        key={s.key}
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px]"
                        onClick={() => handleTriggerDelaySimulation(s.key, 45)}
                      >
                        +45m delay at {s.label}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] text-rose-700 hover:bg-rose-50"
                      onClick={() => {
                        const firstId = currentDay?.slots[0]?.options[0]?.place.id;
                        if (firstId) {
                          const s = new Set(reportedClosed);
                          s.add(firstId);
                          setReportedClosed(s);
                          checkRepairTriggers(demoSimulatedTime, {}, s);
                          toast.error("Simulated: Stop reported closed!");
                        }
                      }}
                    >
                      Report stop closed
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Plan B Trigger & Ranked Alternatives Notification */}
            {activeTrigger && (
              <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50/80 p-4 space-y-3 animate-in slide-in-from-top-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-900">
                      Itinerary Variance Detected: {activeTrigger.message}
                    </h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Rootify Minimal-Change Repair engine ranked 3 alternative options below. Hard
                      constraints (budget, wheelchair accessibility, opening hours, hotel return)
                      are preserved.
                    </p>
                  </div>
                </div>

                {/* Ranked Plan B List */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {alternatives.map((alt) => (
                    <div
                      key={alt.id}
                      className={cn(
                        "rounded-lg border p-3 flex flex-col justify-between bg-surface",
                        !alt.isValid && "opacity-60 bg-muted/30 border-dashed",
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span
                            className={
                              alt.isValid
                                ? "text-foreground font-bold"
                                : "text-muted-foreground line-through"
                            }
                          >
                            {alt.title}
                          </span>
                          {alt.isValid ? (
                            <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                              {alt.matchScore}% Match
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px]">
                              Rejected
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                          {alt.plainLanguageReason}
                        </p>
                        {alt.violations.length > 0 && (
                          <p className="mt-1 text-[10px] text-destructive font-medium">
                            Violation: {alt.violations[0]?.reason}
                          </p>
                        )}
                      </div>

                      <div className="mt-2.5 pt-2 border-t flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {alt.timeImpactMinutes}m travel delta
                        </span>
                        {alt.isValid && (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-primary text-primary-foreground font-semibold px-2.5"
                            onClick={() => handleAcceptPlanB(alt)}
                          >
                            Accept Plan B
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Travel Repair Score (TRS) Badge */}
            {lastTRS && (
              <div className="mt-3 rounded-lg border bg-surface p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
                    {lastTRS.totalScore}
                  </div>
                  <div>
                    <span className="font-bold text-foreground">
                      Travel Repair Score: {lastTRS.totalScore}/100
                    </span>
                    <span className="text-muted-foreground text-[11px] ml-2">
                      (w1: 0.25 · w2: 0.25 · w3: 0.25 · w4: 0.25)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  {lastTRS.details.map((d, di) => (
                    <span key={di} className="rounded bg-muted px-2 py-0.5 font-medium">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* SECTION 8: Hotel Card with 2 Alternatives */}
          <Card className="overflow-hidden border p-5 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hotel className="size-5 text-primary" />
                <h3 className="font-display text-xl font-semibold">{t.recommendedHotel}</h3>
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                Tap alternative to switch
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {plan.hotels.map((h, hIdx) => {
                const isSelected = (plan.hotelChoice ?? 0) === hIdx;
                const p = h.place;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectHotel(hIdx)}
                    className={cn(
                      "cursor-pointer rounded-xl border p-4 transition-all flex flex-col justify-between",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "bg-surface hover:border-border",
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-primary">
                          {hIdx === 0 ? "Top Recommended" : `Alternative ${hIdx}`}
                        </span>
                        {isSelected && <Check className="size-4 text-primary" />}
                      </div>
                      <h4 className="mt-1 font-bold text-foreground text-sm">{p.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {p.address || "Centrally situated near primary sights"}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          <Star className="size-3 fill-amber-500 text-amber-500" />
                          {p.rating || 4.5}
                        </span>
                        {p.wheelchair && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-medium">
                            <Accessibility className="size-3" />
                            Accessible
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">
                        {numNights} nights total
                      </span>
                      <span className="font-bold text-sm text-foreground">
                        {p.price || "₹4,500 / night"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* SECTION 8 & 9: TripIt-Style Vertical Timetable with 2-3 Options per Slot */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-bold tracking-tight">
                Day {selectedDayIndex + 1} — {currentDay?.date}
              </h3>
              <div className="flex items-center gap-1">
                {plan.days.map((_, di) => (
                  <Button
                    key={di}
                    size="sm"
                    variant={selectedDayIndex === di ? "default" : "outline"}
                    className="h-8 text-xs font-semibold px-3"
                    onClick={() => setSelectedDayIndex(di)}
                  >
                    Day {di + 1}
                  </Button>
                ))}
              </div>
            </div>

            {/* Vertical Timeline container */}
            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
              {currentDay?.slots.map((s, slotIdx) => {
                const chosenOption = s.options[s.chosen] || s.options[0];
                const p = chosenOption?.place;
                const nextLeg = currentDay.legs[slotIdx];

                if (!p) return null;

                return (
                  <div key={s.key} className="relative space-y-4">
                    {/* Circle marker on timeline */}
                    <div className="absolute -left-6 sm:-left-8 top-1 flex size-5 sm:size-6 items-center justify-center rounded-full bg-[#B87333] text-white text-[11px] font-bold border-2 border-background shadow-xs">
                      {slotIdx + 1}
                    </div>

                    {/* Slot Card */}
                    <Card className="rounded-xl border bg-card p-4 shadow-xs">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs uppercase tracking-wider text-primary">
                              {s.start} – {s.end}
                            </span>
                            <span className="text-xs text-muted-foreground">·</span>
                            <Badge variant="outline" className="text-[11px] font-medium">
                              {s.label}
                            </Badge>
                            <Badge variant="secondary" className="text-[11px]">
                              {p.category}
                            </Badge>
                          </div>
                          <h4 className="mt-1 text-base font-bold text-foreground">{p.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {p.address || `${p.distanceKm.toFixed(1)} km from centre`}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            {chosenOption.match}% Match
                          </span>
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            {chosenOption.crowd} Crowd (Est.)
                          </span>
                        </div>
                      </div>

                      {/* Meta chips */}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground border-t pt-2">
                        {p.rating && (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            <Star className="size-3 fill-amber-500 text-amber-500" />
                            {p.rating}
                          </span>
                        )}
                        <span className="font-medium text-foreground">
                          Fee: {p.price || "Check official site"}
                        </span>
                        {p.wheelchair && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                            <Accessibility className="size-3" />
                            Wheelchair Verified
                          </span>
                        )}
                        <a
                          href={p.mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-auto inline-flex items-center gap-1 text-primary hover:underline font-medium"
                        >
                          {t.openInMaps}
                          <ExternalLink className="size-3" />
                        </a>
                      </div>

                      {/* Why recommended text */}
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                        <span className="font-semibold text-foreground">Why:</span>{" "}
                        {chosenOption.why}
                      </p>

                      {/* User Choices: 2 to 3 Options for this Slot */}
                      {s.options.length > 1 && (
                        <div className="mt-3 rounded-lg bg-muted/40 p-2.5 space-y-1.5 border">
                          <span className="text-[11px] font-semibold text-muted-foreground block">
                            Tap alternative option to switch:
                          </span>
                          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                            {s.options.map((opt, optIdx) => (
                              <button
                                key={opt.place.id}
                                type="button"
                                onClick={() =>
                                  handleSelectSlotOption(selectedDayIndex, s.key, optIdx)
                                }
                                className={cn(
                                  "flex items-center justify-between rounded-md p-2 text-left text-xs transition-all border",
                                  s.chosen === optIdx
                                    ? "bg-surface border-primary font-bold text-foreground shadow-2xs"
                                    : "bg-surface/50 border-transparent text-muted-foreground hover:bg-surface",
                                )}
                              >
                                <span className="truncate pr-2">{opt.place.name}</span>
                                <span className="text-[10px] text-primary shrink-0">
                                  {opt.match}%
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SECTION 8: Nearby Places Row */}
                      {chosenOption.nearby && chosenOption.nearby.length > 0 && (
                        <div className="mt-3 pt-2 border-t">
                          <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            {t.alsoNearby}:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {chosenOption.nearby.map((nb, ni) => (
                              <a
                                key={ni}
                                href={nb.place.mapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[11px] text-foreground hover:text-primary transition-colors"
                              >
                                <span>{nb.place.name}</span>
                                <span className="text-muted-foreground">({nb.meters}m)</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>

                    {/* SECTION 9: Transport Leg Connector Between Stops */}
                    {nextLeg && (
                      <div className="ml-2 sm:ml-4 rounded-lg border bg-muted/30 p-2.5 text-xs text-muted-foreground">
                        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2">
                            <Navigation className="size-3.5 text-primary" />
                            <span className="font-semibold text-foreground">
                              Transit to next stop: {nextLeg.km.toFixed(1)} km
                            </span>
                          </div>

                          {/* Mode selection buttons on leg */}
                          <div className="flex items-center gap-1">
                            {nextLeg.options.map((opt) => (
                              <button
                                key={opt.mode}
                                type="button"
                                onClick={() =>
                                  handleSelectLegMode(selectedDayIndex, slotIdx, opt.mode)
                                }
                                className={cn(
                                  "rounded px-2 py-0.5 text-[11px] font-medium transition-all border",
                                  nextLeg.chosen === opt.mode
                                    ? "bg-primary text-primary-foreground border-primary font-bold"
                                    : "bg-surface border-border text-muted-foreground hover:bg-muted",
                                )}
                              >
                                {opt.mode} ({opt.minutes}m)
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Real Transit Line Numbers Rule */}
                        {(() => {
                          const chosenLegOpt = nextLeg.options.find(
                            (o) => o.mode === nextLeg.chosen,
                          );
                          if (chosenLegOpt?.lineDetails && chosenLegOpt.lineDetails.length > 0) {
                            return (
                              <p className="mt-1 text-[11px] font-semibold text-primary">
                                Lines: {chosenLegOpt.lineDetails.join(", ")}
                              </p>
                            );
                          }
                          if (nextLeg.chosen === "Bus" || nextLeg.chosen === "Metro") {
                            return (
                              <p className="mt-1 text-[11px] text-muted-foreground italic">
                                Line details not available for this city (frequencies estimated by
                                OSRM).
                              </p>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4 & E: Budget Summary & Persistent Saving */}
          <Card className="overflow-hidden border p-6 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IndianRupee className="size-5 text-primary" />
                <h3 className="font-display text-xl font-semibold">{t.budgetSummary}</h3>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold",
                  isWithinBudget
                    ? "bg-emerald-500/10 text-emerald-700"
                    : "bg-rose-500/10 text-rose-700",
                )}
              >
                {isWithinBudget
                  ? `Within Budget (₹${budgetDifference.toLocaleString()} remaining)`
                  : `₹${Math.abs(budgetDifference).toLocaleString()} Over Budget`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
              <div className="rounded-xl border bg-surface/70 p-3">
                <span className="text-xs text-muted-foreground">Total Budget</span>
                <p className="mt-1 text-lg font-bold text-foreground">
                  ₹{userBudget.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border bg-surface/70 p-3">
                <span className="text-xs text-muted-foreground">Hotel ({numNights}N)</span>
                <p className="mt-1 text-lg font-bold text-foreground">
                  ₹{totalHotelCost.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border bg-surface/70 p-3">
                <span className="text-xs text-muted-foreground">Sightseeing Fees</span>
                <p className="mt-1 text-lg font-bold text-foreground">
                  ₹{activityTicketCosts.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border bg-surface/70 p-3">
                <span className="text-xs text-muted-foreground">Est. Dining</span>
                <p className="mt-1 text-lg font-bold text-foreground">
                  ₹{estimatedFoodCost.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between rounded-xl bg-muted/40 p-4 gap-2">
              <div>
                <span className="text-xs text-muted-foreground">Total Planned Spend</span>
                <p className="text-2xl font-bold text-foreground">
                  ₹{totalCalculatedSpend.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link to="/trips">{t.myTrips}</Link>
                </Button>
                <Button asChild>
                  <Link to="/map">{t.map}</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
