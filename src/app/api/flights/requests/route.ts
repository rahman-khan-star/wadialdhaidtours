import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createFlightRequest, getAllFlightRequests } from "@/lib/flight-request-service";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { clampText, findInvalidStringFields, isRecord, isValidEmail } from "@/lib/validation";
import { verifyFlightRequestToken } from "@/lib/flights";

const REQUEST_WINDOW_MS = 10 * 60 * 1000;
const REQUEST_MAX_PER_WINDOW = 5;

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const flightRequests = await getAllFlightRequests();
    return NextResponse.json({ flightRequests });
  } catch (error) {
    console.error("Failed to fetch flight requests:", error);
    return NextResponse.json({ error: "Failed to fetch flight requests" }, { status: 500 });
  }
}

// Public inquiry submission.
//
// Flight details are read exclusively from the server-signed search token, so
// the browser cannot submit fabricated itineraries, and no price is accepted
// or stored anywhere in this flow.
export async function POST(request: Request) {
  const clientIp = getClientIp(request);

  if (!consumeRateLimit(`flight-request:${clientIp}`, REQUEST_MAX_PER_WINDOW, REQUEST_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(REQUEST_WINDOW_MS / 1000) } }
    );
  }

  try {
    const body = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const missing = findInvalidStringFields(body, ["name", "email", "phone"]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: "Please provide your name, phone number and email address." },
        { status: 400 }
      );
    }

    const email = String(body.email).trim();
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const phone = clampText(body.phone, 50);
    if (phone.replace(/\D/g, "").length < 7) {
      return NextResponse.json({ error: "Please provide a valid phone number." }, { status: 400 });
    }

    const token = typeof body.searchToken === "string" ? body.searchToken : "";
    const payload = verifyFlightRequestToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Your selected flight has expired. Please search again and retry." },
        { status: 400 }
      );
    }

    const originName = [payload.origin.city, payload.origin.country]
      .filter(Boolean)
      .join(", ") || payload.origin.name;
    const destinationName = [payload.destination.city, payload.destination.country]
      .filter(Boolean)
      .join(", ") || payload.destination.name;

    const created = await createFlightRequest({
      name: clampText(body.name, 200),
      email,
      phone,
      originCode: payload.origin.iata.slice(0, 10),
      originName: clampText(originName, 200),
      destinationCode: payload.destination.iata.slice(0, 10),
      destinationName: clampText(destinationName, 200),
      departureDate: payload.departureDate,
      returnDate: payload.returnDate,
      passengers: payload.passengers,
      cabin: payload.cabin,
      airline: clampText(payload.airline, 120),
      flightNumber: clampText(payload.flightNumber, 30),
      message: clampText(body.message ?? "", 5000),
    });

    return NextResponse.json({ flightRequest: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to submit flight request:", error);
    return NextResponse.json({ error: "Failed to submit your request" }, { status: 500 });
  }
}
