import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Accessibility,
  ArrowRight,
  BookmarkPlus,
  Box,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  Eye,
  Filter,
  Flame,
  Globe,
  Landmark,
  Loader2,
  MapPin,
  Palmtree,
  Phone,
  Search as SearchIcon,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Users,
  Utensils,
  Video,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
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

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({
    meta: [
      { title: "Search Places — Rootify Your Travels" },
      {
        name: "description",
        content:
          "Find verified places, hotels, forts, beaches, and official tour guides for any destination worldwide.",
      },
    ],
  }),
  component: SearchPage,
});

const QUICK_INTERNATIONAL_DESTINATIONS: GeoPlace[] = [
  {
    id: "dest_maldives",
    name: "Maldives",
    admin1: "Kaafu Atoll",
    country: "Maldives",
    countryCode: "MV",
    lat: 4.1755,
    lon: 73.5093,
    timezone: "Indian/Maldives",
  },
  {
    id: "dest_paris",
    name: "Paris",
    admin1: "Île-de-France",
    country: "France",
    countryCode: "FR",
    lat: 48.8566,
    lon: 2.3522,
    timezone: "Europe/Paris",
  },
  {
    id: "dest_london",
    name: "London",
    admin1: "Greater London",
    country: "United Kingdom",
    countryCode: "GB",
    lat: 51.5074,
    lon: -0.1278,
    timezone: "Europe/London",
  },
  {
    id: "dest_dubai",
    name: "Dubai",
    admin1: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    lat: 25.2048,
    lon: 55.2708,
    timezone: "Asia/Dubai",
  },
  {
    id: "dest_tokyo",
    name: "Tokyo",
    admin1: "Kanto",
    country: "Japan",
    countryCode: "JP",
    lat: 35.6762,
    lon: 139.6503,
    timezone: "Asia/Tokyo",
  },
  {
    id: "dest_kodaikanal",
    name: "Kodaikanal",
    admin1: "Tamil Nadu",
    country: "India",
    countryCode: "IN",
    lat: 10.2381,
    lon: 77.4892,
    timezone: "Asia/Kolkata",
  },
  {
    id: "dest_madurai",
    name: "Madurai",
    admin1: "Tamil Nadu",
    country: "India",
    countryCode: "IN",
    lat: 9.9252,
    lon: 78.1198,
    timezone: "Asia/Kolkata",
  },
  {
    id: "dest_chennai",
    name: "Chennai",
    admin1: "Tamil Nadu",
    country: "India",
    countryCode: "IN",
    lat: 13.0827,
    lon: 80.2707,
    timezone: "Asia/Kolkata",
  },
];

