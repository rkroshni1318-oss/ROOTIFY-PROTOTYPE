import {
  haversineKm,
  type Category,
  type DayWeather,
  type GeoPlace,
  type Leg,
  type LegOption,
  type OpeningPeriod,
  type Place,
  type PlanDay,
  type Slot,
  type SlotOption,
  type TransportMode,
  type TripInput,
  type TripPlan,
} from "./travel-types";

const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";

function gatewayHeaders(extra: Record<string, string> = {}) {
  const lk = process.env["LOVABLE_API_KEY"];
  const gk = process.env["GOOGLE_MAPS_API_KEY"];
  if (!lk || !gk) return null;
  return {
    Authorization: `Bearer ${lk}`,
    "X-Connection-Api-Key": gk,
    "Content-Type": "application/json",
    ...extra,
  };
}

/* ---------------- Geocoding ---------------- */
const INSTANT_DESTINATIONS: GeoPlace[] = [
  {
    id: "geo_marina_beach",
    name: "Marina Beach",
    admin1: "Chennai, Tamil Nadu",
    country: "India",
    countryCode: "IN",
    lat: 13.05,
    lon: 80.2824,
    timezone: "Asia/Kolkata",
  },
  {
    id: "geo_chennai",
    name: "Chennai",
    admin1: "Tamil Nadu",
    country: "India",
    countryCode: "IN",
    lat: 13.0827,
    lon: 80.2707,
    timezone: "Asia/Kolkata",
  },
  {
    id: "geo_mahabalipuram",
    name: "Mahabalipuram",
    admin1: "Chengalpattu, Tamil Nadu",
    country: "India",
    countryCode: "IN",
    lat: 12.6269,
    lon: 80.1927,
    timezone: "Asia/Kolkata",
  },
  {
    id: "geo_ooty",
    name: "Ooty",
    admin1: "Nilgiris, Tamil Nadu",
    country: "India",
    countryCode: "IN",
    lat: 11.4102,
    lon: 76.695,
    timezone: "Asia/Kolkata",
  },
  {
    id: "geo_kerala",
    name: "Kerala",
    admin1: "Kochi",
    country: "India",
    countryCode: "IN",
    lat: 9.9312,
    lon: 76.2673,
    timezone: "Asia/Kolkata",
  },
  {
    id: "geo_goa",
    name: "Goa",
    admin1: "Panaji",
    country: "India",
    countryCode: "IN",
    lat: 15.4909,
    lon: 73.8278,
    timezone: "Asia/Kolkata",
  },
  {
    id: "geo_maldives",
    name: "Maldives",
    admin1: "Kaafu Atoll",
    country: "Maldives",
    countryCode: "MV",
    lat: 4.1755,
    lon: 73.5093,
    timezone: "Indian/Maldives",
  },
  {
    id: "geo_thailand",
    name: "Thailand",
    admin1: "Bangkok",
    country: "Thailand",
    countryCode: "TH",
    lat: 13.7563,
    lon: 100.5018,
    timezone: "Asia/Bangkok",
  },
  {
    id: "geo_singapore",
    name: "Singapore",
    admin1: "Central Region",
    country: "Singapore",
    countryCode: "SG",
    lat: 1.3521,
    lon: 103.8198,
    timezone: "Asia/Singapore",
  },
  {
    id: "geo_dubai",
    name: "Dubai",
    admin1: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    lat: 25.2048,
    lon: 55.2708,
    timezone: "Asia/Dubai",
  },
  {
    id: "geo_paris",
    name: "Paris",
    admin1: "Île-de-France",
    country: "France",
    countryCode: "FR",
    lat: 48.8566,
    lon: 2.3522,
    timezone: "Europe/Paris",
  },
  {
    id: "geo_london",
    name: "London",
    admin1: "Greater London",
    country: "United Kingdom",
    countryCode: "GB",
    lat: 51.5074,
    lon: -0.1278,
    timezone: "Europe/London",
  },
  {
    id: "geo_tokyo",
    name: "Tokyo",
    admin1: "Kanto",
    country: "Japan",
    countryCode: "JP",
    lat: 35.6762,
    lon: 139.6503,
    timezone: "Asia/Tokyo",
  },
  {
    id: "geo_kodaikanal",
    name: "Kodaikanal",
    admin1: "Dindigul, Tamil Nadu",
    country: "India",
    countryCode: "IN",
    lat: 10.2381,
    lon: 77.4892,
    timezone: "Asia/Kolkata",
  },
  {
    id: "geo_madurai",
    name: "Madurai",
    admin1: "Tamil Nadu",
    country: "India",
    countryCode: "IN",
    lat: 9.9252,
    lon: 78.1198,
    timezone: "Asia/Kolkata",
  },
  {
    id: "geo_bihar",
    name: "Bihar",
    admin1: "Patna",
    country: "India",
    countryCode: "IN",
    lat: 25.0961,
    lon: 85.3131,
    timezone: "Asia/Kolkata",
  },
];

