import { getSupabaseServer } from "@/lib/supabase-server";

export const BACKUP_VERSION = 1;
export const MAX_BACKUP_CHARS = 10_000_000;
export const MAX_ROWS_PER_TABLE = 50_000;
export const MAX_TOTAL_ROWS = 200_000;
const MAX_STRING_CHARS = 100_000;
const MAX_ARRAY_ITEMS = 5_000;

// Content tables included in backup/restore. Deliberately excluded:
// - users (contains password hashes — credentials never leave the server)
// - activity_logs / login_history (append-only audit data)
export const BACKUP_TABLES: Record<string, string[]> = {
  destinations: ["id", "name", "country", "description", "image", "rating", "price_from", "tags", "slug", "created_at", "updated_at"],
  tour_packages: ["id", "title", "destination", "description", "image", "duration", "price", "original_price", "rating", "review_count", "highlights", "included", "category", "created_at", "updated_at"],
  testimonials: ["id", "name", "avatar", "location", "rating", "text", "package", "created_at"],
  blog_posts: ["id", "title", "excerpt", "image", "author", "date", "category", "slug", "created_at", "updated_at"],
  visa_services: ["id", "country", "flag", "type", "duration", "price", "processing_time", "requirements", "is_active", "display_order", "created_at"],
  faqs: ["id", "question", "answer", "created_at"],
  gallery_items: ["id", "image", "title", "destination", "created_at"],
  statistics: ["id", "label", "value", "suffix", "created_at"],
  team_members: ["id", "name", "designation", "photo", "phone", "whatsapp", "description", "is_active", "display_order", "created_at", "updated_at"],
  messages: ["id", "name", "email", "phone", "subject", "message", "date", "read", "created_at"],
  settings: ["id", "company_name", "email", "phone", "whatsapp", "website", "address", "currency", "timezone", "created_at", "updated_at"],
  bookings: ["id", "name", "package_name", "date", "amount", "status", "created_at"],
  hotels: ["id", "name", "location", "image", "rating", "price", "amenities", "created_at"],
  about_team: ["id", "name", "role", "image", "created_at"],
};

export type BackupPayload = {
  version: number;
  exportedAt: string;
  tables: Record<string, Record<string, unknown>[]>;
};

export async function exportBackup(): Promise<BackupPayload> {
  const supabase = getSupabaseServer();
  const tables: Record<string, Record<string, unknown>[]> = {};

  for (const [table, columns] of Object.entries(BACKUP_TABLES)) {
    const { data, error } = await supabase
      .from(table)
      .select(columns.join(","))
      .limit(MAX_ROWS_PER_TABLE);

    if (error) {
      console.error(`Backup failed reading table ${table}:`, error.message);
      throw new Error(`Failed to read table: ${table}`);
    }

    tables[table] = (data ?? []) as unknown as Record<string, unknown>[];
  }

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    tables,
  };
}

const INVALID = Symbol("invalid");

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Accepts only primitive values and string arrays — objects/nested structures
// from an untrusted file are rejected outright.
function normalizeValue(value: unknown): unknown | typeof INVALID {
  if (value === null) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : INVALID;
  if (typeof value === "string") return value.length > MAX_STRING_CHARS ? INVALID : value;
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) return INVALID;
    if (!value.every((item) => typeof item === "string" && item.length <= MAX_STRING_CHARS)) {
      return INVALID;
    }
    return value;
  }
  return INVALID;
}

export type NormalizedRestore = {
  tables: Record<string, Record<string, unknown>[]>;
  skippedRows: number;
};

export type RestoreValidationError = string;

// Strict structural validation: known version, whitelisted tables/columns,
// primitive values only, primary key required. Never executes SQL.
export function validateRestorePayload(
  payload: unknown
): { ok: true; value: NormalizedRestore } | { ok: false; error: RestoreValidationError } {
  if (!isPlainObject(payload)) {
    return { ok: false, error: "Backup file must be a JSON object" };
  }

  if (payload.version !== BACKUP_VERSION) {
    return { ok: false, error: `Unsupported backup version (expected ${BACKUP_VERSION})` };
  }

  if (!isPlainObject(payload.tables)) {
    return { ok: false, error: "Backup file is missing the tables section" };
  }

  const tables: Record<string, Record<string, unknown>[]> = {};
  let skippedRows = 0;
  let totalRows = 0;

  for (const [table, rows] of Object.entries(payload.tables)) {
    if (!(table in BACKUP_TABLES)) {
      return { ok: false, error: `Unknown table in backup: ${table}` };
    }
    if (!Array.isArray(rows)) {
      return { ok: false, error: `Table ${table} must contain an array of rows` };
    }
    if (rows.length > MAX_ROWS_PER_TABLE) {
      return { ok: false, error: `Table ${table} exceeds the maximum row limit` };
    }

    totalRows += rows.length;
    if (totalRows > MAX_TOTAL_ROWS) {
      return { ok: false, error: "Backup exceeds the maximum total row limit" };
    }

    const allowedColumns = new Set(BACKUP_TABLES[table]);
    const normalizedRows: Record<string, unknown>[] = [];

    for (const row of rows) {
      if (!isPlainObject(row)) {
        skippedRows += 1;
        continue;
      }

      const id = row.id;
      if (typeof id !== "string" || !id.trim() || id.length > 200) {
        skippedRows += 1;
        continue;
      }

      const normalized: Record<string, unknown> = { id };
      let rowValid = true;

      for (const [column, value] of Object.entries(row)) {
        if (column === "id") continue;
        if (!allowedColumns.has(column)) continue;

        const normalizedValue = normalizeValue(value);
        if (normalizedValue === INVALID) {
          rowValid = false;
          break;
        }
        normalized[column] = normalizedValue;
      }

      if (!rowValid) {
        skippedRows += 1;
        continue;
      }

      normalizedRows.push(normalized);
    }

    tables[table] = normalizedRows;
  }

  return { ok: true, value: { tables, skippedRows } };
}

export type RestoreTableResult = {
  table: string;
  upserted: number;
  error?: string;
};

// Merge-only restore: upserts rows keyed by primary key id. Existing rows not
// present in the backup are never deleted; no SQL is ever executed.
export async function applyRestore(
  tables: Record<string, Record<string, unknown>[]>
): Promise<RestoreTableResult[]> {
  const supabase = getSupabaseServer();
  const results: RestoreTableResult[] = [];

  for (const [table, rows] of Object.entries(tables)) {
    if (rows.length === 0) {
      results.push({ table, upserted: 0 });
      continue;
    }

    try {
      const { data, error } = await supabase
        .from(table)
        .upsert(rows, { onConflict: "id" })
        .select("id");

      if (error) {
        console.error(`Restore failed for table ${table}:`, error.message);
        results.push({ table, upserted: 0, error: "Failed to restore this table" });
        continue;
      }

      results.push({ table, upserted: data?.length ?? 0 });
    } catch (error) {
      console.error(`Restore failed for table ${table}:`, error);
      results.push({ table, upserted: 0, error: "Failed to restore this table" });
    }
  }

  return results;
}