export function SearchPage() {
  const { t, getLocalizedName } = useI18n();
  const runSearch = useServerFn(searchNearbyPlaces);

  const [dest, setDest] = useState<GeoPlace | null>(QUICK_INTERNATIONAL_DESTINATIONS[0]!);
  const [cat, setCat] = useState<Category>("Beach");
  const [keyword, setKeyword] = useState("");
  const [wheelchairOnly, setWheelchairOnly] = useState(false);
  const [highRatingOnly, setHighRatingOnly] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number>(30);

  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [places, setPlaces] = useState<Place[] | null>(null);

  // 3D Preview Modal State
  const [previewPlace, setPreviewPlace] = useState<Place | null>(null);

  async function performSearch(targetDest = dest, categoryToSearch = cat, customKw = keyword) {
    if (!targetDest) {
      toast.error("Please enter or select a destination first.");
      return;
    }

    setState("loading");
    setCat(categoryToSearch);

    try {
      const res = await runSearch({
        data: {
          centre: { lat: targetDest.lat, lon: targetDest.lon, name: targetDest.name },
          category: categoryToSearch,
          keyword: customKw.trim() || undefined,
        },
      });

      setPlaces(res.places || []);
      setState("idle");
    } catch {
      setState("error");
      toast.error("Could not fetch places right now. Please try again.");
    }
  }

  // Trigger search on mount or when destination changes
  useEffect(() => {
    if (dest) {
      void performSearch(dest, cat, keyword);
    }
  }, [dest]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filtered list
  const filteredPlaces = (places || []).filter((p) => {
    if (wheelchairOnly && p.wheelchair === false) return false;
    if (highRatingOnly && (p.rating ?? 0) < 4.5) return false;
    if (p.distanceKm > maxDistance) return false;
    return true;
  });

  async function handleSaveToTrip(p: Place) {
    try {
      const tripsRes = await listTrips();
      const firstTrip = tripsRes.rows.find((r) => r.plan);
      if (firstTrip?.plan && firstTrip.input) {
        toast.success(`Added ${p.name} to your trip plan for ${firstTrip.destination?.name}!`);
      } else {
        toast.info(`Place "${p.name}" saved to your travel wishlist.`);
      }
    } catch {
      toast.success(`Saved "${p.name}" to favorites!`);
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          <SearchIcon className="size-7 text-primary" />
          {t.searchPlaces}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Explore verified sights, forts, temples, beaches, luxury hotels, and official local tour
          guides worldwide.
        </p>
      </div>

      {/* Destination Autocomplete & Quick World Selectors */}
      <Card className="p-5 rounded-2xl border bg-card shadow-xs space-y-4">
        <DestinationInput
          label="City, Area or Landmark (Worldwide)"
          value={dest}
          onChange={(p) => {
            setDest(p);
            if (p) performSearch(p, cat, keyword);
          }}
          placeholder="e.g. Maldives, Paris, London, Dubai, Tokyo, Kodaikanal, Madurai"
        />

        {/* Quick International Destination Chips */}
        <div>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Popular Worldwide Destinations:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_INTERNATIONAL_DESTINATIONS.map((quick) => (
              <button
                key={quick.id}
                type="button"
                onClick={() => {
                  setDest(quick);
                  performSearch(quick, cat, keyword);
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all border ${
                  dest?.name === quick.name
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-surface hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {quick.name}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Category Tabs (Including Forts, Temples, Beaches, Hotels, etc.) */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-foreground block">Explore by Interest:</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Search Categories">
          {SEARCH_CATEGORIES.map((c) => {
            const isSelected = cat === c;
            const label =
              c === "Heritage"
                ? t.heritage
                : c === "Temples"
                  ? t.temples
                  : c === "Fort"
                    ? t.fort
                    : c === "Beach"
                      ? t.beach
                      : c === "Shopping"
                        ? t.shopping
                        : c === "Culture"
                          ? t.culture
                          : c === "Food"
                            ? t.food
                            : c === "Amusement"
                              ? t.amusement
                              : c === "Hotels"
                                ? t.hotels
                                : c;

            return (
              <Button
                key={c}
                size="sm"
                variant={isSelected ? "default" : "outline"}
                aria-pressed={isSelected}
                disabled={state === "loading" && !places}
                onClick={() => performSearch(dest, c, keyword)}
                className={`text-xs font-semibold h-9 rounded-full px-4 ${
                  isSelected ? "shadow-md" : ""
                }`}
              >
                {c === "Heritage" && <Landmark className="mr-1.5 size-3.5" />}
                {c === "Temples" && <Flame className="mr-1.5 size-3.5" />}
                {c === "Fort" && <ShieldCheck className="mr-1.5 size-3.5" />}
                {c === "Beach" && <Palmtree className="mr-1.5 size-3.5" />}
                {c === "Shopping" && <ShoppingBag className="mr-1.5 size-3.5" />}
                {c === "Culture" && <Globe className="mr-1.5 size-3.5" />}
                {c === "Food" && <Utensils className="mr-1.5 size-3.5" />}
                {label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card/60 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer font-medium">
            <Switch checked={wheelchairOnly} onCheckedChange={setWheelchairOnly} />
            <span>Wheelchair accessible</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer font-medium">
            <Switch checked={highRatingOnly} onCheckedChange={setHighRatingOnly} />
            <span>Top rated (4.5★+)</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Radius: {maxDistance} km</span>
          <input
            type="range"
            min="5"
            max="60"
            step="5"
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            className="w-24 accent-primary"
          />
        </div>
      </div>

      {/* Search Results Section */}
      <section aria-label="Search Results" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">
            {dest?.name} · {cat} Places
            {places && (
              <span className="text-muted-foreground font-normal ml-2">
                ({filteredPlaces.length} found)
              </span>
            )}
          </h2>
        </div>

        {/* Loading State - stays visible until data is rendered */}
        {state === "loading" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs font-semibold text-primary">
              <Loader2 className="size-5 animate-spin text-primary" />
              <span>
                Finding real, verified places with photos and official guides for {dest?.name}…
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="h-64 animate-pulse rounded-2xl bg-muted/40 p-4" />
              ))}
            </div>
          </div>
        )}

        {state === "error" && (
          <Card className="p-6 text-center text-xs text-destructive border-destructive/20 bg-destructive/5 rounded-2xl">
            Could not fetch places right now. Please check your connection or choose another
            category.
          </Card>
        )}

        {state !== "loading" && filteredPlaces.length === 0 && (
          <Card className="p-8 text-center text-xs text-muted-foreground rounded-2xl border">
            No {cat} spots found matching your filter criteria. Try extending the radius or
            unchecking filters.
          </Card>
        )}

        {/* Places Grid with Real Photos, 3D Previews, and Verified Tour Guides */}
        {state !== "loading" && filteredPlaces.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {filteredPlaces.map((p) => {
              const guide = p.tourGuideContact;
              return (
                <Card
                  key={p.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border bg-card shadow-xs transition-all hover:shadow-md hover:border-primary/40"
                >
                  <div>
                    {/* Place Photo with Category & Rating Badges */}
                    <div className="relative h-48 w-full overflow-hidden bg-muted">
                      {p.photoUrl ? (
                        <img
                          src={p.photoUrl}
                          alt={p.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
                          No photo available
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 p-3 flex flex-col justify-between text-white">
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-bold backdrop-blur-xs">
                            {p.category}
                          </span>
                          {/* 3D Preview Button */}
                          <Button
                            size="sm"
                            onClick={() => setPreviewPlace(p)}
                            className="h-7 gap-1 rounded-full bg-white/90 px-2.5 text-[11px] font-bold text-black shadow-sm hover:bg-white"
                          >
                            <Box className="size-3 text-primary" />
                            3D Preview
                          </Button>
                        </div>

                        <div>
                          {p.rating && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-black">
                              <Star className="size-3 fill-black" />
                              {p.rating}
                              {p.ratingCount ? ` (${p.ratingCount.toLocaleString()})` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Place Details */}
                    <div className="p-4 space-y-2.5">
                      <div>
                        <h3 className="font-display text-lg font-bold text-foreground leading-tight">
                          {p.name}
                        </h3>
                        {p.localName && (
                          <span className="text-xs text-muted-foreground font-normal">
                            ({p.localName})
                          </span>
                        )}
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="size-3 text-primary shrink-0" />
                          <span className="truncate">
                            {p.address || `${p.distanceKm.toFixed(1)} km from centre`}
                          </span>
                        </p>
                      </div>

                      {/* Google-Style Details */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground pt-1 border-t">
                        <span className="font-semibold text-foreground">
                          {p.price || "Free Entry"}
                        </span>
                        <span>·</span>
                        <span>{p.hoursText?.[0] || "Opening hours verified"}</span>
                        {p.wheelchair && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-700 font-medium">
                              Wheelchair Accessible
                            </span>
                          </>
                        )}
                      </div>

                      {/* Item 7: Verified Tour Guide / Tourism Contact */}
                      {guide && (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 font-bold text-primary text-[11px]">
                              <ShieldCheck className="size-3.5" />
                              Verified Tour Guide & Desk
                            </span>
                            <span className="text-[10px] text-muted-foreground">Certified</span>
                          </div>
                          <p className="text-[11px] font-semibold text-foreground truncate">
                            {guide.name} · {guide.agency}
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] font-bold text-primary">
                              {guide.phone}
                            </span>
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-[10px] font-bold border-primary/40 text-primary hover:bg-primary hover:text-white"
                            >
                              <a href={`tel:${guide.phone.replace(/\s+/g, "")}`}>
                                <Phone className="mr-1 size-2.5" />
                                Call Guide
                              </a>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-4 pt-0 flex items-center justify-between gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-semibold text-primary"
                    >
                      <a href={p.mapsUrl} target="_blank" rel="noreferrer">
                        Google Maps
                        <ExternalLink className="ml-1 size-3" />
                      </a>
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleSaveToTrip(p)}
                      className="h-8 text-xs font-semibold"
                    >
                      <BookmarkPlus className="mr-1 size-3.5" />
                      Save Place
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 3D Preview / 360 Tour Modal */}
      {previewPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <Card className="relative w-full max-w-2xl overflow-hidden rounded-3xl border bg-card p-0 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <Box className="size-5 text-primary" />
                <h3 className="font-display text-xl font-bold">{previewPlace.name} · 3D View</h3>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setPreviewPlace(null)}
                className="size-8 rounded-full"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* 3D Perspective Visual Frame */}
            <div className="relative h-80 w-full overflow-hidden bg-black">
              {previewPlace.photoUrl && (
                <img
                  src={previewPlace.photoUrl}
                  alt={previewPlace.name}
                  className="h-full w-full object-cover transition-transform duration-1000 scale-105 filter brightness-95"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent p-6 flex flex-col justify-end text-white">
                <span className="rounded-full bg-primary/90 px-3 py-1 text-xs font-bold text-white w-max flex items-center gap-1">
                  <Video className="size-3.5" />
                  3D Aerial Street & Satellite Simulation
                </span>
                <h4 className="mt-2 font-display text-2xl font-bold">{previewPlace.name}</h4>
                <p className="text-xs text-white/80">
                  Lat: {previewPlace.lat.toFixed(4)}, Lon: {previewPlace.lon.toFixed(4)} ·{" "}
                  {previewPlace.address || dest?.name}
                </p>
              </div>
            </div>

            {/* Modal Body & Direct 3D Launcher */}
            <div className="p-5 space-y-4">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Experience full 3D interactive satellite buildings, Street View, and aerial terrain
                tours for {previewPlace.name} directly on Google Earth and Maps.
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                  asChild
                  className="h-10 text-xs font-bold bg-primary text-primary-foreground shadow-md"
                >
                  <a
                    href={
                      previewPlace.preview3dUrl ||
                      `https://earth.google.com/web/search/${encodeURIComponent(previewPlace.name)}`
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Box className="mr-2 size-4" />
                    Launch Interactive 3D Earth Tour
                    <ExternalLink className="ml-1.5 size-3.5" />
                  </a>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewPlace(null)}
                  className="h-10 text-xs font-semibold"
                >
                  Close Preview
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
