import type { GeoPlace, TransportMode } from "./travel-types";

export type BookingType = "Flight" | "Train" | "Bus" | "Taxi" | "Hotel" | "Own vehicle";

export type BookingLink = {
  type: BookingType;
  label: string;
  url: string;
  icon: string;
};

function fmtDate(d: string) {
  return d.replace(/-/g, "");
}

/**
 * Build real external booking links for inter-city travel between origin and destination.
 * All links open genuine booking platforms — no fake confirmations or simulated data.
 */
export function interCityBookingLinks(
  origin: GeoPlace,
  destination: GeoPlace,
  startDate: string,
  endDate: string,
): BookingLink[] {
  const oName = origin.name;
  const dName = destination.name;
  const oCountry = origin.countryCode ?? "IN";
  const links: BookingLink[] = [];

  links.push({
    type: "Flight",
    label: "Search Flights",
    url: `https://www.google.com/travel/flights?q=flights+from+${encodeURIComponent(oName)}+to+${encodeURIComponent(dName)}+on+${startDate}+returning+${endDate}&curr=USD`,
    icon: "plane",
  });

  links.push({
    type: "Train",
    label: "Book Train",
    url:
      oCountry === "IN"
        ? `https://www.irctc.co.in/nget/train-search`
        : "https://www.thetrainline.com/",
    icon: "train",
  });

  links.push({
    type: "Bus",
    label: "Book Bus",
    url:
      oCountry === "IN"
        ? `https://www.redbus.in/bus-tickets/${encodeURIComponent(oName.toLowerCase())}-${encodeURIComponent(dName.toLowerCase())}`
        : "https://www.flixbus.com/",
    icon: "bus",
  });

  links.push({
    type: "Taxi",
    label: "Book Cab",
    url:
      oCountry === "IN"
        ? `https://www.uber.com/go/pickup-set?pickup=${encodeURIComponent(oName)}&dropoff=${encodeURIComponent(dName)}`
        : `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(oName)}&destination=${encodeURIComponent(dName)}&travelmode=driving`,
    icon: "car",
  });

  return links;
}

/**
 * Build real external booking links for intra-city transport between two stops.
 * Maps the chosen transport mode to a genuine service.
 */
export function intraCityBookingLink(
  fromName: string,
  fromLat: number,
  fromLon: number,
  toName: string,
  toLat: number,
  toLon: number,
  mode: TransportMode,
): BookingLink | null {
  switch (mode) {
    case "Taxi":
      return {
        type: "Taxi",
        label: "Book Cab",
        url: `https://www.uber.com/go/pickup-set?pickup=${encodeURIComponent(fromName)}&dropoff=${encodeURIComponent(toName)}`,
        icon: "car",
      };

    case "Auto":
      return {
        type: "Taxi",
        label: "Book Auto",
        url: `https://www.uber.com/go/pickup-set?pickup=${encodeURIComponent(fromName)}&dropoff=${encodeURIComponent(toName)}`,
        icon: "car",
      };

    case "Bus":
    case "Metro":
      return {
        type: "Bus",
        label: "Transit Directions",
        url: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(fromName)}&destination=${encodeURIComponent(toName)}&travelmode=transit`,
        icon: "bus",
      };

    case "Walk":
      return {
        type: "Bus",
        label: "Walking Directions",
        url: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(fromName)}&destination=${encodeURIComponent(toName)}&travelmode=walking`,
        icon: "walk",
      };

    case "Own vehicle":
      return {
        type: "Own vehicle",
        label: "Driving Directions",
        url: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(fromName)}&destination=${encodeURIComponent(toName)}&travelmode=driving`,
        icon: "car",
      };

    default:
      return null;
  }
}

/**
 * Build a hotel booking link using genuine platforms.
 */
export function hotelBookingLink(hotelName: string, destinationName: string, checkIn: string, checkOut: string): BookingLink {
  return {
    type: "Hotel",
    label: "Book Hotel",
    url: `https://www.google.com/travel/hotels?q=${encodeURIComponent(hotelName + " " + destinationName)}&checkin=${fmtDate(checkIn)}&checkout=${fmtDate(checkOut)}`,
    icon: "hotel",
  };
}
