import type { AirportOption, FlightOffer, FlightSearchInput } from "@/types";

// Internal provider contract.
//
// Everything returned by a provider is server-side only. Providers MAY carry
// internal pricing (required by some real APIs for their own accounting), but
// that data must never reach a customer-facing response — `serialize.ts`
// maps provider results onto the public `FlightOffer` shape using an explicit
// allowlist, and the search route re-checks the final payload for price-like
// keys before responding.

export interface ProviderFlightOffer extends FlightOffer {
  // Server-only. Stripped by the serializer; never serialized to clients.
  internalFare?: {
    amount: number;
    currency: string;
  };
}

export interface FlightProvider {
  /** Stable identifier, e.g. "mock". Never sent to customers. */
  readonly name: string;

  /** Global airport/city lookup used by the search form's autocomplete. */
  searchAirports(query: string, limit?: number): Promise<AirportOption[]>;

  /** Returns matching itineraries for an already-validated search. */
  searchFlights(query: FlightSearchInput): Promise<ProviderFlightOffer[]>;
}
