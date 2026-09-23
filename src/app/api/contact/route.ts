import { NextResponse } from "next/server";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { createMessage } from "@/lib/message-service";
import { clampText, findInvalidStringFields, isRecord, isValidEmail } from "@/lib/validation";

const CONTACT_WINDOW_MS = 10 * 60 * 1000;
const CONTACT_MAX_PER_WINDOW = 5;

// Public contact form submission. Rate-limited per IP, strictly validated,
// and clamped before anything reaches the database.
export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    if (!consumeRateLimit(`contact:${clientIp}`, CONTACT_MAX_PER_WINDOW, CONTACT_WINDOW_MS)) {
      return NextResponse.json(
        { error: "Too many messages. Please try again later." },
        { status: 429, headers: { "Retry-After": String(CONTACT_WINDOW_MS / 1000) } }
      );
    }

    const body = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const missing = findInvalidStringFields(body, ["name", "email", "subject", "message"]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    const email = String(body.email).trim();
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    await createMessage({
      name: clampText(body.name, 200),
      email,
      phone: clampText(body.phone ?? "", 50),
      subject: clampText(body.subject, 300),
      message: clampText(body.message, 5000),
      date: new Date().toISOString().slice(0, 10),
      read: false,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to submit contact message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