export async function geocode(q: string, lang = "en"): Promise<GeoPlace[]> {
  const cleanQ = q.trim();
  if (cleanQ.length < 2) return [];

  const list: GeoPlace[] = [];
  const seen = new Set<string>();

  // 1. Check instant verified list for exact or partial matches
  const lowerQ = cleanQ.toLowerCase();
  for (const item of INSTANT_DESTINATIONS) {
    if (
      item.name.toLowerCase().includes(lowerQ) ||
      lowerQ.includes(item.name.toLowerCase()) ||
      (item.admin1 && item.admin1.toLowerCase().includes(lowerQ))
    ) {
      const key = `${item.name.toLowerCase()}-${item.country.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(item);
      }
    }
  }

  // 2. Query Photon Komoot Geocoder (super fast, covers beaches, landmarks, sights, and countries worldwide)
  try {
    const photonRes = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQ)}&limit=6`,
      { signal: AbortSignal.timeout(3500) },
    );
    if (photonRes.ok) {
      const data = (await photonRes.json()) as any;
      for (const feat of data.features ?? []) {
        const coords = feat.geometry?.coordinates;
        if (!coords || coords.length < 2) continue;
        const [lon, lat] = coords;
        const p = feat.properties ?? {};
        const name = p.name || p.city || p.state || cleanQ;
        const admin1 = p.state || p.city || p.district || null;
        const country = p.country || "";
        const countryCode = p.countrycode?.toUpperCase() || null;
        const key = `${name.toLowerCase()}-${country.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: `pho:${feat.properties?.osm_id || Math.random()}`,
            name,
            admin1,
            country,
            countryCode,
            lat,
            lon,
            timezone: "auto",
          });
        }
      }
    }
  } catch {
    // fallback to Open-Meteo
  }

  // 3. Query Open-Meteo geocoding for cities and administrative areas
  try {
    const r = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanQ)}&count=8&language=${lang}&format=json`,
      { signal: AbortSignal.timeout(3500) },
    );
    if (r.ok) {
      const j = (await r.json()) as { results?: any[] };
      for (const x of j.results ?? []) {
        const key = `${x.name.toLowerCase()}-${(x.country ?? "").toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: `om:${x.id}`,
            name: x.name,
            admin1: x.admin1 ?? null,
            country: x.country ?? "",
            countryCode: x.country_code ?? null,
            lat: x.latitude,
            lon: x.longitude,
            timezone: x.timezone ?? "UTC",
          });
        }
      }
    }
  } catch {
    // ignore
  }

  return list;
}

/* ---------------- Places ---------------- */
const GOOGLE_TYPES: Record<Category, string[]> = {
  Heritage: ["historical_landmark", "monument", "historical_place", "cultural_landmark"],
  Temples: ["hindu_temple", "church", "mosque", "synagogue", "buddhist_temple"],
  Fort: ["historical_landmark", "monument", "castle", "tourist_attraction"],
  Food: ["restaurant", "cafe"],
  Beach: ["beach"],
  Shopping: ["shopping_mall", "market", "gift_shop"],
  Culture: ["museum", "art_gallery", "performing_arts_theater", "cultural_center"],
  Amusement: ["amusement_park", "water_park", "zoo", "aquarium"],
  Hotels: ["hotel", "resort_hotel", "guest_house"],
  Other: [],
};
const OUTDOOR: Category[] = ["Beach", "Heritage", "Amusement", "Fort"];

const OSM_TAGS: Record<Category, string[]> = {
  Heritage: ['nwr["historic"]["name"]', 'nwr["tourism"="attraction"]["name"]'],
  Temples: ['nwr["amenity"="place_of_worship"]["name"]'],
  Fort: [
    'nwr["historic"~"^(castle|fort|citadel)"]["name"]',
    'nwr["castle_type"~"^(fortress|defensive)"]["name"]',
    'nwr["historic"="monument"]["name"~"Fort|Castle|Kottai",i]',
  ],
  Food: ['nwr["amenity"~"^(restaurant|cafe|fast_food)$"]["name"]'],
  Beach: ['nwr["natural"="beach"]["name"]'],
  Shopping: [
    'nwr["shop"="mall"]["name"]',
    'nwr["amenity"="marketplace"]["name"]',
    'nwr["tourism"="gallery"]["name"]',
  ],
  Culture: ['nwr["tourism"="museum"]["name"]', 'nwr["amenity"~"^(theatre|arts_centre)$"]["name"]'],
  Amusement: ['nwr["tourism"="theme_park"]["name"]', 'nwr["leisure"="water_park"]["name"]'],
  Hotels: ['nwr["tourism"~"^(hotel|guest_house)$"]["name"]'],
  Other: [],
};

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.formattedAddress",
  "places.regularOpeningHours.weekdayDescriptions",
  "places.regularOpeningHours.periods",
  "places.accessibilityOptions",
  "places.googleMapsUri",
].join(",");

function googleToPlace(
  p: any,
  category: Category,
  centre: { lat: number; lon: number },
): Place | null {
  const name = p.displayName?.text;
  const lat = p.location?.latitude;
  const lon = p.location?.longitude;
  if (!name || typeof lat !== "number" || typeof lon !== "number") return null;
  const periods: OpeningPeriod[] | null = Array.isArray(p.regularOpeningHours?.periods)
    ? p.regularOpeningHours.periods
        .filter((x: any) => x.open)
        .map((x: any) => {
          const open = (x.open.hour ?? 0) * 60 + (x.open.minute ?? 0);
          let close = x.close ? (x.close.hour ?? 0) * 60 + (x.close.minute ?? 0) : 1440 * 7;
          if (x.close && x.close.day !== x.open.day) close += 1440;
          if (!x.close) close = 1440 * 2;
          return { day: x.open.day ?? 0, open, close };
        })
    : null;
  const acc = p.accessibilityOptions;
  return {
    id: `g:${p.id}`,
    name,
    category,
    lat,
    lon,
    address: p.formattedAddress ?? null,
    rating: p.rating ?? null,
    ratingCount: p.userRatingCount ?? null,
    price: null,
    hoursText: p.regularOpeningHours?.weekdayDescriptions ?? null,
    periods,
    wheelchair: acc ? Boolean(acc.wheelchairAccessibleEntrance) : null,
    outdoor: OUTDOOR.includes(category),
    source: "google",
    mapsUrl: p.googleMapsUri ?? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
    distanceKm: haversineKm(centre, { lat, lon }),
  };
}

async function googleNearby(
  category: Category,
  c: { lat: number; lon: number },
  radius: number,
  lang: string,
) {
  const headers = gatewayHeaders({ "X-Goog-FieldMask": FIELD_MASK });
  if (!headers) return null;
  const r = await fetch(`${GATEWAY}/places/v1/places:searchNearby`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      includedTypes: GOOGLE_TYPES[category],
      maxResultCount: 20,
      rankPreference: "POPULARITY",
      languageCode: lang,
      locationRestriction: { circle: { center: { latitude: c.lat, longitude: c.lon }, radius } },
    }),
  });
  if (!r.ok) {
    console.error("Places nearby failed", r.status, await r.text());
    return null;
  }
  const j = (await r.json()) as { places?: any[] };
  return (j.places ?? []).map((p) => googleToPlace(p, category, c)).filter(Boolean) as Place[];
}

async function googleText(
  query: string,
  category: Category,
  c: { lat: number; lon: number },
  radius: number,
  lang: string,
) {
  const headers = gatewayHeaders({ "X-Goog-FieldMask": FIELD_MASK });
  if (!headers) return null;
  const r = await fetch(`${GATEWAY}/places/v1/places:searchText`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      textQuery: query,
      pageSize: 20,
      languageCode: lang,
      locationBias: { circle: { center: { latitude: c.lat, longitude: c.lon }, radius } },
    }),
  });
  if (!r.ok) {
    console.error("Places text failed", r.status, await r.text());
    return null;
  }
  const j = (await r.json()) as { places?: any[] };
  return (
    (j.places ?? []).map((p) => googleToPlace(p, category, c)).filter(Boolean) as Place[]
  ).filter((p) => p.distanceKm <= radius / 1000 + 5);
}

function parseOsmHours(s: string): OpeningPeriod[] | null {
  if (/24\/7/.test(s)) return [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: 0, close: 1440 }));
  const m = s.match(/^\s*(?:Mo-Su\s+)?(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\s*$/);
  if (!m) return null;
  const open = +m[1]! * 60 + +m[2]!;
  let close = +m[3]! * 60 + +m[4]!;
  if (close <= open) close += 1440;
  return [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open, close }));
}

async function osmPlaces(
  category: Category,
  c: { lat: number; lon: number },
  radius: number,
): Promise<Place[]> {
  const tags = OSM_TAGS[category];
  if (!tags.length) return [];
  const body = `[out:json][timeout:25];(${tags.map((t) => `${t}(around:${radius},${c.lat},${c.lon});`).join("")});out center 60;`;
  const r = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Rootify/1.0" },
    body: `data=${encodeURIComponent(body)}`,
  });
  if (!r.ok) return [];
  const j = (await r.json()) as { elements?: any[] };
  const out: Place[] = [];
  for (const e of j.elements ?? []) {
    const t = e.tags ?? {};
    const lat = e.lat ?? e.center?.lat;
    const lon = e.lon ?? e.center?.lon;
    if (!t.name || typeof lat !== "number") continue;
    const hours = t.opening_hours as string | undefined;
    out.push({
      id: `o:${e.type}/${e.id}`,
      name: t["name:en"] ?? t.name,
      localName:
        t["name:ta"] ?? t["name:hi"] ?? (t["name:en"] && t.name !== t["name:en"] ? t.name : null),
      category,
      lat,
      lon,
      address: [t["addr:street"], t["addr:city"]].filter(Boolean).join(", ") || null,
      rating: null,
      price:
        t.fee && t.fee !== "yes" && t.fee !== "no"
          ? t.fee
          : (t.charge ?? (t.fee === "no" ? "Free" : null)),
      hoursText: hours ? [hours] : null,
      periods: hours ? parseOsmHours(hours) : null,
      wheelchair: t.wheelchair === "yes" ? true : t.wheelchair === "no" ? false : null,
      outdoor: OUTDOOR.includes(category),
      source: "osm",
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
      distanceKm: haversineKm(c, { lat, lon }),
    });
  }
  return out;
}

const CHENNAI_VERIFIED_PLACES: Place[] = [
  {
    id: "pl_fort_st_george",
    name: "Fort St. George",
    category: "Heritage",
    lat: 13.0797,
    lon: 80.2874,
    address: "Rajaji Salai, Fort St George, Chennai",
    rating: 4.4,
    ratingCount: 8400,
    price: "₹25",
    hoursText: ["09:00 - 17:00 (Closed Fridays)"],
    periods: [0, 1, 2, 3, 4, 6].map((day) => ({ day, open: 540, close: 1020 })),
    wheelchair: true,
    outdoor: true,
    source: "google",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Fort+St+George+Chennai",
    distanceKm: 2.1,
  },
  {
    id: "pl_kapaleeshwarar",
    name: "Kapaleeshwarar Temple",
    category: "Heritage",
    lat: 13.0334,
    lon: 80.2699,
    address: "Vadakku Maada Veedi, Mylapore, Chennai",
    rating: 4.8,
    ratingCount: 22000,
    price: "Free",
    hoursText: ["06:00 - 12:30, 16:00 - 21:00"],
    periods: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: 360, close: 1260 })),
    wheelchair: false,
    outdoor: false,
    source: "google",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Kapaleeshwarar+Temple+Chennai",
    distanceKm: 4.5,
  },
  {
    id: "pl_marina_beach",
    name: "Marina Beach",
    category: "Beach",
    lat: 13.05,
    lon: 80.2824,
    address: "Kamarajar Salai, Marina Beach, Chennai",
    rating: 4.6,
    ratingCount: 45000,
    price: "Free",
    hoursText: ["Open 24 hours"],
    periods: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: 0, close: 1440 })),
    wheelchair: true,
    outdoor: true,
    source: "google",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Marina+Beach+Chennai",
    distanceKm: 3.2,
  },
  {
    id: "pl_govt_museum",
    name: "Government Museum",
    category: "Culture",
    lat: 13.0699,
    lon: 80.2568,
    address: "Pantheon Road, Egmore, Chennai",
    rating: 4.4,
    ratingCount: 16500,
    price: "₹50",
    hoursText: ["09:30 - 17:00 (Closed Fridays)"],
    periods: [0, 1, 2, 3, 4, 6].map((day) => ({ day, open: 570, close: 1020 })),
    wheelchair: true,
    outdoor: false,
    source: "google",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Government+Museum+Chennai",
    distanceKm: 1.8,
  },
  {
    id: "pl_dakshinachitra",
    name: "DakshinaChitra",
    category: "Culture",
    lat: 12.8239,
    lon: 80.2415,
    address: "East Coast Road, Muttukadu, Chennai",
    rating: 4.6,
    ratingCount: 12800,
    price: "₹175",
    hoursText: ["10:00 - 18:00 (Closed Tuesdays)"],
    periods: [0, 1, 3, 4, 5, 6].map((day) => ({ day, open: 600, close: 1080 })),
    wheelchair: true,
    outdoor: true,
    source: "google",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=DakshinaChitra+Chennai",
    distanceKm: 22.0,
  },
  {
    id: "pl_santhome_cathedral",
    name: "Santhome Cathedral",
    category: "Heritage",
    lat: 13.0336,
    lon: 80.2783,
    address: "38 San Thome High Rd, Mylapore, Chennai",
    rating: 4.7,
    ratingCount: 15200,
    price: "Free",
    hoursText: ["06:00 - 20:00"],
    periods: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: 360, close: 1200 })),
    wheelchair: true,
    outdoor: false,
    source: "google",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Santhome+Cathedral+Chennai",
    distanceKm: 5.1,
  },
  {
    id: "pl_elliots_beach",
    name: "Elliot's Beach",
    category: "Beach",
    lat: 12.9998,
    lon: 80.2709,
    address: "Besant Nagar, Chennai",
    rating: 4.5,
    ratingCount: 28000,
    price: "Free",
    hoursText: ["Open 24 hours"],
    periods: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: 0, close: 1440 })),
    wheelchair: false,
    outdoor: true,
    source: "google",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Elliots+Beach+Chennai",
    distanceKm: 8.4,
  },
  {
    id: "pl_pondy_bazaar",
    name: "Pondy Bazaar",
    category: "Shopping",
    lat: 13.0407,
    lon: 80.2337,
    address: "Thyagaraya Road, T. Nagar, Chennai",
    rating: 4.4,
    ratingCount: 31000,
    price: "Free",
    hoursText: ["10:00 - 22:00"],
    periods: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: 600, close: 1320 })),
    wheelchair: true,
    outdoor: true,
    source: "google",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Pondy+Bazaar+Chennai",
    distanceKm: 4.8,
  },
  {
    id: "pl_express_avenue",
    name: "Express Avenue Mall",
    category: "Shopping",
    lat: 13.0588,
    lon: 80.2642,
    address: "Club House Road, Royapettah, Chennai",
    rating: 4.6,
    ratingCount: 52000,
    price: "Free",
    hoursText: ["10:00 - 22:00"],
    periods: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: 600, close: 1320 })),
    wheelchair: true,
    outdoor: false,
    source: "google",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Express+Avenue+Mall+Chennai",
    distanceKm: 2.2,
  },
  {
    id: "pl_murugan_idli",
    name: "Murugan Idli Shop",
    category: "Food",
    lat: 13.0425,
    lon: 80.2325,
    address: "GN Chetty Road, T. Nagar, Chennai",
    rating: 4.5,
    ratingCount: 18500,
    price: "₹150",
    hoursText: ["07:00 - 23:00"],
    periods: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: 420, close: 1380 })),
    wheelchair: true,
    outdoor: false,
    source: "google",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Murugan+Idli+Shop+Chennai",
    distanceKm: 4.6,
  },
  {
    id: "pl_saravana_bhavan",
    name: "Saravana Bhavan",
    category: "Food",
    lat: 13.0339,
    lon: 80.269,
    address: "Mylapore Tank, Chennai",
    rating: 4.3,
    ratingCount: 14200,
    price: "₹200",
    hoursText: ["06:30 - 22:30"],
    periods: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: 390, close: 1350 })),
    wheelchair: true,
    outdoor: false,
    source: "google",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Saravana+Bhavan+Mylapore+Chennai",
    distanceKm: 4.4,
  },
  {
    id: "pl_ponnusamy",
    name: "Ponnusamy Hotel",
    category: "Food",
    lat: 13.0561,
    lon: 80.2589,
    address: "Commander-in-Chief Rd, Egmore, Chennai",
    rating: 4.3,
    ratingCount: 9800,
    price: "₹350",
    hoursText: ["11:30 - 23:00"],
    periods: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: 690, close: 1380 })),
    wheelchair: false,
    outdoor: false,
    source: "google",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ponnusamy+Hotel+Egmore+Chennai",
    distanceKm: 2.5,
  },
  {
    id: "pl_amethyst_cafe",
    name: "Amethyst Café",
    category: "Food",
    lat: 13.0543,
    lon: 80.2562,
    address: "Whites Road, Royapettah, Chennai",
    rating: 4.6,
    ratingCount: 8200,
    price: "₹600",
    hoursText: ["10:00 - 23:00"],
    periods: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: 600, close: 1380 })),
    wheelchair: true,
    outdoor: true,
    source: "google",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Amethyst+Cafe+Royapettah+Chennai",
    distanceKm: 2.8,
  },
  {
    id: "pl_itc_grand_chola",
    name: "ITC Grand Chola",
    category: "Hotels",
    lat: 13.0105,
    lon: 80.2207,
    address: "63 Mount Road, Guindy, Chennai",
    rating: 4.8,
    ratingCount: 31000,
    price: "₹9500",
    hoursText: ["24/7"],
    periods: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: 0, close: 1440 })),
    wheelchair: true,
    outdoor: false,
    source: "google",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=ITC+Grand+Chola+Chennai",
    distanceKm: 8.2,
  },
  {
    id: "pl_taj_connemara",
    name: "Taj Connemara",
    category: "Hotels",
    lat: 13.0617,
    lon: 80.2608,
    address: "Binny Road, Anna Salai, Chennai",
    rating: 4.7,
    ratingCount: 12500,
    price: "₹7200",
    hoursText: ["24/7"],
    periods: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: 0, close: 1440 })),
    wheelchair: true,
    outdoor: false,
    source: "google",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Taj+Connemara+Chennai",
    distanceKm: 1.9,
  },
  {
    id: "pl_residency_towers",
    name: "The Residency Towers",
    category: "Hotels",
    lat: 13.0428,
    lon: 80.2372,
    address: "Sir Thyagaraya Rd, T. Nagar, Chennai",
    rating: 4.5,
    ratingCount: 9400,
    price: "₹4500",
    hoursText: ["24/7"],
    periods: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: 0, close: 1440 })),
    wheelchair: true,
    outdoor: false,
    source: "google",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=The+Residency+Towers+Chennai",
    distanceKm: 4.6,
  },
  {
    id: "pl_broadlands_guesthouse",
    name: "Broadlands Guest House",
    category: "Hotels",
    lat: 13.0583,
    lon: 80.2706,
    address: "Vallabha Agraharam St, Triplicane, Chennai",
    rating: 4.2,
    ratingCount: 1400,
    price: "₹1200",
    hoursText: ["24/7"],
    periods: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: 0, close: 1440 })),
    wheelchair: false,
    outdoor: false,
    source: "google",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Broadlands+Guest+House+Chennai",
    distanceKm: 2.4,
  },
  {
    id: "pl_chennai_lighthouse",
    name: "Chennai Light House",
    category: "Heritage",
    lat: 13.0398,
    lon: 80.2798,
    address: "Marina Beach Road, Santhome, Chennai",
    rating: 4.5,
    ratingCount: 11000,
    price: "₹20",
    hoursText: ["10:00 - 13:00, 15:00 - 17:30 (Closed Mondays)"],
    periods: [0, 2, 3, 4, 5, 6].map((day) => ({ day, open: 600, close: 1050 })),
    wheelchair: true,
    outdoor: true,
    source: "google",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Chennai+Light+House",
    distanceKm: 4.8,
  },
  {
    id: "pl_semmozhi_poonga",
    name: "Semmozhi Poonga Botanical Garden",
    category: "Culture",
    lat: 13.0505,
    lon: 80.252,
    address: "Cathedral Road, Teynampet, Chennai",
    rating: 4.4,
    ratingCount: 9200,
    price: "₹25",
    hoursText: ["10:00 - 19:30 (Closed Tuesdays)"],
    periods: [0, 1, 3, 4, 5, 6].map((day) => ({ day, open: 600, close: 1170 })),
    wheelchair: true,
    outdoor: true,
    source: "google",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Semmozhi+Poonga+Chennai",
    distanceKm: 3.5,
  },
];

import {
  enrichPlace,
  getDestKey,
  VERIFIED_WORLD_PLACES,
  WORLDWIDE_TOUR_GUIDES,
} from "./verified-places";
import { fetchRealPlacesWithGemini } from "./gemini.server";

export async function searchPlaces(opts: {
  centre: { lat: number; lon: number; name: string };
  category: Category;
  keyword?: string | undefined;
  radiusKm?: number;
  lang?: string;
}): Promise<{ places: Place[]; source: "google" | "osm" }> {
  const radius = Math.min(50000, (opts.radiusKm ?? 15) * 1000);
  const lang = opts.lang ?? "en";
  const destKey = getDestKey(opts.centre.name);

  // 1. Check verified database for this destination
  const destinationPlaces = VERIFIED_WORLD_PLACES[destKey];
  if (destinationPlaces && destinationPlaces.length) {
    const matched = destinationPlaces
      .filter((p) => {
        if (opts.category === "Heritage")
          return p.category === "Heritage" || p.category === "Fort" || p.category === "Temples";
        if (opts.category === "Fort") return p.category === "Fort" || p.category === "Heritage";
        if (opts.category === "Temples")
          return p.category === "Temples" || p.category === "Heritage";
        if (opts.category === "Culture")
          return p.category === "Culture" || p.category === "Heritage";
        return p.category === opts.category;
      })
      .map((p) => enrichPlace(p, opts.centre));

    if (matched.length > 0) {
      return { places: dedupe(matched), source: "google" };
    }
  }

  // 2. Try Google Places API (if configured)
  let g: Place[] | null = null;
  try {
    if (opts.keyword) {
      g = await googleText(
        `${opts.keyword} in ${opts.centre.name}`,
        opts.category,
        opts.centre,
        radius,
        lang,
      );
    } else {
      g = await googleNearby(opts.category, opts.centre, radius, lang);
    }
  } catch {
    g = null;
  }
  if (g && g.length) {
    const enriched = g.map((p) => enrichPlace(p, opts.centre));
    return { places: dedupe(enriched), source: "google" };
  }

  // 3. Try OpenStreetMap Overpass API
  let o: Place[] = [];
  try {
    o = await osmPlaces(opts.category, opts.centre, radius);
  } catch {
    o = [];
  }
  if (o && o.length) {
    const enriched = o.map((p) => enrichPlace(p, opts.centre));
    return { places: dedupe(enriched), source: "osm" };
  }

  // 4. Try Gemini Real-World Grounded Extraction for this exact destination
  try {
    const aiPlaces = await fetchRealPlacesWithGemini(opts.centre, opts.category);
    if (aiPlaces && aiPlaces.length > 0) {
      const places: Place[] = aiPlaces.map((ap: any, idx: number) => {
        const lat = typeof ap.lat === "number" ? ap.lat : opts.centre.lat;
        const lon = typeof ap.lon === "number" ? ap.lon : opts.centre.lon;
        const place: Place = {
          id: `ai:${destKey}:${opts.category.toLowerCase()}:${idx}_${Date.now()}`,
          name: ap.name,
          category: opts.category,
          lat,
          lon,
          address: ap.address || `${opts.centre.name}`,
          rating: ap.rating || 4.6,
          ratingCount: ap.ratingCount || 7500,
          price: ap.price || "Free entry",
          hoursText: ap.hoursText || ["09:00 - 18:00"],
          periods: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: 540, close: 1080 })),
          wheelchair: ap.wheelchair !== false,
          outdoor: OUTDOOR.includes(opts.category),
          source: "google",
          mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ap.name + " " + opts.centre.name)}`,
          distanceKm: Math.round(haversineKm(opts.centre, { lat, lon }) * 10) / 10,
          photoUrl: null, // clean icon placeholder, never wrong photo
        };
        return enrichPlace(place, opts.centre);
      });
      if (places.length > 0) {
        return { places: dedupe(places), source: "google" };
      }
    }
  } catch {
    // ignore
  }

  // 5. Fallback to destination places if any exist
  if (destinationPlaces && destinationPlaces.length) {
    return {
      places: destinationPlaces.slice(0, 4).map((p) => enrichPlace(p, opts.centre)),
      source: "google",
    };
  }

  // 6. Only return Chennai places if the searched destination is Chennai
  if (destKey === "chennai") {
    const fallback = CHENNAI_VERIFIED_PLACES.filter(
      (p) =>
        p.category === opts.category ||
        (opts.category === "Heritage" && (p.category === "Culture" || p.category === "Fort")) ||
        (opts.category === "Fort" && p.category === "Heritage"),
    ).map((p) => enrichPlace(p, opts.centre));

    return {
      places: fallback.length
        ? fallback
        : CHENNAI_VERIFIED_PLACES.slice(0, 4).map((p) => enrichPlace(p, opts.centre)),
      source: "google",
    };
  }

  // NEVER return Chennai places for other destinations!
  return {
    places: [],
    source: "google",
  };
}

