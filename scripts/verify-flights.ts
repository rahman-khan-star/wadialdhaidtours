/**
 * Verification for the flight search + inquiry flow.
 *
 * Run: npx tsx scripts/verify-flights.ts
 *
 * Covers provider search, mock inventory, the "no price" guarantee, search
 * parameter validation and the signed request token.
 */
import {
  assertNoProviderPricing,
  getFlightProvider,
  parseFlightSearchParams,
  signFlightRequestToken,
  toPublicSearchResult,
  verifyFlightRequestToken,
} from "../src/lib/flights";
import type { FlightSearchInput, FlightSearchResult } from "../src/types";

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(title: string): void {
  console.log(`\n${title}`);
}

const PRICE_KEY_PATTERN = /price|fare|amount|cost|currency|quote/i;

function findPriceKeys(value: unknown, path = "", found: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((item, index) => findPriceKeys(item, `${path}[${index}]`, found));
  } else if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      const next = path ? `${path}.${key}` : key;
      if (PRICE_KEY_PATTERN.test(key)) found.push(next);
      findPriceKeys(entry, next, found);
    }
  }
  return found;
}

function baseQuery(overrides: Partial<FlightSearchInput> = {}): FlightSearchInput {
  return {
    origin: "DXB",
    destination: "KHI",
    departureDate: "2026-11-15",
    returnDate: "2026-11-25",
    passengers: 1,
    cabin: "Economy",
    tripType: "roundtrip",
    ...overrides,
  };
}

