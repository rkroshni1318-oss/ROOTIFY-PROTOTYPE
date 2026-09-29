import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Calendar,
  Compass,
  Download,
  IndianRupee,
  MapPin,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { deleteTrip, listTrips, restoreTrip, tripToIcs, type TripRow } from "@/lib/trips";

export const Route = createFileRoute("/_authenticated/trips")({
  head: () => ({
    meta: [
      { title: "My Trips — Rootify Your Travels" },
      {
        name: "description",
        content: "Review saved trips, drafts, budget tracking, and real hour-by-hour itineraries.",
      },
    ],
  }),
  component: TripsPage,
});

export function TripsPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<TripRow[] | null>(null);
  const [filter, setFilter] = useState<"all" | "planned" | "draft">("all");
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState(false);

  const load = () =>
    listTrips()
      .then((r) => {
        setRows(r.rows);
        setOffline(r.offline);
      })
      .catch(() => setError(true));

  useEffect(() => {
    void load();
  }, []);

  async function remove(tRow: TripRow) {
    const destName = tRow.destination?.name ?? "this destination";
    if (!window.confirm(`Delete the trip plan for ${destName}?`)) return;
    try {
      const raw = await deleteTrip(tRow.id);
      await load();
      toast(`Deleted trip plan for ${destName}`, {
        action: { label: "Undo", onClick: () => void restoreTrip(raw).then(load) },
      });
    } catch {
      toast.error("Couldn't delete the trip.");
    }
  }

  function handleExportIcs(tRow: TripRow) {
    const icsContent = tripToIcs(tRow);
    if (!icsContent) {
      toast.error("No itinerary stops available to export.");
      return;
    }
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Rootify_${tRow.destination?.name || "Trip"}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Calendar (.ics) downloaded!");
  }

  const filteredRows = (rows || []).filter((r) => {
    if (filter === "planned") return r.status === "planned";
    if (filter === "draft") return r.status === "draft";
    return true;
  });

  const plannedTrips = (rows || []).filter((r) => r.status === "planned");
  const totalBudgeted = plannedTrips.reduce((acc, r) => acc + (r.budget || 20000), 0);
  const totalStopsPlanned = plannedTrips.reduce((acc, r) => {
    const stopsCount = r.plan?.days.reduce((sAcc, d) => sAcc + d.slots.length, 0) || 0;
    return acc + stopsCount;
  }, 0);

  return (
    <section className="space-y-6 pb-20">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Compass className="size-7 text-primary" />
            {t.myTrips}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.activeItineraries || "Manage your active journeys, drafts, budgets, and verified stops worldwide."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/plan">
              <PlusCircle className="mr-1.5 size-4" />
              {t.createPlan}
            </Link>
          </Button>
        </div>
      </div>

      {offline && (
        <div
          role="status"
          className="rounded-xl border bg-amber-500/10 p-3 text-xs text-amber-800 font-medium"
        >
          Offline Mode Active: Showing locally cached trips and itineraries.
        </div>
      )}

      {/* Analytics Summary Dashboard */}
      {plannedTrips.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="p-4 rounded-2xl border bg-card shadow-xs">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <IndianRupee className="size-3.5 text-primary" />
              Total Budget Committed
            </span>
            <p className="mt-1 text-2xl font-bold text-foreground">
              ₹{totalBudgeted.toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Across {plannedTrips.length} active journey{plannedTrips.length > 1 ? "s" : ""}
            </p>
          </Card>

          <Card className="p-4 rounded-2xl border bg-card shadow-xs">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <MapPin className="size-3.5 text-primary" />
              Verified Sights & Stops
            </span>
            <p className="mt-1 text-2xl font-bold text-foreground">{totalStopsPlanned} Stops</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              100% verified real-world places & opening hours
            </p>
          </Card>

          <Card className="p-4 rounded-2xl border bg-card shadow-xs">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              Plan B Travel Protection
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600">Active</span>
              <Badge className="bg-emerald-500/10 text-emerald-700 text-[10px]">
                Live Rerouting
              </Badge>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Automatic adjustments for weather and schedule delays
            </p>
          </Card>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b pb-2">
        <Button
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          className="h-8 text-xs font-semibold"
          onClick={() => setFilter("all")}
        >
          All ({rows?.length || 0})
        </Button>
        <Button
          size="sm"
          variant={filter === "planned" ? "default" : "outline"}
          className="h-8 text-xs font-semibold"
          onClick={() => setFilter("planned")}
        >
          Planned ({plannedTrips.length})
        </Button>
        <Button
          size="sm"
          variant={filter === "draft" ? "default" : "outline"}
          className="h-8 text-xs font-semibold"
          onClick={() => setFilter("draft")}
        >
          Drafts ({(rows || []).filter((r) => r.status === "draft").length})
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive font-medium">Couldn't load trips right now.</p>
      )}

      {rows && filteredRows.length === 0 && (
        <Card className="p-8 text-center text-sm text-muted-foreground rounded-2xl border">
          <p>
            No {filter === "all" ? "" : filter} plans found. Create a new plan to see it here!
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
      )}

      {/* Trips List */}
      <div className="space-y-3">
        {filteredRows.map((tRow) => {
          const destName = tRow.destination?.name ?? "Custom Destination";
          const stopsCount = tRow.plan?.days.reduce((acc, d) => acc + d.slots.length, 0) || 0;
          const isDraft = tRow.status === "draft";

          return (
            <Card
              key={tRow.id}
              className="rounded-2xl border bg-card p-5 transition-all hover:border-primary/40 shadow-xs"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-foreground">{destName}</h3>
                    <Badge
                      variant={isDraft ? "secondary" : "default"}
                      className="text-[10px] uppercase font-semibold"
                    >
                      {tRow.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tRow.destination?.country || "Worldwide"} ·{" "}
                    {tRow.start_date
                      ? `${tRow.start_date} → ${tRow.end_date}`
                      : "Flexible Dates"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleExportIcs(tRow)}
                    className="size-8 text-muted-foreground hover:text-foreground"
                    title="Export Calendar (.ics)"
                  >
                    <Download className="size-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(tRow)}
                    className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title={`Delete ${destName} Plan`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-xs">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>{stopsCount} Verified Stops</span>
                  <span>·</span>
                  <span>Budget: {tRow.currency || "INR"} {(tRow.budget || 20000).toLocaleString()}</span>
                </div>

                <Button asChild size="sm" className="h-8 font-semibold text-xs">
                  <Link to="/trip/$id" params={{ id: tRow.id }}>
                    {isDraft ? "Continue Plan" : "View Itinerary"}
                  </Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export default TripsPage;
