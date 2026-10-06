import type {
  AirportOption,
  CabinClass,
  FlightLeg,
  FlightPlace,
  FlightSearchInput,
} from "@/types";
import {
  getAllAirports,
  getAirportByIata,
  resolveAirportReference,
  searchAirportRecords,
  toAirportOption,
  toFlightPlace,
} from "./airports";
import {
  distanceKm,
  formatLocalTime,
  hashString,
  localWallClockEpoch,
} from "./flight-math";
import type { FlightProvider, ProviderFlightOffer } from "./provider-types";

interface Airline {
  code: string;
  name: string;
}

const AIRLINES: Airline[] = [
  { code: "EK", name: "Emirates" },
  { code: "FZ", name: "flydubai" },
  { code: "PK", name: "Pakistan International Airlines" },
  { code: "QR", name: "Qatar Airways" },
  { code: "EY", name: "Etihad Airways" },
  { code: "SV", name: "Saudia" },
  { code: "GF", name: "Gulf Air" },
  { code: "WY", name: "Oman Air" },
  { code: "G9", name: "Air Arabia" },
  { code: "TK", name: "Turkish Airlines" },
  { code: "KU", name: "Kuwait Airways" },
  { code: "RJ", name: "Royal Jordanian" },
  { code: "MS", name: "EgyptAir" },
  { code: "XY", name: "flynas" },
  { code: "BA", name: "British Airways" },
  { code: "LH", name: "Lufthansa" },
  { code: "KL", name: "KLM" },
  { code: "AF", name: "Air France" },
  { code: "SQ", name: "Singapore Airlines" },
  { code: "CX", name: "Cathay Pacific" },
  { code: "AI", name: "Air India" },
  { code: "6E", name: "IndiGo" },
];

const DEPARTURE_SLOTS = ["06:15", "08:40", "11:05", "13:30", "16:20", "19:45", "22:10"];

const STOP_HUBS = ["DXB", "DOH", "IST", "AUH", "RUH", "KHI", "DEL", "SIN", "LHR", "AMS", "FRA"];

const CABIN_MULTIPLIER: Record<CabinClass, number> = {
  Economy: 1,
  "Premium Economy": 1.75,
  Business: 3.4,
  First: 6.2,
};

function roundToFive(value: number): number {
  return Math.round(value / 5) * 5;
}

function pickStops(seed: number, kilometres: number): number {
  if (kilometres < 2500) return 0;
  if (kilometres < 6000) return seed % 4 === 0 ? 1 : 0;
  if (seed % 11 === 0) return 2;
  return seed % 5 === 0 ? 0 : 1;
}

function pickStopHubs(seed: number, stops: number, origin: string, destination: string): string[] {
  if (stops === 0) return [];
  const blocked = new Set([origin, destination]);
  const available = STOP_HUBS.filter((hub) => !blocked.has(hub));
  const hubs: string[] = [];
  for (let i = 0; i < stops && i < available.length; i += 1) {
    hubs.push(available[(seed + i * 3) % available.length]);
  }
  return Array.from(new Set(hubs));
}

function buildLeg(
  origin: FlightPlace,
  destination: FlightPlace,
  originLat: number,
  originLon: number,
  destinationLat: number,
  destinationLon: number,
  originTz: number,
  destinationTz: number,
  date: string,
  cabin: CabinClass,
  seedKey: string
): FlightLeg {
  const seed = hashString(`${origin.iata}|${destination.iata}|${date}|${cabin}|${seedKey}`);
  const airline = AIRLINES[seed % AIRLINES.length];
  const slot = DEPARTURE_SLOTS[(seed >>> 3) % DEPARTURE_SLOTS.length];
  const kilometres = distanceKm(
    { lat: originLat, lon: originLon },
    { lat: destinationLat, lon: destinationLon }
  );
  const stops = pickStops(seed, kilometres);
  const baseMinutes = Math.max(60, (kilometres / 800) * 60 + 40);
  const durationMinutes = roundToFive(baseMinutes + stops * 95);

  const departureEpoch = localWallClockEpoch(date, slot, originTz);
  const arrivalEpoch = departureEpoch + durationMinutes * 60_000;

  return {
    airline: airline.name,
    airlineCode: airline.code,
    flightNumber: `${airline.code}${((seed >>> 5) % 800) + 100}`,
    origin,
    destination,
    departureTime: formatLocalTime(departureEpoch, originTz),
    arrivalTime: formatLocalTime(arrivalEpoch, destinationTz),
    durationMinutes,
    stops,
    stopAirports: pickStopHubs(seed, stops, origin.iata, destination.iata),
  };
}

