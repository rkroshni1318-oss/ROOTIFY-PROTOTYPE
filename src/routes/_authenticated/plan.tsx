import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { differenceInCalendarDays, format } from "date-fns";
import { Check, CheckCircle2, ChevronRight, Clock, Compass, DollarSign, Flame, Landmark, Loader2, MapPin, Palmtree, ShieldCheck, ShoppingBag, Sparkles, Star, Utensils } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DestinationInput } from "@/components/destination-input";
import { RootifyDatePicker } from "@/components/rootify-date-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { generateMultiplePlans, generatePlan } from "@/lib/travel.functions";
import { useI18n } from "@/lib/i18n";
import {
  INTEREST_OPTIONS,
  TRANSPORT_MODES,
  type GeoPlace,
  type TransportMode,
  type TripInput,
  type TripPlan,
} from "@/lib/travel-types";
import { saveTrip } from "@/lib/trips";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/plan")({
  head: () => ({
    meta: [
      { title: "Create Plan — Rootify Your Travels" },
      { name: "description", content: "Plan real hour-by-hour journeys anywhere worldwide." },
    ],
  }),
  component: PlanForm,
});

const iso = (d: Date) => format(d, "yyyy-MM-dd");

function Chip({
  on,
  children,
  onClick,
}: {
  on: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-ring",
        on
          ? "border-primary bg-primary text-primary-foreground shadow-xs"
          : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function PlanForm() {
  const nav = useNavigate();
  const { t } = useI18n();
  const genSingle = useServerFn(generatePlan);
  const genMultiple = useServerFn(generateMultiplePlans);

  const [origin, setOrigin] = useState<GeoPlace | null>(null);
  const [dest, setDest] = useState<GeoPlace | null>(null);
  const [start, setStart] = useState<Date | undefined>();
  const [end, setEnd] = useState<Date | undefined>();
  const [dayStart, setDayStart] = useState("08:00");
  const [dayEnd, setDayEnd] = useState("21:30");
  const [budget, setBudget] = useState(25000);
  const [currency, setCurrency] = useState("INR");
  const [group, setGroup] = useState<TripInput["group"]>("Solo");
  const [interests, setInterests] = useState<string[]>(["Heritage", "Food"]);
  const [other, setOther] = useState("");
  const [transport, setTransport] = useState<TransportMode[]>(["Walk", "Taxi", "Bus"]);
  const [lessWalking, setLessWalking] = useState(false);
  const [wheelchair, setWheelchair] = useState(false);
  const [busy, setBusy] = useState<"plan" | "draft" | null>(null);

  // Multiple Itinerary Options State (for 2-3+ days trips)
  const [multipleOptions, setMultipleOptions] = useState<TripPlan[] | null>(null);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);
  const [savingPlan, setSavingPlan] = useState(false);

  const days = start && end ? differenceInCalendarDays(end, start) + 1 : 0;
  const toggle = <T,>(arr: T[], v: T) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  function input(): TripInput | null {
    if (!dest) {
      toast.error(t.selectDestinationPrompt || "Choose a destination from the suggestions.");
      return null;
    }
    return {
      origin,
      destination: dest,
      startDate: start ? iso(start) : "",
      endDate: end ? iso(end) : "",
      dayStart,
      dayEnd,
      budget,
      currency,
      group,
      interests,
      otherInterest: other,
      transport,
      lessWalking,
      wheelchair,
    };
  }

  async function draft() {
    const i = input();
    if (!i) return;
    setBusy("draft");
    try {
      await saveTrip({ status: "draft", input: i, plan: null });
      toast.success(t.tripSavedSuccessfully || "Draft saved");
      nav({ to: "/trips" });
    } catch {
      toast.error("Couldn't save the draft.");
    } finally {
      setBusy(null);
    }
  }

  async function create() {
    const i = input();
    if (!i) return;
    if (!start || !end || days < 1) {
      toast.error("Pick a start and end date.");
      return;
    }
    if (days > 10) {
      toast.error("Trips can be up to 10 days.");
      return;
    }
    if (!transport.length) {
      toast.error("Pick at least one transport type.");
      return;
    }
    if (interests.includes("Other") && !other.trim()) {
      toast.error("Describe your 'Other' interest.");
      return;
    }

    setBusy("plan");
    try {
      if (days >= 2) {
        // Generate multiple comprehensive plan options (Requirement 5)
        const options = await genMultiple({ data: i });
        setMultipleOptions(options);
        setSelectedOptionIdx(0);
        toast.success(`Generated ${options.length} itinerary options for your ${days}-day trip!`);
      } else {
        const plan = await genSingle({ data: i });
        const row = await saveTrip({ status: "planned", input: i, plan });
        toast.success(t.tripSavedSuccessfully || "Itinerary created successfully!");
        nav({ to: "/trip/$id", params: { id: row.id } });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't build the plan. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handleConfirmOption(option: TripPlan) {
    const i = input();
    if (!i) return;
    setSavingPlan(true);
    try {
      const row = await saveTrip({ status: "planned", input: i, plan: option });
      toast.success(`Saved "${option.title || "Your Plan"}"!`);
      nav({ to: "/trip/$id", params: { id: row.id } });
    } catch {
      toast.error("Could not save chosen itinerary.");
    } finally {
      setSavingPlan(false);
    }
  }

  // If multiple options were generated, show the comparison & selection view
  if (multipleOptions && multipleOptions.length > 0) {
    const chosen = multipleOptions[selectedOptionIdx] || multipleOptions[0]!;

    return (
      <div className="space-y-6 pb-20">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              {t.multipleOptionsTitle || "Compare & Choose Your Itinerary"}
            </span>
            <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-foreground">
              {multipleOptions.length} Tailored Plans for {dest?.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t.selectItineraryOption || "Select the plan style that matches your travel preferences. Each option includes hour-by-hour timetables, transport, and live Plan B."}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setMultipleOptions(null)}
          >
            ← Modify Inputs
          </Button>
        </div>

        {/* Options Selector Tabs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {multipleOptions.map((opt, idx) => {
            const isSelected = idx === selectedOptionIdx;
            const totalStops = opt.days.reduce((acc, d) => acc + d.slots.length, 0);

            return (
              <Card
                key={opt.title || idx}
                onClick={() => setSelectedOptionIdx(idx)}
                className={cn(
                  "cursor-pointer p-4 rounded-2xl border transition-all text-left",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                    : "hover:border-primary/40 bg-card",
                )}
              >
                <div className="flex items-start justify-between gap-1">
                  <Badge variant={isSelected ? "default" : "outline"} className="text-[10px]">
                    {opt.planStyle || `Option ${idx + 1}`}
                  </Badge>
                  {isSelected && <CheckCircle2 className="size-4 text-primary" />}
                </div>

                <h3 className="mt-2 font-display text-sm font-bold text-foreground line-clamp-1">
                  {opt.title}
                </h3>
                <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                  {opt.description}
                </p>

                <div className="mt-3 flex items-center justify-between border-t pt-2 text-[11px]">
                  <span className="font-semibold text-foreground">{totalStops} stops</span>
                  <span className="text-muted-foreground">{opt.days.length} days</span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Detailed Preview of Selected Plan */}
        <Card className="rounded-3xl border bg-card p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold text-foreground">
                  {chosen.title}
                </h2>
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  {chosen.planStyle}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                {chosen.description}
              </p>
            </div>

            <Button
              size="lg"
              className="h-11 px-6 font-bold shadow-md"
              disabled={savingPlan}
              onClick={() => handleConfirmOption(chosen)}
            >
              {savingPlan ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving Itinerary…
                </>
              ) : (
                <>
                  <Check className="mr-2 size-4" />
                  {t.chooseThisPlan || "Choose & Save This Itinerary"}
                </>
              )}
            </Button>
          </div>

          {/* Day by Day Timetable Overview */}
          <div className="space-y-4">
            <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              Hour-by-Hour Timetable Preview
            </h3>

            <div className="space-y-4">
              {chosen.days.map((day, dIdx) => (
                <div key={day.date} className="rounded-2xl border bg-surface/50 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2 text-xs">
                    <span className="font-bold text-foreground">
                      Day {dIdx + 1} · {day.date}
                    </span>
                    <span className="text-muted-foreground">
                      {day.weather ? `${day.weather.max}°C · ${day.weather.label}` : "Weather Forecast Ready"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {day.slots.map((s) => {
                      const place = s.options[s.chosen]?.place;
                      if (!place) return null;
                      return (
                        <div
                          key={s.key}
                          className="rounded-xl border bg-card p-2.5 text-xs space-y-1 shadow-2xs"
                        >
                          <div className="flex items-center justify-between text-[11px] font-semibold text-primary">
                            <span>{s.start} - {s.end}</span>
                            <span>{s.label}</span>
                          </div>
                          <p className="font-bold text-foreground truncate">{place.name}</p>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                            <span>{place.category}</span>
                            <span className="font-medium text-foreground">{place.price || "Free entry"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <section className="space-y-6 pb-20">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          <Compass className="size-8 text-primary" />
          {t.createPlan}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {t.planYourJourney}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DestinationInput
          label={t.origin || "From (optional)"}
          value={origin}
          onChange={setOrigin}
          placeholder="e.g. Chennai, Paris, London, Dubai"
        />
        <DestinationInput
          label={t.destination || "To (Destination)"}
          value={dest}
          onChange={setDest}
          placeholder="e.g. Kodaikanal, Bihar, Maldives, Tokyo"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t.startDate}</Label>
          <RootifyDatePicker
            value={start}
            onChange={(d) => {
              setStart(d);
              if (d && end && end < d) setEnd(undefined);
            }}
            disabled={(d) => d < new Date(new Date().toDateString())}
            placeholder={t.startDate}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t.endDate}</Label>
          <RootifyDatePicker
            value={end}
            onChange={setEnd}
            disabled={(d) => (start ? d < start : d < new Date(new Date().toDateString()))}
            placeholder={t.endDate}
          />
        </div>
      </div>

      {days > 0 && (
        <div className="rounded-xl border bg-primary/5 px-4 py-2 text-xs font-semibold text-primary flex items-center justify-between">
          <span>{days} {days > 1 ? "Days Journey" : "Day Journey"}</span>
          <span>{days >= 2 ? "Generates 4 distinct complete itinerary options" : "Hour-by-hour verified timetable"}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="ds" className="text-xs font-semibold">{t.startTime || "Day starts"}</Label>
          <Input
            id="ds"
            type="time"
            value={dayStart}
            onChange={(e) => setDayStart(e.target.value)}
            className="h-10 bg-surface"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="de" className="text-xs font-semibold">{t.endTime || "Day ends"}</Label>
          <Input
            id="de"
            type="time"
            value={dayEnd}
            onChange={(e) => setDayEnd(e.target.value)}
            className="h-10 bg-surface"
          />
        </div>
      </div>

      <div className="grid grid-cols-[1fr_7rem] gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="bd" className="text-xs font-semibold">{t.budget}</Label>
          <Input
            id="bd"
            type="number"
            min={0}
            value={budget}
            onChange={(e) => setBudget(Math.max(0, Number(e.target.value)))}
            className="h-10 bg-surface"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cur" className="text-xs font-semibold">Currency</Label>
          <select
            id="cur"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="h-10 w-full rounded-md border bg-card px-2 text-xs font-medium"
          >
            {["INR", "USD", "EUR", "GBP", "JPY", "AED", "SGD"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold">{t.groupType}</legend>
        <div className="flex gap-2">
          {(["Solo", "Family", "Friends"] as const).map((g) => (
            <Chip key={g} on={group === g} onClick={() => setGroup(g)}>
              {g === "Solo" ? t.solo : g === "Family" ? t.family : t.friends}
            </Chip>
          ))}
        </div>
      </fieldset>

      {/* Item 3: No Limits on Interests */}
      <fieldset className="space-y-2">
        <div className="flex items-center justify-between">
          <legend className="text-xs font-semibold">{t.interests}</legend>
          <span className="text-[11px] text-muted-foreground">Select multiple or type custom</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((i) => {
            const label =
              i === "Heritage"
                ? t.heritage
                : i === "Temples"
                  ? t.temples
                  : i === "Fort"
                    ? t.fort
                    : i === "Food"
                      ? t.food
                      : i === "Beach"
                        ? t.beach
                        : i === "Shopping"
                          ? t.shopping
                          : i === "Culture"
                            ? t.culture
                            : i === "Amusement"
                              ? t.amusement
                              : i === "Hotels"
                                ? t.hotels
                                : t.other;

            return (
              <Chip
                key={i}
                on={interests.includes(i)}
                onClick={() => setInterests(toggle(interests, i))}
              >
                {label}
              </Chip>
            );
          })}
        </div>
        {interests.includes("Other") && (
          <Input
            aria-label="Other interest"
            placeholder={t.otherPlaceholder || "e.g. trekking, street art, waterfalls, tea gardens"}
            value={other}
            maxLength={100}
            onChange={(e) => setOther(e.target.value)}
            className="h-10 bg-surface mt-2 text-xs"
          />
        )}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold">{t.transportModes}</legend>
        <div className="flex flex-wrap gap-2">
          {TRANSPORT_MODES.map((m) => {
            const label =
              m === "Walk"
                ? t.walk
                : m === "Taxi"
                  ? t.taxi
                  : m === "Auto"
                    ? t.auto
                    : m === "Bus"
                      ? t.bus
                      : m === "Metro"
                        ? t.metro
                        : t.ownVehicle;

            return (
              <Chip
                key={m}
                on={transport.includes(m)}
                onClick={() => setTransport(toggle(transport, m))}
              >
                {label}
              </Chip>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-3 rounded-2xl border bg-card p-4">
        <label className="flex items-center justify-between gap-3 text-xs font-medium cursor-pointer">
          <span>{t.preferLessWalking}</span>
          <Switch checked={lessWalking} onCheckedChange={setLessWalking} />
        </label>
        <label className="flex items-center justify-between gap-3 text-xs font-medium cursor-pointer">
          <span>{t.requiresWheelchair}</span>
          <Switch checked={wheelchair} onCheckedChange={setWheelchair} />
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button className="flex-1 h-11 font-bold shadow-md" onClick={create} disabled={!!busy}>
          {busy === "plan" ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {t.buildingPlan} {dest?.name ?? ""}…
            </>
          ) : (
            t.createPlan
          )}
        </Button>
        <Button variant="outline" className="h-11 font-semibold" onClick={draft} disabled={!!busy}>
          {busy === "draft" ? <Loader2 className="animate-spin size-4" /> : t.saveDraft}
        </Button>
      </div>
    </section>
  );
}
export default PlanForm;
