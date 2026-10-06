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
} from "./airports";
import type { FlightProvider, ProviderFlightOffer } from "./provider-types";

// Ignav integration, built from the official documentation at https://ignav.com/docs:
//   POST /api/fares/one-way     { origin, destination, departure_date, adults, cabin_class }
//   POST /api/fares/round-trip  same body + return_date
//   Header  X-Api-Key: <key>    (every authenticated request)
//   Errors  { error: { type, code, message, field? } } with 400/401/402/403/404/424/429/503
//   Empty   itineraries: [] is a normal, non-error response.
//
// The API key is read server-side only and Ignav's `price` object is copied
// into the server-only `internalFare` slot, which the serializer strips — the
// browser never receives it.

const IGNAV_BASE_URL = "https://ignav.com";
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_LIMIT = 25;

const CABIN_TO_IGNAV: Record<CabinClass, string> = {
  Economy: "economy",
  "Premium Economy": "premium_economy",
  Business: "business",
  First: "first",
};

const IGNAV_TO_CABIN: Record<string, CabinClass> = {
  economy: "Economy",
  premium_economy: "Premium Economy",
  business: "Business",
  first: "First",
};

export function toIgnavCabin(cabin: CabinClass): string {
  return CABIN_TO_IGNAV[cabin] ?? "economy";
}

// IGNAV_API_KEY is the only credential this provider ever reads.
// FLIGHT_SEARCH_SECRET is reserved for search-token HMAC signing and is
// deliberately never accepted as an API key, so the two stay separate.
// Server-side only — never referenced by client code.
export function resolveIgnavApiKey(): string | null {
  return process.env.IGNAV_API_KEY?.trim() || null;
}

function getApiKey(): string {
  const key = resolveIgnavApiKey();
  if (!key) {
    throw new Error("Missing Ignav API key. Set IGNAV_API_KEY on the server.");
  }
  return key;
}

interface IgnavSegment {
  marketing_carrier_code?: string | null;
  flight_number?: string | null;
  operating_carrier_name?: string | null;
  departure_airport?: string | null;
  departure_time_local?: string | null;
  departure_time_utc?: string | null;
  arrival_airport?: string | null;
  arrival_time_local?: string | null;
  arrival_time_utc?: string | null;
  duration_minutes?: number | null;
}

interface IgnavLeg {
  carrier?: string | null;
  duration_minutes?: number | null;
  segments?: IgnavSegment[] | null;
}

interface IgnavItinerary {
  ignav_id?: string | null;
  cabin_class?: string | null;
  outbound?: IgnavLeg | null;
  inbound?: IgnavLeg | null;
  price?: { amount?: number | null; currency?: string | null } | null;
}