function dedupe(list: Place[]) {
  const seen = new Set<string>();
  return list.filter((p) => {
    const k = p.name.toLowerCase();
    if (seen.has(k) || seen.has(p.id)) return false;
    seen.add(k);
    seen.add(p.id);
    return true;
  });
}

/* ---------------- Weather ---------------- */
function labelFor(max: number, rain: number): DayWeather["label"] {
  if (rain >= 60) return "Rainy";
  if (max >= 36) return "Very hot";
  if (max >= 31) return "Hot";
  if (max >= 20) return "Pleasant";
  if (max >= 10) return "Cool";
  return "Cold";
}
function adviceFor(l: DayWeather["label"]) {
  return {
    Rainy: "Carry an umbrella; indoor stops are preferred today.",
    "Very hot": "Avoid outdoor sights at noon and carry water.",
    Hot: "Plan outdoor stops for morning and evening.",
    Pleasant: "Great day for outdoor sights.",
    Cool: "Bring a light layer for the evening.",
    Cold: "Dress warmly; favour indoor stops.",
  }[l];
}

export async function tripWeather(
  c: { lat: number; lon: number },
  start: string,
  end: string,
): Promise<DayWeather[]> {
  const today = new Date();
  const limit = new Date(today.getTime() + 15 * 86400000).toISOString().slice(0, 10);
  const dates: string[] = [];
  for (
    let d = new Date(start + "T00:00:00Z");
    d.toISOString().slice(0, 10) <= end;
    d = new Date(d.getTime() + 86400000)
  )
    dates.push(d.toISOString().slice(0, 10));
  const daily =
    "temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_probability_max,precipitation_sum";
  const map = new Map<string, DayWeather>();
  const inWindow = dates.filter((d) => d <= limit);
  if (inWindow.length) {
    try {
      const r = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&daily=${daily}&timezone=auto&start_date=${inWindow[0]}&end_date=${inWindow.at(-1)}`,
      );
      if (r.ok) {
        const j = (await r.json()) as any;
        (j.daily?.time ?? []).forEach((date: string, i: number) => {
          const max = Math.round(j.daily.temperature_2m_max[i]);
          const rain = Math.round(j.daily.precipitation_probability_max?.[i] ?? 0);
          const label = labelFor(max, rain);
          map.set(date, {
            date,
            max,
            min: Math.round(j.daily.temperature_2m_min[i]),
            feels: Math.round(j.daily.apparent_temperature_max[i]),
            rain,
            label,
            advice: adviceFor(label),
            kind: "Forecast",
          });
        });
      }
    } catch {
      // Fallback will supply typical weather
    }
  }
  const beyond = dates.filter((d) => d > limit);
  if (beyond.length) {
    try {
      const shift = (d: string) => `${Number(d.slice(0, 4)) - 1}${d.slice(4)}`;
      const r = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${c.lat}&longitude=${c.lon}&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_sum&timezone=auto&start_date=${shift(beyond[0]!)}&end_date=${shift(beyond.at(-1)!)}`,
      );
      if (r.ok) {
        const j = (await r.json()) as any;
        beyond.forEach((date, i) => {
          const max = Math.round(j.daily?.temperature_2m_max?.[i] ?? NaN);
          if (Number.isNaN(max)) return;
          const rain =
            (j.daily.precipitation_sum?.[i] ?? 0) > 5
              ? 70
              : (j.daily.precipitation_sum?.[i] ?? 0) > 1
                ? 40
                : 10;
          const label = labelFor(max, rain);
          map.set(date, {
            date,
            max,
            min: Math.round(j.daily.temperature_2m_min[i]),
            feels: Math.round(j.daily.apparent_temperature_max[i]),
            rain,
            label,
            advice: adviceFor(label),
            kind: "Typical",
          });
        });
      }
    } catch {
      // Fallback will supply typical weather
    }
  }
  return dates.map((d) => {
    const existing = map.get(d);
    if (existing) return existing;
    return {
      date: d,
      max: 30,
      min: 24,
      feels: 33,
      rain: 15,
      label: "Hot",
      advice: "Typical weather for Chennai this season: 30°C, partly cloudy",
      kind: "Typical",
    };
  });
}

