import type { Booking } from "@/types";

async function getSupabase() {
  const { getSupabaseServer } = await import("./supabase-server");
  return getSupabaseServer();
}

function toDbBooking(b: {
  id: string;
  name: string;
  packageName: string;
  date: string;
  amount: number;
  status: string;
}) {
  return {
    id: b.id,
    name: b.name,
    package_name: b.packageName,
    date: b.date,
    amount: b.amount,
    status: b.status,
  };
}

function toClientBooking(row: Record<string, unknown>): Booking {
  return {
    id: row.id as string,
    name: row.name as string,
    packageName: row.package_name as string,
    date: row.date as string,
    amount: row.amount as number,
    status: row.status as Booking["status"],
  };
}

export async function getAllBookings(): Promise<Booking[]> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to fetch bookings: ${error.message}`);
  return (data ?? []).map(toClientBooking);
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch booking: ${error.message}`);
  }
  return toClientBooking(data);
}

export async function createBooking(b: Omit<Booking, "id">): Promise<Booking> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("bookings")
    .upsert(toDbBooking({ ...b, id: crypto.randomUUID() }), {
      onConflict: "name,package_name,date",
      count: "exact",
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to create booking: ${error.message}`);
  return toClientBooking(data);
}

export async function updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
  const supabaseServer = await getSupabase();
  const { data: existing, error: fetchError } = await supabaseServer
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError) throw new Error(`Failed to fetch existing booking: ${fetchError.message}`);

  const current = toClientBooking(existing);
  const merged = { ...current, ...updates, id } as Booking;
  // Update by primary key: upserting on name/package/date breaks when any of
  // those fields change (the existing row id then collides on the primary key).
  const { data, error } = await supabaseServer
    .from("bookings")
    .update(toDbBooking(merged))
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update booking: ${error.message}`);
  return toClientBooking(data);
}

export async function updateBookingStatus(id: string, status: string): Promise<Booking> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("bookings")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update booking status: ${error.message}`);
  return toClientBooking(data);
}

export async function deleteBooking(id: string): Promise<void> {
  const supabaseServer = await getSupabase();
  const { error } = await supabaseServer
    .from("bookings")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`Failed to delete booking: ${error.message}`);
}
