import { MockFlightProvider } from "./mock-provider";
import type { FlightProvider } from "./provider-types";

let mockProvider: FlightProvider | null = null;

// Single server-side entry point for flight inventory.
//
// Adding a real provider later only requires:
//   1. a new class implementing FlightProvider (server-only, holds the API key)
//   2. a new branch below keyed by the FLIGHT_PROVIDER env var
// The search UI, the inquiry flow and the admin screens stay untouched.
export function getFlightProvider(): FlightProvider {
  const configured = (process.env.FLIGHT_PROVIDER ?? "mock").trim().toLowerCase();

  switch (configured) {
    case "mock":
    case "":
      if (!mockProvider) mockProvider = new MockFlightProvider();
      return mockProvider;
    default:
      // Failing loudly beats silently returning fake inventory for a
      // misconfigured provider — the search route turns this into the
      // "search unavailable" state.
      throw new Error(
        `Unsupported FLIGHT_PROVIDER "${configured}". Implement it in src/lib/flights and register it here.`
      );
  }
}
