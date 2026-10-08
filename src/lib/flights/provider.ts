import { IgnavFlightProvider, resolveIgnavApiKey } from "./ignav-provider";
import { MockFlightProvider } from "./mock-provider";
import type { FlightProvider } from "./provider-types";

let mockProvider: FlightProvider | null = null;
let ignavProvider: FlightProvider | null = null;
let lastLoggedProvider: string | null = null;

// Single server-side entry point for flight inventory.
//
// FLIGHT_PROVIDER accepts:
//   "mock"                      synthetic inventory (local/dev default)
//   "ignav" | "real" | "live"   real Ignav API (IGNAV_API_KEY required)
// When FLIGHT_PROVIDER is unset or empty, a configured IGNAV_API_KEY selects
// the real provider — a credential added without the switch must never
// degrade into fake inventory. Adding another provider only requires a
// FlightProvider implementation plus a branch below — the search UI, the
// inquiry flow and the admin screens stay untouched.
//
// There is deliberately no try/catch around the real provider: if it cannot
// initialise (missing key) or its API fails, the search route answers with
// the "search unavailable" state instead of substituting mock results.

const REAL_VALUES = new Set(["ignav", "real", "live", "production", "prod"]);
const MOCK_VALUES = new Set(["mock", "test", "fake", "off", "disabled", "false", "none"]);

// Diagnostics vocabulary. Anything that is not a recognised token is reported
// as "<unrecognized>" so a pasted secret can never be echoed by a log line.
const UNSET = "<unset>";
const UNRECOGNIZED = "<unrecognized>";

export type FlightProviderName = "mock" | "ignav" | "unknown";

export interface FlightProviderDiagnostics {
  /** Provider getFlightProvider() resolves to right now ("unknown" = bad config). */
  provider: FlightProviderName;
  /** Normalised FLIGHT_PROVIDER token, "<unset>" or "<unrecognized>". Never a credential. */
  configuredValue: string;
  /** True when the configuration asks for the real provider. */
  realProviderRequested: boolean;
  /** Booleans only — actual secrets are never reported. */
  ignavApiKeyConfigured: boolean;
  searchTokenSecretConfigured: boolean;
}

function normalizeProviderValue(raw: string | undefined): string {
  if (raw === undefined) return UNSET;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return UNSET;
  // Tolerate values pasted with wrapping quotes: '"ignav"' -> ignav.
  const unquoted = trimmed.replace(/^["']+|["']+$/g, "").trim();
  return unquoted || UNSET;
}

function hasIgnavApiKey(): boolean {
  return resolveIgnavApiKey() !== null;
}

function hasSearchTokenSecret(): boolean {
  const explicit = process.env.FLIGHT_SEARCH_SECRET?.trim();
  if (explicit && explicit.length >= 32) return true;
  const jwt = process.env.JWT_SECRET?.trim();
  if (jwt && jwt.length >= 32) return true;
  return process.env.NODE_ENV !== "production";
}

function resolveSelection(): FlightProviderName {
  const configured = normalizeProviderValue(process.env.FLIGHT_PROVIDER);

  if (configured === UNSET) {
    // Credentials decide: a real API key without FLIGHT_PROVIDER means real.
    return hasIgnavApiKey() ? "ignav" : "mock";
  }
  if (REAL_VALUES.has(configured)) return "ignav";
  if (MOCK_VALUES.has(configured)) return "mock";
  return "unknown";
}

function describeConfiguredValue(): string {
  const configured = normalizeProviderValue(process.env.FLIGHT_PROVIDER);
  if (configured === UNSET) return UNSET;
  if (REAL_VALUES.has(configured) || MOCK_VALUES.has(configured)) return configured;
  return UNRECOGNIZED;
}

/**
 * Safe, server-side-only snapshot of the flight provider configuration.
 * Contains names and booleans only — never an API key, secret or raw value.
 */
export function getFlightProviderDiagnostics(): FlightProviderDiagnostics {
  const provider = resolveSelection();
  return {
    provider,
    configuredValue: describeConfiguredValue(),
    realProviderRequested: provider === "ignav",
    ignavApiKeyConfigured: hasIgnavApiKey(),
    searchTokenSecretConfigured: hasSearchTokenSecret(),
  };
}

function logSelectionOnce(provider: FlightProvider): void {
  if (lastLoggedProvider === provider.name) return;
  lastLoggedProvider = provider.name;
  const diagnostics = getFlightProviderDiagnostics();
  console.log(
    `[flights] provider=${diagnostics.provider} FLIGHT_PROVIDER=${diagnostics.configuredValue} ignavKeyConfigured=${diagnostics.ignavApiKeyConfigured} searchTokenSecretConfigured=${diagnostics.searchTokenSecretConfigured}`
  );
}

export function getFlightProvider(): FlightProvider {
  const selection = resolveSelection();

  if (selection === "unknown") {
    // Failing loudly beats silently returning fake inventory for a
    // misconfigured provider — the search route turns this into the
    // "search unavailable" state.
    throw new Error(
      'Unsupported FLIGHT_PROVIDER value. Use "mock" or "ignav" (aliases: "real", "live").'
    );
  }

  if (selection === "ignav") {
    if (!ignavProvider) {
      if (!hasIgnavApiKey()) {
        // Server-side warning only: no key value, and no mock substitution.
        console.warn(
          "[flights] real provider selected but IGNAV_API_KEY is not configured; fare searches will fail with 'search unavailable' (no mock fallback)."
        );
      }
      ignavProvider = new IgnavFlightProvider();
    }
    logSelectionOnce(ignavProvider);
    return ignavProvider;
  }

  if (!mockProvider) {
    if (process.env.NODE_ENV === "production") {
      // Never silent: production mock inventory must be an explicit choice.
      console.warn(
        "[flights] no real flight configuration detected (FLIGHT_PROVIDER unset and IGNAV_API_KEY missing); serving mock inventory. Verify both variable names and their Vercel environment scope."
      );
    }
    mockProvider = new MockFlightProvider();
  }
  logSelectionOnce(mockProvider);
  return mockProvider;
}
