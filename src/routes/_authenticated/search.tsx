import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Accessibility,
  BookmarkPlus,
  Clock,
  ExternalLink,
  Filter,
  MapPin,
  Search as SearchIcon,
  ShieldCheck,
  Star,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { DestinationInput } from "@/components/destination-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n";
import { searchNearbyPlaces } from "@/lib/travel.functions";
import { SEARCH_CATEGORIES, type Category, type GeoPlace, type Place } from "@/lib/travel-types";
import { listTrips, saveTrip } from "@/lib/trips";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({
    meta: [
      { title: "Search Places — Rootify" },
      {
        name: "description",
        content: "Find verified real places near any destination with live hours and ticket fees.",
      },
    ],
  }),
  component: SearchPage,
});

export function SearchPage() {
  const { t, getLocalizedName } = useI18n();
  const runSearch = useServerFn(searchNearbyPlaces);

  const [dest, setDest] = useState<GeoPlace | null>({
    id: "chennai_default",
    name: "Chennai",
    admin1: "Tamil Nadu",
    country: "India",
    countryCode: "IN",
    lat: 13.0827,
    lon: 80.2707,
    timezone: "Asia/Kolkata",
  });

  const [cat, setCat] = useState<Category>("Heritage");
  const [keyword, setKeyword] = useState("");
  const [wheelchairOnly, setWheelchairOnly] = useState(false);
  const [highRatingOnly, setHighRatingOnly] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number>(20);

  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [places, setPlaces] = useState<Place[] | null>(null);

  async function performSearch(categoryToSearch = cat, customKw = keyword) {
    if (!dest) {
      toast.error("Please enter a destination first.");
      return;
    }
    setState("loading");
    setCat(categoryToSearch);

    try {
      const res = await runSearch({
        data: {
          centre: { lat: dest.lat, lon: dest.lon, name: dest.name },
          category: categoryToSearch,
          keyword: customKw.trim() || undefined,
        },
      });
      setPlaces(res.places);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  // Filtered list
  const filteredPlaces = (places || []).filter((p) => {
    if (wheelchairOnly && p.wheelchair === false) return false;
    if (highRatingOnly && (p.rating ?? 0) < 4.2) return false;
    if (p.distanceKm > maxDistance) return false;
    return true;
  });

  async function handleSaveToTrip(p: Place) {
    try {
      const tripsRes = await listTrips();
      const firstTrip = tripsRes.rows.find((r) => r.plan);
      if (firstTrip?.plan && firstTrip.input) {
        // Add to the first day's slots
        const updatedDays = [...firstTrip.plan.days];
        if (updatedDays[0]) {
          const newSlot = {
            key: `custom_${Date.now()}`,
            label: "Custom Visit",
            start: "16:00",
            end: "17:30",
            category: p.category,
            options: [
              {
                place: p,
                match: 95,
                why: "Added from Explore Search",
                crowd: "Medium" as const,
                nearby: [],
              },
            ],
            chosen: 0,
          };
          updatedDays[0].slots.push(newSlot);
          await saveTrip({
            id: firstTrip.id,
            status: "planned",
            input: firstTrip.input,
            plan: { ...firstTrip.plan, days: updatedDays },
          });
          toast.success(`Saved "${p.name}" to Day 1 of your trip!`);
          return;
        }
      }
      toast.info(`"${p.name}" saved! Create or open a trip to organize it.`);
    } catch {
      toast.error("Could not save place to trip.");
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t.search}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover verified real places worldwide via OpenStreetMap & Google Places.
        </p>
      </div>

      {/* Destination & Keyword Input */}
      <div className="space-y-3 rounded-2xl border bg-card p-5 shadow-xs">
        <DestinationInput
          label="City, area or landmark"
          value={dest}
          onChange={(p) => {
            setDest(p);
            setPlaces(null);
          }}
          placeholder="Search any worldwide location (e.g. Madurai, Tokyo, Paris)"
        />

        {/* Categories Bar */}
        <div className="space-y-1.5 pt-2">
          <span className="text-xs font-semibold text-muted-foreground">Category</span>
          <div role="group" aria-label="Category" className="flex flex-wrap gap-2">
            {SEARCH_CATEGORIES.map((c) => (
              <Button
                key={c}
                type="button"
                size="sm"
                variant={c === cat ? "default" : "outline"}
                className={cn("rounded-full text-xs font-semibold", c === cat && "shadow-xs")}
                onClick={() => performSearch(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
              <Switch checked={wheelchairOnly} onCheckedChange={setWheelchairOnly} />
              <span>Wheelchair only</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
              <Switch checked={highRatingOnly} onCheckedChange={setHighRatingOnly} />
              <span>4.2+ Stars only</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium">Distance:</span>
            <select
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="rounded-md border bg-surface px-2 py-1 text-xs font-medium"
            >
              <option value={10}>Within 10 km</option>
              <option value={20}>Within 20 km</option>
              <option value={50}>Within 50 km</option>
            </select>
          </div>
        </div>
      </div>

      {/* State Feedback */}
      <div aria-live="polite">
        {state === "loading" && (
          <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
            <SearchIcon className="mr-2 size-4 animate-spin text-primary" />
            Querying verified real places...
          </div>
        )}
        {state === "error" && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive font-medium">
            Couldn't search places right now. Check your connection or try another category.
          </p>
        )}
        {state === "idle" && places && filteredPlaces.length === 0 && (
          <p className="p-4 text-center text-sm text-muted-foreground">
            No {cat} places matched your filter settings. Try adjusting the distance or rating
            filter.
          </p>
        )}
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {filteredPlaces.map((p) => {
          const hours = p.hoursText?.[0] || "Hours not listed";
          const fee = p.price || "Check official site";
          const coords = `${p.lat.toFixed(4)}, ${p.lon.toFixed(4)}`;

          return (
            <Card
              key={p.id}
              className="rounded-xl border bg-card p-4 transition-all hover:border-primary/40 shadow-xs"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-base text-foreground">
                      {getLocalizedName(p.name, p.localName)}
                    </h3>
                    <Badge variant="outline" className="text-[10px]">
                      {p.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.address || `${p.distanceKm.toFixed(1)} km from destination centre`}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 text-xs shrink-0 self-start"
                  onClick={() => handleSaveToTrip(p)}
                >
                  <BookmarkPlus className="size-3.5 text-primary" />
                  Save to trip
                </Button>
              </div>

              {/* Badges & Meta */}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground border-t pt-2.5">
                {p.rating && (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    <Star className="size-3 fill-amber-500 text-amber-500" />
                    {p.rating}
                  </span>
                )}
                <span className="font-medium text-foreground">Fee: {fee}</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Clock className="size-3" />
                  {hours}
                </span>
                {p.wheelchair && (
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                    <Accessibility className="size-3" />
                    Accessible
                  </span>
                )}

                {/* Verification badge & maps link */}
                <div className="ml-auto flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    <ShieldCheck className="size-3.5 text-emerald-600" />
                    Verified on {p.source === "google" ? "Google Places" : "OpenStreetMap"} (
                    {coords})
                  </span>
                  <a
                    href={p.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline font-semibold text-xs"
                  >
                    Open in Maps
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