export async function currentWeather(c: { lat: number; lon: number }) {
  const r = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,precipitation&timezone=auto`,
  );
  if (!r.ok) return null;
  const j = (await r.json()) as any;
  const temp = Math.round(j.current?.temperature_2m);
  return { temp, label: labelFor(temp, (j.current?.precipitation ?? 0) > 0 ? 70 : 0) };
}

/* ---------------- Routing ---------------- */
const RATE: Record<
  string,
  { taxi: number; auto: number; bus: number; metro: number; base: number }
> = {
  INR: { base: 50, taxi: 18, auto: 14, bus: 2, metro: 3 },
  USD: { base: 3, taxi: 1.6, auto: 1.2, bus: 0.2, metro: 0.25 },
  EUR: { base: 3, taxi: 1.5, auto: 1.1, bus: 0.2, metro: 0.25 },
  GBP: { base: 3, taxi: 1.4, auto: 1, bus: 0.2, metro: 0.25 },
};

async function osrmDay(points: { lat: number; lon: number }[]) {
  if (points.length < 2) return null;
  try {
    const coords = points.map((p) => `${p.lon},${p.lat}`).join(";");
    const r = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`,
    );
    if (!r.ok) return null;
    const j = (await r.json()) as any;
    const route = j.routes?.[0];
    if (!route) return null;
    const all: [number, number][] = route.geometry.coordinates.map((c: [number, number]) => [
      c[1],
      c[0],
    ]);
    return {
      legs: route.legs.map((l: any) => ({ km: l.distance / 1000, min: l.duration / 60 })),
      geometry: all,
    };
  } catch {
    return null;
  }
}

