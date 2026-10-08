import { NextResponse } from "next/server";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { getFlightProvider, getFlightProviderDiagnostics, parseAirportSearchParams } from "@/lib/flights";

const AIRPORT_WINDOW_MS = 60 * 1000;
const AIRPORT_MAX_PER_WINDOW = 60;

// Global origin/destination lookup behind the search form's autocomplete.
// Provider credentials stay on the server and are never echoed by diagnostics.
export async function GET(request: Request) {
  const clientIp = getClientIp(request);

  if (!consumeRateLimit(`flight-airports:${clientIp}`, AIRPORT_MAX_PER_WINDOW, AIRPORT_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many airport lookups. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(AIRPORT_WINDOW_MS / 1000) } }
    );
  }

  try {
    const url = new URL(request.url);
    const parsed = parseAirportSearchParams(url.searchParams);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const provider = getFlightProvider();
    const airports = await provider.searchAirports(parsed.value.query, parsed.value.limit);
    return NextResponse.json({ airports });
  } catch (error) {
    console.error("Failed to search airports:", getFlightProviderDiagnostics(), error);
    return NextResponse.json(
      { error: "Airport search is unavailable right now." },
      { status: 503 }
    );
  }
}