function internalFare(seed: number, kilometres: number, cabin: CabinClass): {
  amount: number;
  currency: string;
} {
  // Internal only — required to prove provider pricing is stripped before the
  // response reaches the browser. Never referenced by any UI code.
  const variance = 0.9 + (seed % 200) / 1000;
  const amount = (45 + kilometres * 0.042) * CABIN_MULTIPLIER[cabin] * variance;
  return { amount: Math.round(amount * 100) / 100, currency: "USD" };
}

/**
 * Deterministic, price-free-to-customers mock inventory.
 *
 * Different origin / destination / date / cabin / passenger counts produce
 * different schedules. Some route-days intentionally return zero results so
 * the "No flights found" state can be exercised.
 */
export class MockFlightProvider implements FlightProvider {
  readonly name = "mock";

  async searchAirports(query: string, limit = 12): Promise<AirportOption[]> {
    const normalizedLimit = Math.min(Math.max(limit, 1), 25);
    const records = query.trim()
      ? searchAirportRecords(query, normalizedLimit)
      : getAllAirports().slice(0, normalizedLimit);
    return records.map(toAirportOption);
  }

  async searchFlights(query: FlightSearchInput): Promise<ProviderFlightOffer[]> {
    const origin = resolveAirportReference(query.origin);
    const destination = resolveAirportReference(query.destination);

    // Unknown route or a same-city search has no inventory.
    if (!origin || !destination || origin.iata === destination.iata) return [];

    const routeSeed = hashString(
      `${origin.iata}|${destination.iata}|${query.departureDate}|${query.cabin}`
    );

    // Some route-days genuinely have no provider inventory.
    if (routeSeed % 9 === 0) return [];

    const optionCount = 2 + (routeSeed % 5);
    const offers: ProviderFlightOffer[] = [];

    for (let index = 0; index < optionCount; index += 1) {
      const outbound = buildLeg(
        toFlightPlace(origin),
        toFlightPlace(destination),
        origin.lat,
        origin.lon,
        destination.lat,
        destination.lon,
        origin.tz,
        destination.tz,
        query.departureDate,
        query.cabin,
        `out${index}`
      );

      let inbound: FlightLeg | null = null;
      if (query.tripType === "roundtrip" && query.returnDate) {
        inbound = buildLeg(
          toFlightPlace(destination),
          toFlightPlace(origin),
          destination.lat,
          destination.lon,
          origin.lat,
          origin.lon,
          destination.tz,
          origin.tz,
          query.returnDate,
          query.cabin,
          `ret${index}`
        );
      }

      const seatSeed = hashString(`${outbound.flightNumber}|${query.departureDate}|seats`);
      const seatsRemaining = 1 + (seatSeed % 10);
      // Hide options that cannot seat the whole party.
      if (seatsRemaining < query.passengers) continue;

      const limited = seatsRemaining <= Math.max(3, query.passengers);
      const fareSeed = hashString(`${outbound.flightNumber}|${query.departureDate}|fare`);
      const kilometres = distanceKm(
        { lat: origin.lat, lon: origin.lon },
        { lat: destination.lat, lon: destination.lon }
      );

      offers.push({
        id: `${origin.iata}-${destination.iata}-${query.departureDate}-${outbound.flightNumber}-${index}`,
        tripType: inbound ? "roundtrip" : "oneway",
        cabin: query.cabin,
        availability: limited ? "Limited" : "Available",
        seatsRemaining,
        outbound,
        inbound,
        internalFare: internalFare(fareSeed, kilometres, query.cabin),
      });
    }

    return offers;
  }
}

export function getMockAirportCount(): number {
  return getAllAirports().length;
}

export function getMockAirport(iata: string) {
  const record = getAirportByIata(iata);
  return record ? toAirportOption(record) : null;
}
