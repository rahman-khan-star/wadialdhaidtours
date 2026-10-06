import type { FlightLeg, FlightOffer, FlightSearchResult } from "@/types";
import type { ProviderFlightOffer } from "./provider-types";

// Keys that must never appear in a customer-facing flight payload.
// Provider responses may legitimately carry these internally — the serializer
// below only copies an explicit allowlist of schedule/availability fields.
const PRICING_KEY_PATTERN = /price|fare|amount|cost|currency|quote/i;

function collectPricingKeys(value: unknown, path: string, found: string[]): void {
  if (found.length > 20) return;

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectPricingKeys(item, `${path}[${index}]`, found));
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      const nextPath = path ? `${path}.${key}` : key;
      if (PRICING_KEY_PATTERN.test(key)) found.push(nextPath);
      collectPricingKeys(entry, nextPath, found);
    }
  }
}

// Defensive guard: throws if any price-like key survives into a response body.
export function assertNoProviderPricing(payload: unknown): void {
  const found: string[] = [];
  collectPricingKeys(payload, "", found);
  if (found.length > 0) {
    throw new Error(`Provider pricing leaked into response: ${found.join(", ")}`);
  }
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

export function toPublicSearchResult(
  offer: ProviderFlightOffer,
  requestToken: string
): FlightSearchResult {
  return { ...toPublicFlightOffer(offer), requestToken };
}
