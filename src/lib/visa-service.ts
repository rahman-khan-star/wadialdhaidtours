import type { SupabaseClient } from "@supabase/supabase-js";
import type { VisaService } from "@/types";
import type { VisaServiceDraft } from "@/lib/visa-validation";

async function getSupabase() {
  const { getSupabaseServer } = await import("./supabase-server");
  return getSupabaseServer();
}

type VisaServiceRow = {
  id: string;
  country: string;
  flag: string;
  type: string;
  duration: string;
  price: number;
  processing_time: string;
  requirements: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
};

function toDbVisaService(v: VisaServiceDraft & { id: string }) {
  return {
    id: v.id,
    country: v.country,
    flag: v.flag,
    type: v.type,
    duration: v.duration,
    price: v.price,
    processing_time: v.processingTime,
    requirements: v.requirements,
    is_active: v.isActive,
    display_order: v.displayOrder ?? 0,
  };
}

function toClientVisaService(row: VisaServiceRow): VisaService {
  return {
    id: row.id,
    country: row.country,
    flag: row.flag,
    type: row.type,
    duration: row.duration,
    price: row.price,
    processingTime: row.processing_time,
    requirements: row.requirements ?? [],
    isActive: row.is_active,
    displayOrder: row.display_order,
  };
}

// Raised when (country, type) collides with an existing row, so routes can
// answer 409 instead of a generic 500.
export class DuplicateVisaServiceError extends Error {}

export class VisaServiceNotFoundError extends Error {}

export async function getAllVisaServices(): Promise<VisaService[]> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("visa_services")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Failed to fetch visa services: ${error.message}`);
  return (data ?? []).map(toClientVisaService);
}

export async function getVisaServiceById(id: string): Promise<VisaService | null> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("visa_services")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch visa service: ${error.message}`);
  }
  return toClientVisaService(data);
}

// Places a new record after the current last one when no order is supplied.
async function nextDisplayOrder(supabaseServer: SupabaseClient): Promise<number> {
  const { data, error } = await supabaseServer
    .from("visa_services")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1);
  if (error) throw new Error(`Failed to fetch visa service order: ${error.message}`);
  const highest = Array.isArray(data) ? data[0]?.display_order : undefined;
  return (typeof highest === "number" ? highest : 0) + 1;
}

function rethrowWriteError(error: { code?: string | null; message: string }, action: string): never {
  if (error.code === "23505") {
    throw new DuplicateVisaServiceError(
      "A visa service for this country and type already exists"
    );
  }
  throw new Error(`Failed to ${action} visa service: ${error.message}`);
}

export async function createVisaService(draft: VisaServiceDraft): Promise<VisaService> {
  const supabaseServer = await getSupabase();
  const displayOrder = draft.displayOrder ?? (await nextDisplayOrder(supabaseServer));
  const { data, error } = await supabaseServer
    .from("visa_services")
    .insert(toDbVisaService({ ...draft, displayOrder, id: crypto.randomUUID() }))
    .select()
    .single();
  if (error) rethrowWriteError(error, "create");
  return toClientVisaService(data as VisaServiceRow);
}

export async function updateVisaService(
  id: string,
  updates: Partial<VisaServiceDraft>
): Promise<VisaService> {
  const previous = await getVisaServiceById(id);
  if (!previous) throw new VisaServiceNotFoundError();

  const merged = {
    ...previous,
    ...updates,
    id,
    isActive: updates.isActive ?? previous.isActive ?? true,
    displayOrder: updates.displayOrder ?? previous.displayOrder ?? 0,
  };
  const supabaseServer = await getSupabase();
  // Update by primary key so changing country/type never reassigns another row.
  const { data, error } = await supabaseServer
    .from("visa_services")
    .update(toDbVisaService(merged))
    .eq("id", id)
    .select()
    .single();
  if (error) rethrowWriteError(error, "update");
  return toClientVisaService(data as VisaServiceRow);
}

export async function deleteVisaService(id: string): Promise<void> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("visa_services")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw new Error(`Failed to delete visa service: ${error.message}`);
  if (!data || data.length === 0) throw new VisaServiceNotFoundError();
}
