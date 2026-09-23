import type { Hotel } from "@/types";
import { releaseMediaUrl } from "@/lib/storage";

async function getSupabase() {
  const { getSupabaseServer } = await import("./supabase-server");
  return getSupabaseServer();
}

function toDbHotel(h: {
  id: string;
  name: string;
  location: string;
  image: string;
  rating: number;
  price: number;
  amenities: string[];
}) {
  return {
    id: h.id,
    name: h.name,
    location: h.location,
    image: h.image,
    rating: h.rating,
    price: h.price,
    amenities: h.amenities,
  };
}

type HotelRow = {
  id: string;
  name: string;
  location: string;
  image: string;
  rating: number;
  price: number;
  amenities: string[];
  created_at: string;
  updated_at: string;
};

function toClientHotel(row: HotelRow): Hotel {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    image: row.image,
    rating: row.rating,
    price: row.price,
    amenities: row.amenities ?? [],
  };
}

export async function getAllHotels(): Promise<Hotel[]> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("hotels")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(`Failed to fetch hotels: ${error.message}`);
  return (data ?? []).map(toClientHotel);
}

export async function getHotelById(id: string): Promise<Hotel | null> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("hotels")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch hotel: ${error.message}`);
  }
  return toClientHotel(data);
}

export async function createHotel(h: Omit<Hotel, "id">): Promise<Hotel> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("hotels")
    .upsert(toDbHotel({ ...h, id: crypto.randomUUID() }), { onConflict: "name", count: "exact" })
    .select()
    .single();
  if (error) throw new Error(`Failed to create hotel: ${error.message}`);
  return toClientHotel(data);
}

export async function updateHotel(id: string, updates: Partial<Hotel>): Promise<Hotel> {
  const previous = await getHotelById(id);
  if (!previous) throw new Error("Failed to fetch existing hotel");

  const merged = { ...previous, ...updates, id };
  const supabaseServer = await getSupabase();
  // Update by primary key: upserting on name breaks when the name changes.
  const { data, error } = await supabaseServer
    .from("hotels")
    .update(toDbHotel(merged))
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update hotel: ${error.message}`);
  const updated = toClientHotel(data);
  if (previous.image !== updated.image) {
    await releaseMediaUrl(previous.image);
  }
  return updated;
}

export async function deleteHotel(id: string): Promise<void> {
  const previous = await getHotelById(id).catch(() => null);
  const supabaseServer = await getSupabase();
  const { error } = await supabaseServer
    .from("hotels")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`Failed to delete hotel: ${error.message}`);
  if (previous) {
    await releaseMediaUrl(previous.image);
  }
}