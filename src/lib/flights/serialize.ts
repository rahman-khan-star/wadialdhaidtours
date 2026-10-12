import type { FlightFinalPrice, FlightLeg, FlightOffer, FlightSearchResult } from "@/types";
import type { ProviderFlightOffer } from "./provider-types";

// Keys that must never appear in a customer-facing flight payload — with one
// deliberate exception: the sanitized `finalPrice` allowlisted below, which
// carries only the computed selling amount in AED and PKR. Provider responses
// may legitimately carry internal fares, markups and rates; the serializer
// only copies an explicit allowlist of schedule/availability fields.
const PRICING_KEY_PATTERN = /price|fare|amount|cost|currency|quote|markup|pkr|aed/i;

// The ONLY price-like paths a public response may contain.
const FINAL_PRICE_ROOT = /^flights\[\d+\]\.finalPrice$/;
const FINAL_PRICE_FIELD = /^flights\[\d+\]\.finalPrice\.(aed|pkr)$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

// The final selling price must be exactly `{ aed, pkr }` with two positive
// numbers — a provider fare object, a markup figure, extra fields or a
// malformed value all count as leakage.
function isValidFinalPrice(value: unknown): boolean {
  if (value === null) return true;
  if (!isPlainObject(value)) return false;
  const keys = Object.keys(value);
  if (keys.length !== 2 || !("aed" in value) || !("pkr" in value)) return false;
  return isPositiveAmount(value.aed) && isPositiveAmount(value.pkr);
}

function collectPricingKeys(value: unknown, path: string, found: string[]): void {
  if (found.length > 20) return;

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectPricingKeys(item, `${path}[${index}]`, found));
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      const nextPath = path ? `${path}.${key}` : key;
      if (PRICING_KEY_PATTERN.test(key)) {
        const allowed =
          (FINAL_PRICE_ROOT.test(nextPath) && isValidFinalPrice(entry)) ||
          (FINAL_PRICE_FIELD.test(nextPath) && isPositiveAmount(entry));
        if (!allowed) found.push(nextPath);
      }
      collectPricingKeys(entry, nextPath, found);
    }
  }
}

// Defensive guard: throws if any price-like key other than the designed,
// sanitized final selling price survives into a response body.
export function assertNoProviderPricing(payload: unknown): void {
  const found: string[] = [];
  collectPricingKeys(payload, "", found);
  if (found.length > 0) {
    throw new Error(`Provider pricing leaked into response: ${found.join(", ")}`);
  }
}

// Last gate before serialization: only the two designed amounts survive, as
// positive finite numbers rounded for display. Anything else becomes the
// unavailable-price state instead of failing the whole search.
function sanitizeFinalPrice(value: FlightFinalPrice | null | undefined): FlightFinalPrice | null {
  if (!value || typeof value !== "object") return null;
  const aed = value.aed;
  const pkr = value.pkr;
  if (!isPositiveAmount(aed) || !isPositiveAmount(pkr)) return null;
  return { aed: Math.round(aed * 100) / 100, pkr: Math.round(pkr) };
}

function toPublicLeg(leg: FlightLeg): FlightLeg {
  return {
    airline: leg.airline,
    airlineCode: leg.airlineCode,
    flightNumber: leg.flightNumber,
    origin: {
      iata: leg.origin.iata,
      name: leg.origin.name,
      city: leg.origin.city,
      country: leg.origin.country,
    },
    destination: {
      iata: leg.destination.iata,
      name: leg.destination.name,
      city: leg.destination.city,
      country: leg.destination.country,
    },
    departureTime: leg.departureTime,
    arrivalTime: leg.arrivalTime,
    durationMinutes: leg.durationMinutes,
    stops: leg.stops,
    stopAirports: [...leg.stopAirports],
  };
}

// Explicit allowlist mapping: anything a provider adds (including internal
// fares) is dropped here and can never reach the browser.
export function toPublicFlightOffer(offer: ProviderFlightOffer): FlightOffer {
  return {
    id: offer.id,
    tripType: offer.tripType,
    cabin: offer.cabin,
    availability: offer.availability,
    seatsRemaining: offer.seatsRemaining,
    outbound: toPublicLeg(offer.outbound),
    inbound: offer.inbound ? toPublicLeg(offer.inbound) : null,
  };
}

// Public search result: schedule + availability, the server-signed request
// token, and the final selling price. The provider fare, the markup amount
// and every pricing setting stay on the server.
export function toPublicSearchResult(
  offer: ProviderFlightOffer,
  requestToken: string,
  finalPrice: FlightFinalPrice | null
): FlightSearchResult {
  return {
    ...toPublicFlightOffer(offer),
    requestToken,
    finalPrice: sanitizeFinalPrice(finalPrice),
  };
}
