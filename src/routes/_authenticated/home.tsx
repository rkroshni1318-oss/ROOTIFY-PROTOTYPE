import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Bot,
  Calendar,
  Clock,
  Compass,
  DollarSign,
  ExternalLink,
  Flame,
  Globe2,
  Heart,
  Landmark,
  MapPin,
  Palmtree,
  PlusCircle,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { displayName, greetingFor, useSession } from "@/lib/use-session";
import { useI18n } from "@/lib/i18n";
import { deleteTrip, listTrips, restoreTrip, type TripRow } from "@/lib/trips";
import { askGeminiTravelAgent } from "@/lib/travel.functions";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home — Rootify Your Travels" },
      {
        name: "description",
        content: "Explore trending worldwide destinations, plan trips, and view your itineraries.",
      },
    ],
  }),
  component: HomePage,
});

const POPULAR_DESTINATIONS = [
  {
    id: "dest_maldives",
    name: "Maldives",
    country: "South Asia",
    tagline: "Turquoise Lagoons & Coral Reefs",
    rating: 4.9,
    img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80",
    tags: ["Beach", "Luxury", "Snorkeling"],
    temp: "29°C · Pleasant",
  },
  {
    id: "dest_paris",
    name: "Paris",
    country: "France",
    tagline: "Eiffel, Art Galleries & Seine Cruising",
    rating: 4.8,
    img: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=800&q=80",
    tags: ["Heritage", "Culture", "Cuisine"],
    temp: "19°C · Spring",
  },
  {
    id: "dest_dubai",
    name: "Dubai",
    country: "United Arab Emirates",
    tagline: "Futuristic Skyline & Desert Safaris",
    rating: 4.9,
    img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
    tags: ["Shopping", "Amusement", "Fort"],
    temp: "32°C · Sunny",
  },
  {
    id: "dest_tokyo",
    name: "Tokyo",
    country: "Japan",
    tagline: "Historic Shrines & Neon Metropolis",
    rating: 4.9,
    img: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
    tags: ["Temples", "Culture", "Culinary"],
    temp: "18°C · Mild",
  },
  {
    id: "dest_london",
    name: "London",
    country: "United Kingdom",
    tagline: "Royal Palaces, West End & Museums",
    rating: 4.8,
    img: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
    tags: ["Heritage", "Fort", "West End"],
    temp: "16°C · Crisp",
  },
  {
    id: "dest_kodaikanal",
    name: "Kodaikanal",
    country: "India",
    tagline: "Mist Covered Hills, Star Lake & Pine Woods",
    rating: 4.7,
    img: "https://images.unsplash.com/photo-1626014303757-6467009419f2?auto=format&fit=crop&w=800&q=80",
    tags: ["Hill Station", "Lake", "Trekking"],
    temp: "17°C · Cool",
  },
];

const TOURISM_CATEGORIES = [
  { label: "Heritage", icon: Landmark, color: "text-amber-600 bg-amber-500/10" },
  { label: "Temples", icon: Flame, color: "text-orange-600 bg-orange-500/10" },
  { label: "Forts & Castles", icon: ShieldAlert, color: "text-rose-600 bg-rose-500/10" },
  { label: "Beaches", icon: Palmtree, color: "text-cyan-600 bg-cyan-500/10" },
  { label: "Culture & Museums", icon: Globe2, color: "text-emerald-600 bg-emerald-500/10" },
  { label: "Shopping & Souks", icon: DollarSign, color: "text-purple-600 bg-purple-500/10" },
];

