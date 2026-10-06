import { CABIN_CLASSES, type CabinClass, type FlightSearchInput } from "@/types";
import { addDaysIso, isDateString, todayIsoDate } from "./flight-math";

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

const MAX_DAYS_AHEAD = 330;
const MAX_PASSENGERS = 9;
const MIN_PASSENGERS = 1;
const AIRPORT_REFERENCE_PATTERN = /^[A-Za-z0-9 .'\-]{1,60}$/;
const MAX_AIRPORT_QUERY_LENGTH = 60;

function cleanReference(raw: string | null): string | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_AIRPORT_QUERY_LENGTH) return null;
  if (!AIRPORT_REFERENCE_PATTERN.test(trimmed)) return null;
  return trimmed;
}

function invalidDate(field: string): string {
  return `Please provide a valid ${field} in YYYY-MM-DD format.`;
}

// Every search parameter is validated here before a provider is invoked.
export function parseFlightSearchParams(
  searchParams: URLSearchParams
): ParseResult<FlightSearchInput> {
  const origin = cleanReference(searchParams.get("origin"));
  const destination = cleanReference(searchParams.get("destination"));
  if (!origin || !destination) {
    return { ok: false, error: "Both origin and destination are required." };
  }
  if (origin.toLowerCase() === destination.toLowerCase()) {
    return { ok: false, error: "Origin and destination must be different." };
  }

  const departureDate = (searchParams.get("departureDate") ?? "").trim();
  if (!isDateString(departureDate)) return { ok: false, error: invalidDate("departure date") };

  const today = todayIsoDate();
  if (departureDate < today) {
    return { ok: false, error: "Departure date cannot be in the past." };
  }
  if (departureDate > addDaysIso(today, MAX_DAYS_AHEAD)) {
    return { ok: false, error: `Departure date must be within the next ${MAX_DAYS_AHEAD} days.` };
  }

  const rawTripType = (searchParams.get("tripType") ?? "").trim().toLowerCase();
  const rawReturnDate = (searchParams.get("returnDate") ?? "").trim();

  let tripType: FlightSearchInput["tripType"];
  if (rawTripType === "oneway" || rawTripType === "roundtrip") {
    tripType = rawTripType;
  } else {
    tripType = rawReturnDate ? "roundtrip" : "oneway";
  }

  let returnDate: string | null = null;
  if (tripType === "roundtrip") {
    if (!rawReturnDate) {
      return { ok: false, error: "Return date is required for a round trip." };
    }
    if (!isDateString(rawReturnDate)) return { ok: false, error: invalidDate("return date") };
    if (rawReturnDate < departureDate) {
      return { ok: false, error: "Return date cannot be before the departure date." };
    }
    if (rawReturnDate > addDaysIso(today, MAX_DAYS_AHEAD)) {
      return { ok: false, error: `Return date must be within the next ${MAX_DAYS_AHEAD} days.` };
    }
    returnDate = rawReturnDate;
  }

  const rawPassengers = (searchParams.get("passengers") ?? "").trim();
  let passengers = MIN_PASSENGERS;
  if (rawPassengers) {
    const parsed = Number(rawPassengers);
    if (!Number.isInteger(parsed) || parsed < MIN_PASSENGERS || parsed > MAX_PASSENGERS) {
      return {
        ok: false,
        error: `Passengers must be a whole number between ${MIN_PASSENGERS} and ${MAX_PASSENGERS}.`,
      };
    }
    passengers = parsed;
  }

  const rawCabin = (searchParams.get("cabin") ?? "").trim();
  const cabin = (CABIN_CLASSES as string[]).find(
    (option) => option.toLowerCase() === rawCabin.toLowerCase()
  ) as CabinClass | undefined;
  if (rawCabin && !cabin) {
    return { ok: false, error: "Please choose a valid cabin class." };
  }

  return {
    ok: true,
    value: {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers,
      cabin: cabin ?? "Economy",
      tripType,
    },
  };
}

export function parseAirportSearchParams(
  searchParams: URLSearchParams
): ParseResult<{ query: string; limit: number }> {
  const query = (searchParams.get("q") ?? "").trim().slice(0, MAX_AIRPORT_QUERY_LENGTH);

  const rawLimit = (searchParams.get("limit") ?? "").trim();
  let limit = 12;
  if (rawLimit) {
    const parsed = Number(rawLimit);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 25) {
      return { ok: false, error: "Limit must be a whole number between 1 and 25." };
    }
    limit = parsed;
  }

  return { ok: true, value: { query, limit } };
}