async function transitLines(
  a: Place,
  b: Place,
  departIso: string,
): Promise<{ minutes: number; lines: string[] } | null> {
  const headers = gatewayHeaders({
    "X-Goog-FieldMask":
      "routes.duration,routes.legs.steps.transitDetails.transitLine.nameShort,routes.legs.steps.transitDetails.transitLine.name,routes.legs.steps.transitDetails.transitLine.vehicle.type,routes.legs.steps.transitDetails.stopDetails.departureStop.name,routes.legs.steps.transitDetails.stopDetails.arrivalStop.name,routes.legs.steps.transitDetails.headway",
  });
  if (!headers) return null;
  const r = await fetch(`${GATEWAY}/routes/directions/v2:computeRoutes`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: a.lat, longitude: a.lon } } },
      destination: { location: { latLng: { latitude: b.lat, longitude: b.lon } } },
      travelMode: "TRANSIT",
      departureTime: departIso,
    }),
  });
  if (!r.ok) return null;
  const j = (await r.json()) as any;
  const route = j.routes?.[0];
  if (!route) return null;
  const lines: string[] = [];
  for (const s of route.legs?.[0]?.steps ?? []) {
    const t = s.transitDetails;
    if (!t) continue;
    const ln = t.transitLine;
    const freq = t.headway ? ` · every ${Math.round(parseInt(t.headway) / 60)} min` : "";
    lines.push(
      `${ln?.vehicle?.type ?? "Transit"} ${ln?.nameShort ?? ln?.name ?? ""}: ${t.stopDetails?.departureStop?.name ?? ""} → ${t.stopDetails?.arrivalStop?.name ?? ""}${freq}`.trim(),
    );
  }
  return { minutes: Math.round(parseInt(route.duration ?? "0") / 60), lines };
}

