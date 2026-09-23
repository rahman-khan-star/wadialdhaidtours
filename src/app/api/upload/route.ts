import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { uploadMediaImage, validateImageFile, sanitizeFolder } from "@/lib/storage";

const CLIENT_SAFE_UPLOAD_ERRORS = /Invalid file type|too large|Missing file|Please choose/i;

export async function POST(request: Request) {
  const auth = requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folderRaw = formData.get("folder");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const folder = sanitizeFolder(typeof folderRaw === "string" ? folderRaw : "misc");
    const { url, path } = await uploadMediaImage(file, folder);

    await logAdminAction(request, auth, {
      action: "create",
      resource: "media",
      resourceId: path,
      metadata: { folder },
    });

    return NextResponse.json({ url, path }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    // Only known validation messages may reach the client; storage/provider
    // errors are logged server-side to avoid leaking infrastructure details.
    if (CLIENT_SAFE_UPLOAD_ERRORS.test(message)) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("Failed to upload image:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
