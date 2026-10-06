import crypto from "node:crypto";
import type {
  CabinClass,
  FlightOffer,
  FlightPlace,
  FlightTripType,
} from "@/types";

const TOKEN_TTL_MS = 30 * 60 * 1000;

const DEV_FALLBACK_SECRET = "wadi-al-dhaid-tours-flight-search-dev-only-secret";

export interface FlightRequestTokenPayload {
  v: 1;
  origin: FlightPlace;
  destination: FlightPlace;
  departureDate: string;
  returnDate: string | null;
  passengers: number;
  cabin: CabinClass;
  tripType: FlightTripType;
  flightId: string;
  airline: string;
  flightNumber: string;
  seatsRemaining: number;
  exp: number;
}

// Server-side secret only. Never referenced from client components, so the
// value can never appear in the browser bundle.
function getSecret(): string {
  const explicit = process.env.FLIGHT_SEARCH_SECRET;
  if (explicit && explicit.length >= 32) return explicit;

  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length >= 32) return jwtSecret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("FLIGHT_SEARCH_SECRET or JWT_SECRET must be set (32+ chars) in production");
  }

  return DEV_FALLBACK_SECRET;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function encode(payload: FlightRequestTokenPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decode(value: string): FlightRequestTokenPayload | null {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as FlightRequestTokenPayload;
  } catch {
    return null;
  }
}

function isValidPayload(value: FlightRequestTokenPayload | null): value is FlightRequestTokenPayload {
  if (!value || value.v !== 1) return false;
  if (typeof value.exp !== "number" || value.exp <= Date.now()) return false;
  if (!value.origin?.iata || !value.destination?.iata) return false;
  if (typeof value.departureDate !== "string") return false;
  if (typeof value.passengers !== "number") return false;
  if (typeof value.airline !== "string" || typeof value.flightNumber !== "string") return false;
  return true;
}

// The browser presents this token when submitting an inquiry. Because it is
// signed server-side, flight details are never taken from client-supplied
// fields — they are read back out of the trusted payload.
export function signFlightRequestToken(
  flight: FlightOffer,
  context: {
    origin: FlightPlace;
    destination: FlightPlace;
    departureDate: string;
    returnDate: string | null;
    passengers: number;
    cabin: CabinClass;
    tripType: FlightTripType;
  }
): string {
  const payload: FlightRequestTokenPayload = {
    v: 1,
    origin: context.origin,
    destination: context.destination,
    departureDate: context.departureDate,
    returnDate: context.returnDate,
    passengers: context.passengers,
    cabin: context.cabin,
    tripType: context.tripType,
    flightId: flight.id,
    airline: flight.outbound.airline,
    flightNumber: flight.outbound.flightNumber,
    seatsRemaining: flight.seatsRemaining,
    exp: Date.now() + TOKEN_TTL_MS,
  };

  const encoded = encode(payload);
  return `${encoded}.${sign(encoded)}`;
}

export function verifyFlightRequestToken(token: string): FlightRequestTokenPayload | null {
  if (typeof token !== "string" || token.length === 0 || token.length > 4096) return null;

  const separator = token.indexOf(".");
  if (separator <= 0 || separator === token.length - 1) return null;

  const encoded = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = sign(encoded);

  const provided = Buffer.from(signature, "utf8");
  const wanted = Buffer.from(expected, "utf8");
  if (provided.length !== wanted.length) return null;
  if (!crypto.timingSafeEqual(provided, wanted)) return null;

  const payload = decode(encoded);
  return isValidPayload(payload) ? payload : null;
}