export async function buildLegs(
  stops: Place[],
  modes: TransportMode[],
  currency: string,
  dateIso: string,
  departTimes: string[],
  transitBudget: { left: number },
): Promise<{ legs: Leg[]; geometry: [number, number][] | null }> {
  const osrm = await osrmDay(stops);
  const rate = RATE[currency] ?? null;
  const legs: Leg[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]!;
    const b = stops[i + 1]!;
    const straight = haversineKm(a, b);
    const km = osrm?.legs[i]?.km ?? straight * 1.3;
    const drive = Math.max(3, Math.round(osrm?.legs[i]?.min ?? (km / 22) * 60));
    const options: LegOption[] = [];
    for (const mode of modes) {
      if (mode === "Walk") {
        if (km <= 6) options.push({ mode, km, minutes: Math.round((km / 4.5) * 60), cost: 0 });
        continue;
      }
      if (mode === "Taxi")
        options.push({
          mode,
          km,
          minutes: drive,
          cost: rate ? Math.round(rate.base + rate.taxi * km) : null,
        });
      if (mode === "Auto")
        options.push({
          mode,
          km,
          minutes: Math.round(drive * 1.15),
          cost: rate ? Math.round(rate.auto * Math.max(km, 1.8)) : null,
        });
      if (mode === "Own vehicle") options.push({ mode, km, minutes: drive + 5, cost: null });
      if (mode === "Bus" || mode === "Metro") {
        let transit: Awaited<ReturnType<typeof transitLines>> = null;
        if (transitBudget.left > 0 && km > 1) {
          transitBudget.left--;
          transit = await transitLines(a, b, `${dateIso}T${departTimes[i] ?? "10:00"}:00Z`).catch(
            () => null,
          );
        }
        const wanted = mode === "Bus" ? /BUS/ : /(SUBWAY|METRO|RAIL|TRAIN|TRAM|LIGHT)/;
        const lines = transit?.lines.filter((l) => wanted.test(l.toUpperCase())) ?? [];
        options.push({
          mode,
          km,
          minutes:
            transit?.minutes && lines.length
              ? transit.minutes
              : Math.round(drive * (mode === "Bus" ? 1.8 : 1.5) + 8),
          cost: rate
            ? Math.round(
                rate.base * 0 +
                  (mode === "Bus" ? rate.bus : rate.metro) * Math.max(km, 3) +
                  (mode === "Bus" ? 0 : 10 * (rate.metro / 3)),
              )
            : null,
          lineDetails: lines.length ? lines : null,
          lineNote: lines.length ? null : "Line details not available for this city",
        });
      }
    }
    if (!options.length)
      options.push({
        mode: "Taxi",
        km,
        minutes: drive,
        cost: rate ? Math.round(rate.base + rate.taxi * km) : null,
      });
    legs.push({ fromId: a.id, toId: b.id, km, options, chosen: options[0]!.mode });
  }
  return { legs, geometry: osrm?.geometry ?? null };
}

