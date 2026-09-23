import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { applyRestore, validateRestorePayload, MAX_BACKUP_CHARS } from "@/lib/backup";

export async function POST(request: Request) {
  const auth = requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const text = await request.text();
    if (text.length > MAX_BACKUP_CHARS) {
      return NextResponse.json({ error: "Backup file is too large" }, { status: 413 });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Invalid backup file: not valid JSON" },
        { status: 400 }
      );
    }

    const validation = validateRestorePayload(payload);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const results = await applyRestore(validation.value.tables);
    const restoredRows = results.reduce((sum, result) => sum + result.upserted, 0);
    const failedTables = results.filter((result) => result.error);

    await logAdminAction(request, auth, {
      action: "backup_restore",
      resource: "backup",
      metadata: {
        restored_rows: restoredRows,
        failed_tables: failedTables.length,
        skipped_rows: validation.value.skippedRows,
      },
    });

    if (failedTables.length > 0 && restoredRows === 0) {
      return NextResponse.json(
        { error: "Restore failed — no tables could be restored", results },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      restoredRows,
      skippedRows: validation.value.skippedRows,
      results,
    });
  } catch (error) {
    console.error("Restore failed:", error);
    return NextResponse.json({ error: "Restore failed" }, { status: 500 });
  }
}
