import { NextResponse } from "next/server";
import { requireAdmin, requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { getAllMessages, createMessage } from "@/lib/message-service";
import { clampText, findInvalidStringFields, isRecord, isValidEmail } from "@/lib/validation";
import type { Message } from "@/types";

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const messages = await getAllMessages();
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const missing = findInvalidStringFields(body, ["name", "email", "phone", "subject", "message", "date"]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const email = String(body.email).trim();
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const msg: Omit<Message, "id"> = {
      name: clampText(body.name, 200),
      email,
      phone: clampText(body.phone, 50),
      subject: clampText(body.subject, 300),
      message: clampText(body.message, 5000),
      date: clampText(body.date, 40),
      read: false,
    };

    const created = await createMessage(msg);
    await logAdminAction(request, auth, {
      action: "create",
      resource: "message",
      resourceId: created.id,
      metadata: { subject: created.subject },
    });
    return NextResponse.json({ message: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create message:", error);
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
  }
}