async function main(): Promise<void> {
  const provider = getFlightProvider();
  check("default provider resolves to mock", provider.name === "mock");

  section("Airport / city search");
  const byCity = await provider.searchAirports("Lahore");
  check("city name resolves", byCity.some((a) => a.iata === "LHE"));

  const byCode = await provider.searchAirports("khi");
  check("IATA code resolves (case-insensitive)", byCode.some((a) => a.iata === "KHI"));

  const byCountry = await provider.searchAirports("Pakistan");
  check("country search returns several airports", byCountry.length > 1);

  const all = await provider.searchAirports("", 25);
  check("empty query returns popular list up to limit", all.length > 0 && all.length <= 25);

  const unknown = await provider.searchAirports("zzzznotacity");
  check("unknown query returns no airports", unknown.length === 0);

  section("Flight search coverage");
  const routes: { origin: string; destination: string; label: string }[] = [
    { origin: "DXB", destination: "KHI", label: "Dubai → Karachi" },
    { origin: "LHE", destination: "LHR", label: "Lahore → London" },
    { origin: "ISB", destination: "RUH", label: "Islamabad → Riyadh" },
    { origin: "KHI", destination: "DXB", label: "Karachi → Dubai (reverse)" },
    { origin: "DEL", destination: "SIN", label: "Delhi → Singapore" },
    { origin: "JFK", destination: "IST", label: "New York → Istanbul" },
  ];

  let totalOffers = 0;
  for (const route of routes) {
    const offers = await provider.searchFlights(
      baseQuery({ origin: route.origin, destination: route.destination })
    );
    totalOffers += offers.length;
    const withAllFields = offers.every(
      (offer) =>
        Boolean(offer.outbound.airline) &&
        Boolean(offer.outbound.flightNumber) &&
        Boolean(offer.outbound.departureTime) &&
        Boolean(offer.outbound.arrivalTime) &&
        offer.outbound.durationMinutes > 0 &&
        Number.isInteger(offer.outbound.stops) &&
        (offer.availability === "Available" || offer.availability === "Limited") &&
        offer.cabin === "Economy"
    );
    check(`${route.label} returns usable itineraries`, offers.length > 0 && withAllFields);
  }
  check("across all routes at least one itinerary was produced", totalOffers > 0);

  section("Trip types, passengers and cabin");
  const oneWay = await provider.searchFlights(
    baseQuery({ tripType: "oneway", returnDate: null })
  );
  check(
    "one-way search has no inbound leg",
    oneWay.length > 0 && oneWay.every((offer) => offer.inbound === null && offer.tripType === "oneway")
  );

  const roundTrip = await provider.searchFlights(baseQuery());
  check(
    "round trip search has an inbound leg",
    roundTrip.length > 0 && roundTrip.every((offer) => offer.inbound !== null)
  );

  const business = await provider.searchFlights(baseQuery({ cabin: "Business" }));
  check(
    "cabin class is applied to every result",
    business.every((offer) => offer.cabin === "Business")
  );

  const group = await provider.searchFlights(baseQuery({ passengers: 4 }));
  check(
    "results always seat the requested passenger count",
    group.every((offer) => offer.seatsRemaining >= 4)
  );

  const partyOfNine = await provider.searchFlights(baseQuery({ passengers: 9 }));
  check(
    "large parties still resolve without crashing",
    Array.isArray(partyOfNine)
  );

  const differentDates = await provider.searchFlights(baseQuery({ departureDate: "2026-12-24" }));
  const otherDates = await provider.searchFlights(baseQuery({ departureDate: "2026-12-25" }));
  check(
    "different departure dates produce different schedules",
    JSON.stringify(differentDates.map((o) => o.outbound.flightNumber)) !==
      JSON.stringify(otherDates.map((o) => o.outbound.flightNumber))
  );

  section("No customer-visible pricing");
  const sample = roundTrip[0];
  check("provider internally carries a fare", typeof sample?.internalFare?.amount === "number");

  const publicFlights = roundTrip.map((offer, index) =>
    toPublicSearchResult(offer, `token-${index}`)
  );
  const payload = { status: "available", flights: publicFlights };
  const leaked = findPriceKeys(payload);
  check("serialized flights contain no price-like keys", leaked.length === 0, leaked.join(", "));

  let guardThrew = false;
  try {
    assertNoProviderPricing(payload);
  } catch {
    guardThrew = true;
  }
  check("pricing guard accepts a clean payload", !guardThrew);

  let guardCaughtLeak = false;
  try {
    assertNoProviderPricing({ flights: [{ price: 100 }] });
  } catch {
    guardCaughtLeak = true;
  }
  check("pricing guard rejects a leaked price", guardCaughtLeak);

  section("Search parameter validation");
  const past = parseFlightSearchParams(
    new URLSearchParams({ origin: "DXB", destination: "KHI", departureDate: "2020-01-01" })
  );
  check("past departure date is rejected", past.ok === false);

  const returnBeforeDeparture = parseFlightSearchParams(
    new URLSearchParams({
      origin: "DXB",
      destination: "KHI",
      departureDate: "2026-11-20",
      returnDate: "2026-11-19",
      tripType: "roundtrip",
    })
  );
  check("return before departure is rejected", returnBeforeDeparture.ok === false);

  const sameAirport = parseFlightSearchParams(
    new URLSearchParams({ origin: "DXB", destination: "dxb", departureDate: "2026-11-20" })
  );
  check("identical origin and destination rejected", sameAirport.ok === false);

  const badCabin = parseFlightSearchParams(
    new URLSearchParams({
      origin: "DXB",
      destination: "KHI",
      departureDate: "2026-11-20",
      cabin: "Cargo",
    })
  );
  check("unknown cabin rejected", badCabin.ok === false);

  const tooManyPassengers = parseFlightSearchParams(
    new URLSearchParams({
      origin: "DXB",
      destination: "KHI",
      departureDate: "2026-11-20",
      passengers: "40",
    })
  );
  check("passenger count above limit rejected", tooManyPassengers.ok === false);

  const missingReturn = parseFlightSearchParams(
    new URLSearchParams({
      origin: "DXB",
      destination: "KHI",
      departureDate: "2026-11-20",
      tripType: "roundtrip",
    })
  );
  check("round trip without return date rejected", missingReturn.ok === false);

  const valid = parseFlightSearchParams(
    new URLSearchParams({
      origin: "DXB",
      destination: "KHI",
      departureDate: "2026-11-20",
      returnDate: "2026-11-28",
      passengers: "3",
      cabin: "Business",
      tripType: "roundtrip",
    })
  );
  check("valid search accepted", valid.ok === true);
  if (valid.ok) {
    check("valid search keeps cabin", valid.value.cabin === "Business");
    check("valid search keeps passengers", valid.value.passengers === 3);
  }

  section("Signed request token");
  const offers = await provider.searchFlights(baseQuery());
  check("token subject search returned offers", offers.length > 0);
  const flight: FlightSearchResult | undefined = offers[0]
    ? toPublicSearchResult(
        offers[0],
        signFlightRequestToken(offers[0], {
          origin: { iata: "DXB", name: "Dubai International Airport", city: "Dubai", country: "United Arab Emirates" },
          destination: { iata: "KHI", name: "Jinnah International Airport", city: "Karachi", country: "Pakistan" },
          departureDate: "2026-11-15",
          returnDate: "2026-11-25",
          passengers: 2,
          cabin: "Economy",
          tripType: "roundtrip",
        })
      )
    : undefined;
  check("signed token attached to flight", Boolean(flight?.requestToken));

  if (flight) {
    const payloadFromToken = verifyFlightRequestToken(flight.requestToken);
    check("token verifies", payloadFromToken !== null);
    check("token carries trusted airline", payloadFromToken?.airline === flight.outbound.airline);
    check("token carries trusted flight number", payloadFromToken?.flightNumber === flight.outbound.flightNumber);
    check("token carries trusted passengers", payloadFromToken?.passengers === 2);
    check("token carries trusted origin", payloadFromToken?.origin.iata === "DXB");

    const [body, signature] = flight.requestToken.split(".");
    const tampered = `${body}.${signature.slice(0, -2)}${signature.slice(-2) === "AA" ? "BB" : "AA"}`;
    check("tampered token rejected", verifyFlightRequestToken(tampered) === null);
    check("empty token rejected", verifyFlightRequestToken("") === null);
    check("garbage token rejected", verifyFlightRequestToken("not-a-token") === null);

    const expired = JSON.parse(
      Buffer.from(flight.requestToken.split(".")[0], "base64url").toString("utf8")
    ) as Record<string, unknown>;
    expired.exp = Date.now() - 1000;
    const expiredEncoded = Buffer.from(JSON.stringify(expired), "utf8").toString("base64url");
    const expiredToken = `${expiredEncoded}.${flight.requestToken.split(".")[1]}`;
    check("expired token rejected", verifyFlightRequestToken(expiredToken) === null);
  }

  section("Provider selection");
  process.env.FLIGHT_PROVIDER = "does-not-exist";
  let threw = false;
  try {
    getFlightProvider();
  } catch {
    threw = true;
  }
  check("unknown provider fails loudly", threw);
  process.env.FLIGHT_PROVIDER = "mock";

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
