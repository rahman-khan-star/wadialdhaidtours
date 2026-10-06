import type { CabinClass, FlightRequest, FlightRequestStatus } from "@/types";

async function getSupabase() {
  const { getSupabaseServer } = await import("./supabase-server");
  return getSupabaseServer();
}

type DbFlightRequest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  origin_code: string;
  origin_name: string;
  destination_code: string;
  destination_name: string;
  departure_date: string;
  return_date: string | null;
  passengers: number;
  cabin: string;
  airline: string;
  flight_number: string;
  message: string;
  status: string;
  created_at?: string;
};

function toDbFlightRequest(request: FlightRequest): Record<string, unknown> {
  return {
    id: request.id,
    name: request.name,
    email: request.email,
    phone: request.phone,
    origin_code: request.originCode,
    origin_name: request.originName,
    destination_code: request.destinationCode,
    destination_name: request.destinationName,
    departure_date: request.departureDate,
    return_date: request.returnDate,
    passengers: request.passengers,
    cabin: request.cabin,
    airline: request.airline,
    flight_number: request.flightNumber,
    message: request.message,
    status: request.status,
  };
}

function toClientFlightRequest(row: DbFlightRequest): FlightRequest {
  const createdAt = row.created_at ? row.created_at.slice(0, 10) : "";
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    originCode: row.origin_code,
    originName: row.origin_name,
    destinationCode: row.destination_code,
    destinationName: row.destination_name,
    departureDate: String(row.departure_date).slice(0, 10),
    returnDate: row.return_date ? String(row.return_date).slice(0, 10) : null,
    passengers: row.passengers,
    cabin: row.cabin as CabinClass,
    airline: row.airline,
    flightNumber: row.flight_number,
    message: row.message,
    status: row.status as FlightRequestStatus,
    date: createdAt || String(row.departure_date).slice(0, 10),
  };
}

export async function getAllFlightRequests(): Promise<FlightRequest[]> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("flight_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to fetch flight requests: ${error.message}`);
  return ((data ?? []) as DbFlightRequest[]).map(toClientFlightRequest);
}

export async function getFlightRequestById(id: string): Promise<FlightRequest | null> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("flight_requests")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch flight request: ${error.message}`);
  }
  return toClientFlightRequest(data as DbFlightRequest);
}

export async function createFlightRequest(
  request: Omit<FlightRequest, "id" | "status" | "date">
): Promise<FlightRequest> {
  const supabaseServer = await getSupabase();
  const payload = toDbFlightRequest({
    ...request,
    id: "",
    status: "New",
    date: new Date().toISOString().slice(0, 10),
  });
  // Let the database assign the primary key.
  delete payload.id;

  const { data, error } = await supabaseServer
    .from("flight_requests")
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(`Failed to create flight request: ${error.message}`);
  return toClientFlightRequest(data as DbFlightRequest);
}

export async function updateFlightRequestStatus(
  id: string,
  status: FlightRequestStatus
): Promise<FlightRequest> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("flight_requests")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update flight request: ${error.message}`);
  return toClientFlightRequest(data as DbFlightRequest);
}

export async function deleteFlightRequest(id: string): Promise<void> {
  const supabaseServer = await getSupabase();
  const { error } = await supabaseServer.from("flight_requests").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete flight request: ${error.message}`);
}
