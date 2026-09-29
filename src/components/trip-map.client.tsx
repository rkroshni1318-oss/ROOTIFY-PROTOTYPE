import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

export type MapStop = { lat: number; lon: number; label: string; name: string; hotel?: boolean };
export type MapExtra = { lat: number; lon: number; name: string };

export default function TripMap({
  stops,
  route,
  extras = [],
  me,
}: {
  stops: MapStop[];
  route: [number, number][] | null;
  extras?: MapExtra[];
  me?: { lat: number; lon: number } | null;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { zoomControl: true, keyboard: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    const g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    const pts: L.LatLngExpression[] = [];
    const line =
      route && route.length > 1 ? route : stops.map((s) => [s.lat, s.lon] as [number, number]);
    if (line.length > 1) L.polyline(line, { color: "#B87333", weight: 4, opacity: 0.85 }).addTo(g);
    stops.forEach((s) => {
      pts.push([s.lat, s.lon]);
      const icon = L.divIcon({
        className: "",
        html: `<div class="rootify-pin${s.hotel ? " rootify-pin--hotel" : ""}" aria-hidden="true">${s.label}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
      L.marker([s.lat, s.lon], { icon, title: s.name, alt: s.name })
        .bindPopup(`<strong>${s.label}. </strong>${escapeHtml(s.name)}`)
        .addTo(g);
    });
    extras.forEach((x) => {
      L.circleMarker([x.lat, x.lon], { radius: 6, color: "#1f2a44", weight: 2, fillOpacity: 0.6 })
        .bindPopup(escapeHtml(x.name))
        .addTo(g);
    });
    if (me) {
      L.circleMarker([me.lat, me.lon], {
        radius: 8,
        color: "#2563eb",
        fillColor: "#3b82f6",
        fillOpacity: 0.9,
      })
        .bindPopup("You are here")
        .addTo(g);
      pts.push([me.lat, me.lon]);
    }
    if (pts.length) m.fitBounds(L.latLngBounds(pts), { padding: [30, 30], maxZoom: 15 });
    else m.setView([20, 0], 2);
  }, [stops, route, extras, me]);

  return <div ref={el} className="h-full w-full" role="region" aria-label="Map of trip stops" />;
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