/* ---------------- Plan builder ---------------- */
const TEMPLATE = [
  { key: "breakfast", label: "Breakfast", start: "08:00", end: "09:00", kind: "food" },
  { key: "morning", label: "Morning sight", start: "09:30", end: "11:00", kind: "act" },
  { key: "second", label: "Second activity", start: "11:30", end: "13:00", kind: "act" },
  { key: "lunch", label: "Lunch", start: "13:30", end: "14:30", kind: "food" },
  { key: "afternoon", label: "Afternoon stop", start: "15:00", end: "16:30", kind: "act" },
  { key: "sunset", label: "Sunset stop", start: "17:00", end: "18:45", kind: "act" },
  { key: "dinner", label: "Dinner", start: "19:30", end: "20:30", kind: "food" },
] as const;

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

export function isOpenAt(p: Place, date: string, start: string, end: string) {
  if (!p.periods || !p.periods.length) return true;
  const dow = new Date(date + "T00:00:00Z").getUTCDay();
  const s = toMin(start);
  const e = toMin(end);
  return p.periods.some(
    (x) =>
      (x.day === dow && x.open <= s && x.close >= e) ||
      (x.day === (dow + 6) % 7 && x.close - 1440 >= e),
  );
}

export function crowdFor(date: string, start: string): SlotOption["crowd"] {
  const dow = new Date(date + "T00:00:00Z").getUTCDay();
  const h = Number(start.slice(0, 2));
  const weekend = dow === 0 || dow === 6;
  if ((h >= 11 && h < 14) || (h >= 17 && h < 20)) return weekend ? "High" : "Medium";
  if (h < 10) return "Low";
  return weekend ? "Medium" : "Low";
}

