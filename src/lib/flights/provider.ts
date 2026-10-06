import { IgnavFlightProvider } from "./ignav-provider";
import { MockFlightProvider } from "./mock-provider";
import type { FlightProvider } from "./provider-types";

let mockProvider: FlightProvider | null = null;
let ignavProvider: FlightProvider | null = null;

// Single server-side entry point for flight inventory.
//
// FLIGHT_PROVIDER accepts "mock" (default, synthetic inventory) or "ignav"
// (real Ignav API, key required). Adding another provider only requires a
// FlightProvider implementation plus a branch below — the search UI, the
// inquiry flow and the admin screens stay untouched.
export function getFlightProvider(): FlightProvider {
  const configured = (process.env.FLIGHT_PROVIDER ?? "mock").trim().toLowerCase();

  switch (configured) {
    case "mock":
    case "":
      if (!mockProvider) mockProvider = new MockFlightProvider();
      return mockProvider;
    case "ignav":
      if (!ignavProvider) ignavProvider = new IgnavFlightProvider();
      return ignavProvider;
    default:
      // Failing loudly beats silently returning fake inventory for a
      // misconfigured provider — the search route turns this into the
      // "search unavailable" state.
      throw new Error(
        `Unsupported FLIGHT_PROVIDER "${configured}". Implement it in src/lib/flights and register it here.`
      );
  }
}
