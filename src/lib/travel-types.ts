export type GeoPlace = {
  id: string;
  name: string;
  admin1?: string | null;
  country: string;
  countryCode?: string | null;
  lat: number;
  lon: number;
  timezone: string;
};

export type Category =
  | "Heritage"
  | "Temples"
  | "Fort"
  | "Food"
  | "Beach"
  | "Shopping"
  | "Culture"
  | "Amusement"
  | "Hotels"
  | "Other";

export const SEARCH_CATEGORIES: Category[] = [
  "Heritage",
  "Temples",
  "Fort",
  "Beach",
  "Shopping",
  "Culture",
  "Amusement",
  "Hotels",
  "Food",
];

export const INTEREST_OPTIONS = [
  "Heritage",
  "Temples",
  "Fort",
  "Food",
  "Beach",
  "Shopping",
  "Culture",
  "Amusement",
  "Hotels",
  "Other",
] as const;

export const TRANSPORT_MODES = ["Walk", "Taxi", "Auto", "Bus", "Metro", "Own vehicle"] as const;
export type TransportMode = (typeof TRANSPORT_MODES)[number];

export type OpeningPeriod = { day: number; open: number; close: number }; // minutes from 00:00, close may exceed 1440

export type TourGuideContact = {
  name: string;
  phone: string;
  agency: string;
  verified: boolean;
  language?: string;
};

export type Place = {
  id: string;
  name: string;
  localName?: string | null;
  category: Category;
  lat: number;
  lon: number;
  address?: string | null;
  rating?: number | null;
  ratingCount?: number | null;
  price?: string | null; // only real listed fees
  hoursText?: string[] | null;
  periods?: OpeningPeriod[] | null;
  wheelchair: boolean | null; // null = not verified
  outdoor: boolean;
  source: "google" | "osm";
  mapsUrl: string;
  distanceKm: number; // from destination centre
  dayTrip?: boolean;
  photoUrl?: string | null;
  preview3dUrl?: string | null;
  phone?: string | null;
  tourGuideContact?: TourGuideContact | null;
};

export type TravelTicket = {
  id: string;
  mode: "Flight" | "Train" | "Bus" | "Metro";
  from: string;
  to: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  operator: string;
  vehicleNumber: string;
  seatNumber: string;
  travelClass: string;
  price: number;
  currency: string;
  passengerName: string;
  pnr: string;
  status: "Confirmed" | "Completed" | "Cancelled";
  bookedAt: string;
};

export type LegOption = {
  mode: TransportMode;
  minutes: number;
  km: number;
  cost: number | null;
  lineDetails?: string[] | null; // real transit lines only
  lineNote?: string | null;
};

export type Leg = {
  fromId: string;
  toId: string;
  km: number;
  options: LegOption[];
  chosen: TransportMode;
  geometry?: [number, number][];
};

export type SlotOption = {
  place: Place;
  match: number;
  why: string;
  crowd: "Low" | "Medium" | "High";
  nearby: { place: Place; meters: number }[];
};

export type Slot = {
  key: string;
  label: string;
  start: string; // HH:mm
  end: string;
  category: Category;
  options: SlotOption[];
  chosen: number;
  weatherFlag?: string | null;
};

export type DayWeather = {
  date: string;
  min: number;
  max: number;
  feels: number;
  rain: number;
  label: "Very hot" | "Hot" | "Pleasant" | "Cool" | "Cold" | "Rainy";
  advice: string;
  kind: "Forecast" | "Typical";
};

export type PlanDay = {
  date: string;
  slots: Slot[];
  legs: Leg[];
  weather: DayWeather | null;
  note?: string | null;
};

export type TripPlan = {
  title?: string;
  description?: string;
  planStyle?: string;
  destination: GeoPlace;
  origin: GeoPlace | null;
  days: PlanDay[];
  hotels: { place: Place; reason: string }[];
  hotelChoice: number;
  weatherError?: string | null;
  originNow?: { temp: number; label: string } | null;
  notices: string[];
  currency: string;
  generatedAt: string;
};

export type TripInput = {
  origin: GeoPlace | null;
  destination: GeoPlace;
  startDate: string;
  endDate: string;
  dayStart: string;
  dayEnd: string;
  budget: number;
  currency: string;
  group: "Solo" | "Family" | "Friends";
  interests: string[];
  otherInterest: string;
  transport: TransportMode[];
  lessWalking: boolean;
  wheelchair: boolean;
};

export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function mapsLink(p: { lat: number; lon: number; name: string }) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}&query_place_id=&center=${p.lat},${p.lon}`.replace(
    "&query_place_id=",
    "",
  );
}

export function planCost(plan: TripPlan) {
  const legs = plan.days.flatMap((d) => d.legs);
  const transport = legs.reduce(
    (s, l) => s + (l.options.find((o) => o.mode === l.chosen)?.cost ?? 0),
    0,
  );
  const unpriced = plan.days
    .flatMap((d) => d.slots)
    .filter((s) => !s.options[s.chosen]?.place.price).length;
  return { transport: Math.round(transport), unpriced };
}