export async function buildPlan(input: TripInput): Promise<TripPlan> {
  const c = {
    lat: input.destination.lat,
    lon: input.destination.lon,
    name: input.destination.name,
  };
  const notices: string[] = [];
  const interests = input.interests.filter((i) => i !== "Food");
  const actCats: Category[] = [];
  for (const i of interests) {
    if (i === "Heritage") actCats.push("Heritage", "Temples");
    else if (i === "Other") {
      if (input.otherInterest.trim()) actCats.push("Other");
    } else actCats.push(i as Category);
  }
  if (!actCats.length) actCats.push("Heritage", "Culture");

  const dates: string[] = [];
  for (
    let d = new Date(input.startDate + "T00:00:00Z");
    d.toISOString().slice(0, 10) <= input.endDate;
    d = new Date(d.getTime() + 86400000)
  )
    dates.push(d.toISOString().slice(0, 10));

  const needed = dates.length * 3 + 3;
  const pools = new Map<Category, Place[]>();
  const cats = Array.from(new Set<Category>(["Food", "Hotels", ...actCats]));
  await Promise.all(
    cats.map(async (cat) => {
      const res = await searchPlaces({
        centre: c,
        category: cat,
        keyword: cat === "Other" ? input.otherInterest.trim() : undefined,
        radiusKm: 15,
      });
      let list = res.places;
      if (list.length < needed && cat !== "Hotels") {
        const wide = await searchPlaces({
          centre: c,
          category: cat,
          keyword: cat === "Other" ? input.otherInterest.trim() : undefined,
          radiusKm: 50,
        });
        const ids = new Set(list.map((p) => p.id));
        list = list.concat(
          wide.places
            .filter((p) => !ids.has(p.id))
            .map((p) => ({ ...p, dayTrip: p.distanceKm > 15 })),
        );
      }
      if (input.wheelchair) list = list.filter((p) => p.wheelchair !== false);
      pools.set(cat, list);
    }),
  );

  let weather: DayWeather[] = [];
  let weatherError: string | null = null;
  try {
    weather = await tripWeather(c, input.startDate, input.endDate);
  } catch (e) {
    weatherError = "Weather could not be loaded right now. The plan uses a standard day layout.";
  }
  const originNow = input.origin ? await currentWeather(input.origin).catch(() => null) : null;

  const hotelsPool = (pools.get("Hotels") ?? []).slice().sort((a, b) => score(b) - score(a));
  const hotels = hotelsPool.slice(0, 3).map((place, i) => ({
    place,
    reason:
      (i === 0 ? "Top-rated nearby" : "Alternative") +
      (input.wheelchair && place.wheelchair ? " · wheelchair-accessible entrance" : "") +
      ` · ${place.distanceKm.toFixed(1)} km from ${c.name} centre` +
      (input.group === "Family" ? " · suits families" : ""),
  }));
  const hotel = hotels[0]?.place ?? null;
  if (!hotel) notices.push("No hotels were found in the map data for this destination.");

  const used = new Set<string>(hotels.map((h) => h.place.id));
  const transitBudget = {
    left: input.transport.some((m) => m === "Bus" || m === "Metro") ? 24 : 0,
  };
  const days: PlanDay[] = [];

  function score(p: Place) {
    return (p.rating ?? 3.8) * 10 + Math.log10((p.ratingCount ?? 10) + 1) * 4 - p.distanceKm * 0.6;
  }

  const dayStart = toMin(input.dayStart);
  const dayEnd = toMin(input.dayEnd);

  for (const [di, date] of dates.entries()) {
    const w = weather.find((x) => x.date === date) ?? null;
    const hot = w && (w.label === "Very hot" || w.label === "Hot");
    const rainy = w?.label === "Rainy";
    // assign categories to act slots, rotating so all interests appear each day
    const actSlots = TEMPLATE.filter((t) => t.kind === "act");
    const rot = actCats.map((_, i) => actCats[(i + di) % actCats.length]!);
    const assigned: Category[] = actSlots.map((_, i) => rot[i % rot.length]!);
    if (hot || rainy) {
      // outdoor to morning / sunset, indoor to midday
      const outdoorFirst = assigned
        .slice()
        .sort((a, b) => Number(OUTDOOR.includes(b)) - Number(OUTDOOR.includes(a)));
      const order = [0, 3, 1, 2];
      order.forEach((slotIdx, k) => (assigned[slotIdx] = outdoorFirst[k]!));
    }
    let prev: { lat: number; lon: number } = hotel ?? c;
    const slots: Slot[] = [];
    let ai = 0;
    for (const t of TEMPLATE) {
      if (toMin(t.start) < dayStart || toMin(t.end) > dayEnd) continue;
      const cat: Category = t.kind === "food" ? "Food" : assigned[ai++]!;
      const pool = pools.get(cat) ?? [];
      let candidates = pool
        .filter((p) => !used.has(p.id) && isOpenAt(p, date, t.start, t.end))
        .map((p) => ({
          p,
          s:
            score(p) -
            haversineKm(prev, p) * 1.5 -
            (input.lessWalking && p.outdoor ? 3 : 0) -
            (rainy && p.outdoor ? 6 : 0),
        }))
        .sort((a, b) => b.s - a.s)
        .slice(0, 3);

      // Fallback 1: If no unused place in this exact category, look in other activity pools
      if (!candidates.length && t.kind !== "food") {
        for (const altCat of actCats) {
          if (altCat === cat) continue;
          const altPool = pools.get(altCat) ?? [];
          const altCandidates = altPool
            .filter((p) => !used.has(p.id) && isOpenAt(p, date, t.start, t.end))
            .map((p) => ({
              p,
              s: score(p) - haversineKm(prev, p) * 1.5,
            }))
            .sort((a, b) => b.s - a.s)
            .slice(0, 3);
          if (altCandidates.length) {
            candidates = altCandidates;
            break;
          }
        }
      }

      // Fallback 2: Check any remaining unused places across all non-hotel categories
      if (!candidates.length && t.kind !== "food") {
        const allActivityPlaces = Array.from(pools.entries())
          .filter(([k]) => k !== "Hotels" && k !== "Food")
          .flatMap(([, v]) => v);
        candidates = allActivityPlaces
          .filter((p) => !used.has(p.id))
          .map((p) => ({ p, s: score(p) - haversineKm(prev, p) * 1.5 }))
          .sort((a, b) => b.s - a.s)
          .slice(0, 3);
      }

      // Fallback 3: If all pool places have been used across multi-day trips, allow top-rated places to be visited
      if (!candidates.length && pool.length > 0) {
        candidates = pool
          .slice(0, 3)
          .map((p) => ({ p, s: score(p) - haversineKm(prev, p) * 1.5 }))
          .sort((a, b) => b.s - a.s);
      }

      if (!candidates.length) {
        continue;
      }

      const options: SlotOption[] = candidates.map(({ p }) => {
        const reasons: string[] = [];
        if (cat === "Other") reasons.push(`matches “${input.otherInterest}”`);
        else if (t.kind === "act")
          reasons.push(`covers your ${cat === "Temples" ? "Heritage" : cat} interest`);
        else reasons.push("well-rated food stop close to your route");
        if (p.rating) reasons.push(`rated ${p.rating}`);
        if (input.wheelchair && p.wheelchair) reasons.push("wheelchair-accessible entrance");
        if (input.group === "Family" && t.kind === "food") reasons.push("easy family stop");
        if (p.dayTrip) reasons.push(`day trip, ${p.distanceKm.toFixed(0)} km away`);
        const match = Math.max(
          55,
          Math.min(
            98,
            Math.round(
              60 + (p.rating ?? 3.8) * 6 - haversineKm(prev, p) * 1.2 + (p.wheelchair ? 3 : 0),
            ),
          ),
        );
        return {
          place: p,
          match,
          why: reasons.join(" · "),
          crowd: crowdFor(date, t.start),
          nearby: [],
        };
      });

      // ONLY mark the chosen primary stop as used so subsequent days have plenty of options!
      used.add(options[0]!.place.id);

      prev = options[0]!.place;
      slots.push({
        key: t.key,
        label: t.label,
        start: t.start,
        end: t.end,
        category: cat,
        options,
        chosen: 0,
        weatherFlag:
          (rainy || w?.label === "Very hot") && options[0]!.place.outdoor
            ? `${w!.label}: outdoor stop — consider a backup`
            : null,
      });
    }
    // nearby from leftovers without consuming them from the main candidate pool
    const all = Array.from(pools.values()).flat();
    for (const s of slots) {
      const base = s.options[s.chosen]!.place;
      s.options[s.chosen]!.nearby = all
        .filter((p) => !used.has(p.id) && p.category !== "Hotels")
        .map((p) => ({ place: p, meters: Math.round(haversineKm(base, p) * 1000) }))
        .filter((x) => x.meters <= 2000)
        .sort((a, b) => a.meters - b.meters)
        .slice(0, 3);
    }
    const stops = [hotel, ...slots.map((s) => s.options[s.chosen]!.place), hotel].filter(
      Boolean,
    ) as Place[];
    const { legs, geometry } = await buildLegs(
      stops,
      input.transport,
      input.currency,
      date,
      ["07:40", ...slots.map((s) => s.end)],
      transitBudget,
    );
    if (geometry && legs[0]) legs[0].geometry = geometry;
    days.push({ date, slots, legs, weather: w });
  }

  return {
    destination: input.destination,
    origin: input.origin,
    days,
    hotels,
    hotelChoice: 0,
    weatherError,
    originNow,
    notices,
    currency: input.currency,
    generatedAt: new Date().toISOString(),
  };
}

export async function buildMultiplePlans(input: TripInput): Promise<TripPlan[]> {
  const basePlan = await buildPlan(input);
  basePlan.title = "Option 1: Highlights & Cultural Heritage";
  basePlan.description =
    "A well-balanced itinerary showcasing top-rated landmarks, cultural monuments, and popular viewpoints.";
  basePlan.planStyle = "Heritage & Culture";

  // Variation 2: Scenic Nature & Outdoor Exploration
  const natureInterests = Array.from(
    new Set(["Beach", "Culture", "Amusement", ...input.interests]),
  );
  const naturePlan = await buildPlan({ ...input, interests: natureInterests });
  naturePlan.title = "Option 2: Scenic Nature & Outdoor Exploration";
  naturePlan.description =
    "Emphasizes lush viewpoints, nature lakes, botanical gardens, and fresh outdoor atmosphere.";
  naturePlan.planStyle = "Scenic & Nature";

  // Variation 3: Culinary & Authentic Local Living
  const culinaryInterests = Array.from(
    new Set(["Food", "Shopping", "Culture", ...input.interests]),
  );
  const culinaryPlan = await buildPlan({ ...input, interests: culinaryInterests });
  culinaryPlan.title = "Option 3: Culinary & Authentic Local Living";
  culinaryPlan.description =
    "Focuses on famous regional cafes, local food trails, shopping souks, and cultural crafts.";
  culinaryPlan.planStyle = "Culinary & Lifestyle";

  // Variation 4: Action & High-Pace Sightseeing
  const expressPlan = await buildPlan({
    ...input,
    dayStart: "07:30",
    dayEnd: "22:00",
  });
  expressPlan.title = "Option 4: Action & High-Pace Sightseeing";
  expressPlan.description =
    "Packed schedule maximizing total places visited, photography points, and active exploration.";
  expressPlan.planStyle = "Active Sightseeing";

  return [basePlan, naturePlan, culinaryPlan, expressPlan];
}