export function HomePage() {
  const { session } = useSession();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [now, setNow] = useState<Date>(new Date());
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  // Gemini AI Assistant on Home Page
  const askAi = useServerFn(askGeminiTravelAgent);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    const interval = setInterval(() => {
      if (mounted) setNow(new Date());
    }, 1000);

    listTrips()
      .then((r) => {
        if (mounted) {
          setTrips(r.rows);
          setLoadingTrips(false);
        }
      })
      .catch(() => {
        if (mounted) setLoadingTrips(false);
      });

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  async function handleDeletePlan(tRow: TripRow) {
    const destName = tRow.destination?.name || "this plan";
    if (!window.confirm(`Are you sure you want to delete the plan for ${destName}?`)) {
      return;
    }

    try {
      const raw = await deleteTrip(tRow.id);
      setTrips((prev) => prev.filter((item) => item.id !== tRow.id));
      toast.success(`Deleted plan for ${destName}`, {
        action: {
          label: "Undo",
          onClick: async () => {
            await restoreTrip(raw);
            const fresh = await listTrips();
            setTrips(fresh.rows);
          },
        },
      });
    } catch {
      toast.error("Couldn't delete the plan.");
    }
  }

  async function handleAskGemini(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!aiQuestion.trim()) return;

    setAiBusy(true);
    try {
      const res = await askAi({
        data: {
          prompt: aiQuestion.trim(),
          destination: trips[0]?.destination?.name || "Worldwide Destinations",
          planSummary: trips[0]?.plan
            ? `Active trip to ${trips[0].destination?.name} with ${trips[0].plan.days.length} days.`
            : undefined,
        },
      });
      setAiAnswer(res);
    } catch {
      setAiAnswer(
        "Rootify AI recommends checking official attraction opening hours in advance, keeping offline maps handy, and sampling authentic local dishes!",
      );
    } finally {
      setAiBusy(false);
    }
  }

  const userDisplayName = displayName(session);

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Premium Destination Hero Greeting Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
        {/* Background Travel Destination Visual */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80"
            alt="Scenic Travel Landscape"
            className="h-full w-full object-cover object-center filter brightness-75 contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-4 p-6 text-white sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
              <Clock className="size-3.5 text-amber-300" />
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ·{" "}
              {now.toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="rounded-full bg-linear-to-r from-amber-400 to-amber-500 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-black shadow-md">
              {t.globalEdition}
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl text-white drop-shadow-md">
              {greetingFor(now)}, {userDisplayName}!
            </h1>
            <p className="text-sm font-medium leading-relaxed text-white/90 sm:text-base max-w-xl drop-shadow-sm">
              {t.tagline}
            </p>
          </div>

          {/* Primary Action Buttons ("Create Plan" and "Search Places") */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-xl bg-primary px-7 font-bold text-white shadow-xl hover:bg-primary/90 transition-all hover:scale-[1.02]"
            >
              <Link to="/plan">
                <PlusCircle className="mr-2 size-5" />
                {t.createPlan}
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-xl border-white/30 bg-white/15 px-6 font-semibold text-white backdrop-blur-md hover:bg-white/25 hover:border-white/50 transition-all"
            >
              <a
                href="https://www.google.com/maps"
                target="_blank"
                rel="noreferrer"
                className="flex items-center"
              >
                <Search className="mr-2 size-5" />
                {t.searchPlaces}
                <ExternalLink className="ml-1.5 size-3.5 opacity-80" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. User's Created Plans & Itineraries Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Compass className="size-6 text-primary" />
              {t.activeItineraries}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.selectItineraryOption}
            </p>
          </div>

          <Button asChild size="sm" variant="outline">
            <Link to="/plan">
              <PlusCircle className="mr-1.5 size-4" />
              {t.createPlan}
            </Link>
          </Button>
        </div>

        {loadingTrips ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i} className="h-40 animate-pulse rounded-2xl bg-muted/50 p-5" />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <Card className="rounded-2xl border border-dashed bg-card/60 p-8 text-center shadow-xs">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Compass className="size-7" />
            </div>
            <h3 className="mt-3 text-base font-bold text-foreground">
              {t.noPlansYet || "No travel plans created yet"}
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
              {t.noPlansDesc || "Create your first plan for any destination in the world with real opening hours, weather replanning, and transport routes."}
            </p>
            <div className="mt-4">
              <Button asChild>
                <Link to="/plan">
                  <PlusCircle className="mr-2 size-4" />
                  {t.createPlan}
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {trips.map((tRow) => {
              const destName = tRow.destination?.name || "Custom Journey";
              const totalStops = tRow.plan?.days.reduce((acc, d) => acc + d.slots.length, 0) || 0;
              const daysCount = tRow.plan?.days.length || 1;

              return (
                <Card
                  key={tRow.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-xl font-bold text-foreground">
                            {destName}
                          </h3>
                          <Badge
                            variant={tRow.status === "planned" ? "default" : "secondary"}
                            className="text-[10px] uppercase font-semibold"
                          >
                            {tRow.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="size-3 text-primary" />
                          {tRow.destination?.country || "Worldwide"}
                        </p>
                      </div>

                      {/* Delete Plan Button */}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeletePlan(tRow)}
                        className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title={t.deletePlan || `Delete ${destName} Plan`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                      <div className="rounded-lg bg-surface p-2 border">
                        <span className="text-[11px] text-muted-foreground block">{t.totalBudget || "Duration"}</span>
                        <span className="font-bold text-foreground">
                          {daysCount} {daysCount > 1 ? "Days" : "Day"} · {totalStops} Stops
                        </span>
                      </div>
                      <div className="rounded-lg bg-surface p-2 border">
                        <span className="text-[11px] text-muted-foreground block">{t.budget}</span>
                        <span className="font-bold text-foreground">
                          {tRow.currency || "INR"} {(tRow.budget || 20000).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs">
                    <span className="text-muted-foreground">
                      {tRow.start_date || "Flexible dates"}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button asChild size="sm" className="h-8 text-xs font-semibold">
                        <Link to="/trip/$id" params={{ id: tRow.id }}>
                          {t.dayByDayItinerary || "View Itinerary"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Gemini AI Travel Concierge Assistant */}
      <section className="rounded-3xl border bg-linear-to-r from-card to-primary/5 p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Bot className="size-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              Gemini AI Travel Concierge
            </h2>
            <p className="text-xs text-muted-foreground">
              Ask any question about local secrets, cultural etiquette, weather tips, or street
              food.
            </p>
          </div>
        </div>

        <form onSubmit={handleAskGemini} className="mt-4 flex gap-2">
          <Input
            placeholder="e.g. Best photography spots in Paris at sunrise, or what to wear in Maldives?"
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            className="h-11 bg-surface text-sm"
          />
          <Button type="submit" disabled={aiBusy} className="h-11 px-5 font-semibold">
            {aiBusy ? <Sparkles className="animate-spin size-4" /> : <Send className="size-4" />}
          </Button>
        </form>

        {aiAnswer && (
          <div className="mt-4 rounded-2xl border bg-surface p-4 text-xs leading-relaxed text-foreground shadow-xs">
            <div className="flex items-center gap-1.5 font-bold text-primary mb-1">
              <Sparkles className="size-3.5" />
              Gemini Tourist Insights
            </div>
            <p className="whitespace-pre-line">{aiAnswer}</p>
          </div>
        )}
      </section>

      {/* 4. Trending Worldwide Destinations Showcase */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Globe2 className="size-6 text-primary" />
              Trending Destinations Worldwide
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Curated verified hotspots across Asia, Europe, and the Middle East.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR_DESTINATIONS.map((dest) => (
            <Card
              key={dest.id}
              className="group overflow-hidden rounded-2xl border bg-card shadow-xs transition-all hover:shadow-lg"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <img
                  src={dest.img}
                  alt={dest.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-4 flex flex-col justify-end text-white">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-black">
                      <Star className="size-3 fill-black" />
                      {dest.rating}
                    </span>
                    <span className="text-[11px] font-semibold text-white/90">{dest.temp}</span>
                  </div>
                  <h3 className="mt-1 font-display text-2xl font-bold">{dest.name}</h3>
                  <p className="text-xs text-white/80">{dest.tagline}</p>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {dest.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Button
                    asChild
                    size="sm"
                    className="w-full text-xs font-semibold"
                    onClick={() => {
                      toast.info(`Preparing trip to ${dest.name}...`);
                    }}
                  >
                    <Link to="/plan">Plan Trip to {dest.name}</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 5. Browse by Category */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Explore by Travel Interest
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {TOURISM_CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <Card
                key={c.label}
                onClick={() => navigate({ to: "/search" })}
                className="cursor-pointer p-4 text-center rounded-2xl border transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div
                  className={`mx-auto flex size-12 items-center justify-center rounded-2xl ${c.color}`}
                >
                  <Icon className="size-6" />
                </div>
                <h3 className="mt-2 text-xs font-bold text-foreground">{c.label}</h3>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