interface IgnavFareResponse {
  itineraries?: IgnavItinerary[] | null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// Ignav returns airport-local wall times; our public leg contract wants
// "YYYY-MM-DDTHH:mm". Anything unparseable makes the itinerary unusable.
function toWallClock(value: unknown): string | null {
  const raw = asString(value);
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/.exec(raw);
  return match ? match[1] : null;
}

function placeFor(iata: string): FlightPlace {
  const record = getAirportByIata(iata);
  if (record) {
    return {
      iata: record.iata,
      name: record.name,
      city: record.city,
      country: record.country,
    };
  }
  return { iata, name: iata, city: iata, country: "" };
}

function utcDurationMinutes(first: IgnavSegment, last: IgnavSegment): number | null {
  const start = Date.parse(asString(first.departure_time_utc));
  const end = Date.parse(asString(last.arrival_time_utc));
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  const minutes = Math.round((end - start) / 60_000);
  return minutes > 0 ? minutes : null;
}

function mapLeg(leg: IgnavLeg | null | undefined): FlightLeg | null {
  const rawSegments = Array.isArray(leg?.segments) ? leg.segments : [];
  const segments = rawSegments.filter((segment): segment is IgnavSegment => asRecord(segment) !== null);
  if (segments.length === 0) return null;

  const first = segments[0];
  const last = segments[segments.length - 1];

  const originIata = asString(first.departure_airport).toUpperCase();
  const destinationIata = asString(last.arrival_airport).toUpperCase();
  const departureTime = toWallClock(first.departure_time_local);
  const arrivalTime = toWallClock(last.arrival_time_local);
  if (!originIata || !destinationIata || !departureTime || !arrivalTime) return null;

  const declared =
    typeof leg?.duration_minutes === "number" &&
    Number.isFinite(leg.duration_minutes) &&
    leg.duration_minutes > 0
      ? Math.round(leg.duration_minutes)
      : null;
  const summed = segments.reduce((total, segment) => {
    const minutes =
      typeof segment.duration_minutes === "number" &&
      Number.isFinite(segment.duration_minutes) &&
      segment.duration_minutes > 0
        ? Math.round(segment.duration_minutes)
        : 0;
    return total + minutes;
  }, 0);
  const durationMinutes =
    declared ?? (summed > 0 ? summed : null) ?? utcDurationMinutes(first, last);
  if (!durationMinutes) return null;

  const stopAirports: string[] = [];
  for (const segment of segments.slice(1)) {
    const hub = asString(segment.departure_airport).toUpperCase();
    if (hub && !stopAirports.includes(hub)) stopAirports.push(hub);
  }

  const flightNumbers = segments
    .map((segment) => {
      const code = asString(segment.marketing_carrier_code).toUpperCase();
      const number = asString(segment.flight_number);
      if (!number) return code;
      return code ? `${code}${number}` : number;
    })
    .filter(Boolean);

  const airline =
    asString(leg?.carrier) ||
    asString(first.operating_carrier_name) ||
    asString(first.marketing_carrier_code);

  return {
    airline,
    airlineCode: asString(first.marketing_carrier_code).toUpperCase(),
    flightNumber: flightNumbers.join(" · ") || "-",
    origin: placeFor(originIata),
    destination: placeFor(destinationIata),
    departureTime,
    arrivalTime,
    durationMinutes,
    stops: Math.max(0, segments.length - 1),
    stopAirports,
  };
}

function mapCabin(value: unknown, fallback: CabinClass): CabinClass {
  const normalized = asString(value).toLowerCase();
  return IGNAV_TO_CABIN[normalized] ?? fallback;
}

// Pure mapping: Ignav itineraries -> internal offers. Exported so the
// verification script can prove the response contract without spending a
// single request from the API allowance.
export function mapIgnavItineraries(
  itineraries: unknown,
  query: FlightSearchInput,
  roundTrip: boolean
): ProviderFlightOffer[] {
  if (!Array.isArray(itineraries)) return [];

  const offers: ProviderFlightOffer[] = [];
  const usedIds = new Set<string>();

  itineraries.forEach((candidate, index) => {
    const itinerary = asRecord(candidate) as IgnavItinerary | null;
    if (!itinerary) return;

    const outbound = mapLeg(itinerary.outbound);
    if (!outbound) return;

    let inbound: FlightLeg | null = null;
    if (roundTrip) {
      inbound = mapLeg(itinerary.inbound);
      // A round trip without a usable return leg is not shown.
      if (!inbound) return;
    }

    const price = asRecord(itinerary.price);
    const amount = typeof price?.amount === "number" && Number.isFinite(price.amount)
      ? price.amount
      : null;
    const currency = asString(price?.currency);

    const baseId =
      asString(itinerary.ignav_id) ||
      `ignav-${outbound.origin.iata}-${outbound.destination.iata}-${outbound.departureTime}-${index}`;
    let id = baseId;
    let suffix = index;
    while (usedIds.has(id)) {
      id = `${baseId}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);

    offers.push({
      id,
      tripType: roundTrip ? "roundtrip" : "oneway",
      cabin: mapCabin(itinerary.cabin_class, query.cabin),
      // Ignav exposes no seat inventory, so every itinerary it returns is
      // offered for the requested party size: report exactly that, never a
      // fabricated scarcity badge.
      availability: "Available",
      seatsRemaining: query.passengers,
      outbound,
      inbound,
      internalFare: amount !== null && currency ? { amount, currency } : undefined,
    });
  });

  return offers;
}

async function readIgnavError(response: Response): Promise<string> {
  const status = `HTTP ${response.status}`;
  try {
    const body: unknown = await response.json();
    const error = asRecord(asRecord(body)?.error);
    if (error) {
      const code = asString(error.code);
      const message = asString(error.message);
      if (code || message) return `${status} ${code}${message ? `: ${message}` : ""}`.trim();
    }
  } catch {
    // Non-JSON error body; the status alone is enough for the server log.
  }
  return status;
}

/**
 * Real Ignav inventory.
 *
 * Every search performs at most one API request (one-way) or one round-trip
 * request, with a hard timeout and no retries or background polling, so the
 * free request allowance is never drained by a browser session.
 */
export class IgnavFlightProvider implements FlightProvider {
  readonly name = "ignav";

  // Autocomplete stays on the bundled dataset: it fires on every keystroke and
  // Ignav charges for each /api/airports call. Fare searches validate the
  // resulting IATA codes server-side against Ignav itself.
  async searchAirports(query: string, limit = 12): Promise<AirportOption[]> {
    const normalizedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
    const records = query.trim()
      ? searchAirportRecords(query, normalizedLimit)
      : getAllAirports().slice(0, normalizedLimit);
    return records.map(toAirportOption);
  }

  async searchFlights(query: FlightSearchInput): Promise<ProviderFlightOffer[]> {
    const origin = resolveAirportReference(query.origin);
    const destination = resolveAirportReference(query.destination);
    if (!origin || !destination || origin.iata === destination.iata) return [];

    const roundTrip = query.tripType === "roundtrip" && Boolean(query.returnDate);

    const body: Record<string, unknown> = {
      origin: origin.iata,
      destination: destination.iata,
      departure_date: query.departureDate,
      adults: query.passengers,
      cabin_class: toIgnavCabin(query.cabin),
    };
    if (roundTrip && query.returnDate) body.return_date = query.returnDate;

    const endpoint = roundTrip ? "/api/fares/round-trip" : "/api/fares/one-way";
    const response = await fetch(`${IGNAV_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": getApiKey(),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Ignav fare search failed: ${await readIgnavError(response)}`);
    }

    let payload: IgnavFareResponse;
    try {
      payload = (await response.json()) as IgnavFareResponse;
    } catch {
      throw new Error("Ignav fare search returned a non-JSON body.");
    }

    if (!Array.isArray(payload?.itineraries)) {
      throw new Error("Ignav fare search response is missing an itineraries array.");
    }

    return mapIgnavItineraries(payload.itineraries, query, roundTrip);
  }
}
