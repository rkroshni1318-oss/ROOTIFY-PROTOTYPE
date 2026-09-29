import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Compass,
  ExternalLink,
  Layers,
  Locate,
  MapPin,
  Navigation,
  PlusCircle,
  Sparkles,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { TripMap } from "@/components/trip-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { listTrips, type TripRow } from "@/lib/trips";

export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({
    meta: [
      { title: "Maps — Rootify Your Travels" },
      {
        name: "description",
        content: "Explore separate interactive route maps for each of your travel plans.",
      },
    ],
  }),
  component: MapPage,
});

export function MapPage() {
  const { t } = useI18n();

  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [myLocation, setMyLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    let mounted = true;
    listTrips()
      .then((r) => {
        if (!mounted) return;
        const validTrips = r.rows.filter((x) => x.plan);
        setTrips(validTrips);
        if (validTrips.length > 0 && validTrips[0]) {
          setSelectedPlanId(validTrips[0].id);
        }
      })
      .catch(() => null)
      .finally(() => {
        if (mounted) setLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const activeTrip = trips.find((t) => t.id === selectedPlanId) || trips[0] || null;
  const plan = activeTrip?.plan ?? null;
  const day = plan?.days[selectedDayIdx] || plan?.days[0];
  const hotel = plan?.hotels[plan.hotelChoice]?.place;
  const hasHotel = !!hotel;

  const stops =
    day?.slots.map((s, i) => {
      const p = s.options[s.chosen]!.place;
      return {
        lat: p.lat,
        lon: p.lon,
        name: p.name,
        label: hasHotel && i === 0 ? "H" : String(hasHotel ? i : i + 1),
        hotel: hasHotel && i === 0,
      };
    }) ?? [];

  if (hotel && !stops.some((s) => s.name === hotel.name)) {
    stops.unshift({
      lat: hotel.lat,
      lon: hotel.lon,
      name: hotel.name,
      label: "H",
      hotel: true,
    });
  }

  function handleLocateMe() {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        toast.success("Your location pinpointed on the map!");
      },
      () => {
        // Fallback demo location near active plan destination
        const dest = plan?.destination;
        if (dest) {
          setMyLocation({ lat: dest.lat + 0.005, lon: dest.lon + 0.005 });
          toast.info(`Showing simulated location near ${dest.name}.`);
        } else {
          toast.error("Could not obtain device location.");
        }
      },
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Navigation className="size-7 text-primary" />
            {t.map} — Interactive Route Maps
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Every travel plan has its own dedicated map. Switch between plans below to view stops
            and route paths.
          </p>
        </div>

        <Button asChild size="sm">
          <Link to="/plan">
            <PlusCircle className="mr-1.5 size-4" />
            {t.createPlan}
          </Link>
        </Button>
      </div>

      {loaded && trips.length === 0 && (
        <Card className="rounded-3xl border border-dashed bg-card/60 p-10 text-center shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MapPin className="size-7" />
          </div>
          <h3 className="mt-3 font-display text-xl font-bold text-foreground">
            {t.noPlansYet || "No travel plans created yet"}
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
            Create a trip plan to see its dedicated map, route lines, stop pins, and hotel
            locations.
          </p>
          <div className="mt-5">
            <Button asChild>
              <Link to="/plan">
                <PlusCircle className="mr-2 size-4" />
                {t.createPlan}
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Plan Selector Tabs (Each plan gets its own clearly labeled map!) */}
      {trips.length > 0 && (
        <div className="space-y-4">
          <div>
            <span className="text-xs font-bold text-foreground block mb-2">
              Select Plan Map to View:
            </span>
            <div className="flex flex-wrap gap-2" role="tablist">
              {trips.map((tRow) => {
                const planName = `${tRow.destination?.name || "Travel"} Plan`;
                const isSelected = tRow.id === selectedPlanId;
                return (
                  <Button
                    key={tRow.id}
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => {
                      setSelectedPlanId(tRow.id);
                      setSelectedDayIdx(0);
                    }}
                    className={`h-9 rounded-full px-4 text-xs font-semibold ${
                      isSelected ? "shadow-md" : ""
                    }`}
                  >
                    <Compass className="mr-1.5 size-3.5" />
                    {planName}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Dedicated Map Container for the selected plan */}
          {activeTrip && plan && (
            <Card className="overflow-hidden rounded-3xl border bg-card shadow-sm space-y-4 p-5">
              {/* Map Title Named After Its Plan (e.g. "Kodaikanal Plan", "Madurai Plan") */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary">
                      Active Map
                    </span>
                    <h2 className="font-display text-2xl font-bold text-foreground">
                      {plan.destination.name} Plan Map
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="size-3 text-primary" />
                    {plan.destination.country} · {plan.days.length} Days · {stops.length} Stops on
                    this day
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleLocateMe}
                    className="h-8 text-xs font-semibold gap-1"
                  >
                    <Locate className="size-3.5 text-primary" />
                    Locate Me
                  </Button>

                  <Button asChild size="sm" className="h-8 text-xs font-semibold">
                    <Link to="/trip/$id" params={{ id: activeTrip.id }}>
                      View Plan Itinerary
                      <ExternalLink className="ml-1 size-3" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Day Selector for this Specific Plan */}
              {plan.days.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-xs font-medium text-muted-foreground shrink-0">Day:</span>
                  {plan.days.map((d, di) => (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => setSelectedDayIdx(di)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-all border ${
                        di === selectedDayIdx
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-surface hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      Day {di + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* The Dedicated Interactive Map Component */}
              <div className="overflow-hidden rounded-2xl border">
                <TripMap
                  stops={stops}
                  route={day?.legs[0]?.geometry ?? null}
                  me={myLocation}
                  className="h-[55vh] min-h-96 w-full"
                />
              </div>

              {/* Stops Index for this Plan */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold text-foreground">
                  Stops on {plan.destination.name} Plan (Day {selectedDayIdx + 1}):
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {stops.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 rounded-xl border bg-surface p-2.5 text-xs shadow-2xs"
                    >
                      <span
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                          s.hotel ? "bg-[#1f2a44]" : "bg-[#B87333]"
                        }`}
                      >
                        {s.label}
                      </span>
                      <span className="font-medium text-foreground truncate">{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
