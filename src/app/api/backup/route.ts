import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { exportBackup } from "@/lib/backup";

export async function POST(request: Request) {
  const auth = requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const payload = await exportBackup();
    const totalRows = Object.values(payload.tables).reduce(
      (sum, rows) => sum + rows.length,
      0
    );
    const json = JSON.stringify(payload);

    await logAdminAction(request, auth, {
      action: "backup_create",
      resource: "backup",
      metadata: {
        tables: Object.keys(payload.tables).length,
        rows: totalRows,
        bytes: json.length,
      },
    });

    const stamp = payload.exportedAt.replace(/[:.]/g, "-");
    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="wadi-backup-${stamp}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Backup export failed:", error);
    return NextResponse.json({ error: "Backup export failed" }, { status: 500 });
  }
}
