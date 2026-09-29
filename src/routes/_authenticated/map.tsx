import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Footprints, Hotel, Layers, Locate, MapPin, Navigation } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { TripMap } from "@/components/trip-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { listTrips, type TripRow } from "@/lib/trips";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({
    meta: [
      { title: "Interactive Map — Rootify" },
      {
        name: "description",
        content: "Explore your journey stops, routes and nearby points on OpenStreetMap.",
      },
    ],
  }),
  component: MapPage,
});

export function MapPage() {
  const { t, getLocalizedName } = useI18n();
  const [trip, setTrip] = useState<TripRow | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [showNearbyLayer, setShowNearbyLayer] = useState(true);
  const [myLocation, setMyLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    listTrips()
      .then((r) => setTrip(r.rows.find((x) => x.plan) ?? null))
      .catch(() => null)
      .finally(() => setLoaded(true));
  }, []);

  function handleLocateMe() {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        toast.success("Location pinpointed on map!");
      },
      () => {
        // Fallback demo location near Chennai / destination
        const dest = trip?.plan?.destination;
        if (dest) {
          setMyLocation({ lat: dest.lat + 0.008, lon: dest.lon + 0.008 });
          toast.info("Showing simulated traveller location near destination.");
        } else {
          toast.error("Could not obtain device location.");
        }
      },
    );
  }

  const days = trip?.plan?.days || [];
  const currentDay = days[selectedDayIdx];

  // Numbered stop pins
  const stops =
    currentDay?.slots
      .map((s, i) => {
        const p = s.options[s.chosen]?.place;
        if (!p) return null;
        return {
          lat: p.lat,
          lon: p.lon,
          name: p.name,
          label: String(i + 1),
          hotel: false,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null) ?? [];

  // Add hotel pin if available
  const hotel = trip?.plan?.hotels[trip.plan.hotelChoice ?? 0]?.place;
  if (hotel) {
    stops.unshift({
      lat: hotel.lat,
      lon: hotel.lon,
      name: `Hotel: ${hotel.name}`,
      label: "H",
      hotel: true,
    });
  }

  // Category layers for nearby places
  const extras = showNearbyLayer
    ? currentDay?.slots
        .flatMap((s) => s.options[s.chosen]?.nearby || [])
        .map((nb) => ({
          lat: nb.place.lat,
          lon: nb.place.lon,
          name: `${nb.place.name} (${nb.meters}m)`,
        })) || []
    : [];

  const routePolyline = currentDay?.legs[0]?.geometry ?? null;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{t.map}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {trip?.plan
              ? `${trip.plan.destination.name} Itinerary · Day ${selectedDayIdx + 1} Route`
              : "Numbered stops and routing via OpenStreetMap tiles."}
          </p>
        </div>

        {/* Day Toggles */}
        {days.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {days.map((_, di) => (
              <Button
                key={di}
                size="sm"
                variant={selectedDayIdx === di ? "default" : "outline"}
                className="h-8 text-xs font-semibold px-3"
                onClick={() => setSelectedDayIdx(di)}
              >
                Day {di + 1}
              </Button>
            ))}
          </div>
        )}
      </div>

      {loaded && !currentDay && (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          <p>
            No planned trip found yet. Once you generate a plan, its stops and route map appear
            here.
          </p>
        </Card>
      )}

      {/* Map Canvas with Controls Overlay */}
      <div className="relative h-[65vh] w-full overflow-hidden rounded-2xl border shadow-sm">
        <TripMap stops={stops} route={routePolyline} extras={extras} me={myLocation} />

        {/* Floating Map Controls */}
        <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 bg-card/95 font-semibold text-xs shadow-md backdrop-blur"
            onClick={handleLocateMe}
          >
            <Locate className="size-4 text-blue-600" />
            <span className="hidden sm:inline">My Location</span>
          </Button>

          <Button
            size="sm"
            variant={showNearbyLayer ? "default" : "outline"}
            className="h-9 gap-1.5 bg-card/95 font-semibold text-xs shadow-md backdrop-blur text-foreground hover:bg-card"
            onClick={() => setShowNearbyLayer(!showNearbyLayer)}
          >
            <Layers className="size-4 text-primary" />
            <span className="hidden sm:inline">Nearby Layer ({extras.length})</span>
          </Button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-[1000] rounded-xl border bg-card/90 px-3 py-1.5 text-[11px] font-medium backdrop-blur shadow-sm flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="size-3 rounded-full bg-[#B87333]" />
            <span>Stops</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="size-3 rounded-full bg-[#1f2a44]" />
            <span>Hotel</span>
          </div>
          {myLocation && (
            <div className="flex items-center gap-1">
              <span className="size-3 rounded-full bg-blue-500" />
              <span>You</span>
            </div>
          )}
        </div>
      </div>

      {/* Stop Index List */}
      {currentDay && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Day {selectedDayIdx + 1} Stop Sequence:
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {currentDay.slots.map((s, idx) => {
              const p = s.options[s.chosen]?.place;
              if (!p) return null;
              return (
                <div
                  key={s.key}
                  className="flex items-center justify-between rounded-xl border bg-card p-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#B87333] text-white font-bold text-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-foreground">
                        {getLocalizedName(p.name, p.localName)}
                      </p>
                      <p className="text-muted-foreground text-[11px]">
                        {s.start}–{s.end} · {s.label} ({p.category})
                      </p>
                    </div>
                  </div>

                  <a
                    href={p.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 text-primary hover:underline p-1"
                    title="Open in Maps"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
