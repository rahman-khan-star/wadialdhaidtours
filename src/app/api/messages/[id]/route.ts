import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { updateMessage, deleteMessage, markMessageRead, markMessageUnread } from "@/lib/message-service";
import { isRecord } from "@/lib/validation";
import type { Message } from "@/types";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing message id" }, { status: 400 });
    }

    const body = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Route id always wins so a payload cannot reassign another record's id.
    const updates = { ...body, id } as Partial<Message>;

    if (updates.read !== undefined) {
      if (typeof updates.read !== "boolean") {
        return NextResponse.json({ error: "read must be a boolean" }, { status: 400 });
      }
      const updated = updates.read
        ? await markMessageRead(id)
        : await markMessageUnread(id);
      await logAdminAction(request, auth, {
        action: "status_change",
        resource: "message",
        resourceId: id,
        metadata: { read: updates.read },
      });
      return NextResponse.json({ message: updated });
    }

    const updated = await updateMessage(id, updates);
    await logAdminAction(request, auth, {
      action: "update",
      resource: "message",
      resourceId: id,
    });
    return NextResponse.json({ message: updated });
  } catch (error) {
    console.error("Failed to update message:", error);
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing message id" }, { status: 400 });
    }
    await deleteMessage(id);
    await logAdminAction(request, auth, {
      action: "delete",
      resource: "message",
      resourceId: id,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete message:", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
