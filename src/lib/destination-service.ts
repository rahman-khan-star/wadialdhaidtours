import type { Destination } from "@/types";
import { releaseMediaUrl } from "@/lib/storage";

async function getSupabase() {
  const { getSupabaseServer } = await import("./supabase-server");
  return getSupabaseServer();
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
  return slug || crypto.randomUUID();
}

function toDbDestination(dest: {
  id?: string;
  name: string;
  country: string;
  description: string;
  image: string;
  rating: number;
  priceFrom: number;
  tags: string[];
}) {
  return {
    ...(dest.id ? { id: dest.id } : {}),
    name: dest.name,
    country: dest.country,
    description: dest.description,
    image: dest.image,
    rating: dest.rating,
    price_from: dest.priceFrom,
    tags: dest.tags,
    slug: dest.id ?? slugify(dest.name),
  };
}

type DestinationRow = {
  id: string;
  name: string;
  country: string;
  description: string;
  image: string;
  rating: number;
  price_from: number;
  tags: string[];
  slug: string;
  created_at: string;
  updated_at: string;
};

function toClientDestination(row: DestinationRow): Destination {
  return {
    id: row.id,
    name: row.name,
    country: row.country,
    description: row.description,
    image: row.image,
    rating: row.rating,
    priceFrom: row.price_from,
    tags: row.tags ?? [],
  };
}

export async function getAllDestinations(): Promise<Destination[]> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("destinations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to fetch destinations: ${error.message}`);
  return (data ?? []).map(toClientDestination);
}

export async function getDestinationById(id: string): Promise<Destination | null> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("destinations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch destination: ${error.message}`);
  if (data) return toClientDestination(data);

  // Seeded rows keep the human-readable slug (e.g. "dubai") while the primary
  // key is a UUID, so public URLs must also resolve by slug.
  const { data: bySlug, error: slugError } = await supabaseServer
    .from("destinations")
    .select("*")
    .eq("slug", id)
    .maybeSingle();
  if (slugError) throw new Error(`Failed to fetch destination: ${slugError.message}`);
  return bySlug ? toClientDestination(bySlug) : null;
}

export async function createDestination(dest: Destination): Promise<Destination> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("destinations")
    .upsert(toDbDestination(dest), { onConflict: "slug", count: "exact" })
    .select()
    .single();
  if (error) throw new Error(`Failed to create destination: ${error.message}`);
  return toClientDestination(data);
}

export async function updateDestination(id: string, updates: Partial<Destination>): Promise<Destination> {
  const previous = await getDestinationById(id);
  if (!previous) throw new Error("Failed to fetch existing destination");

  const merged = { ...previous, ...updates, id };
  const supabaseServer = await getSupabase();
  // Update by primary key only; the slug is never rewritten so existing
  // public URLs keep working.
  const { data, error } = await supabaseServer
    .from("destinations")
    .update({
      name: merged.name,
      country: merged.country,
      description: merged.description,
      image: merged.image,
      rating: merged.rating,
      price_from: merged.priceFrom,
      tags: merged.tags,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update destination: ${error.message}`);
  const updated = toClientDestination(data);
  if (previous.image !== updated.image) {
    await releaseMediaUrl(previous.image);
  }
  return updated;
}

export async function deleteDestination(id: string): Promise<void> {
  const previous = await getDestinationById(id).catch(() => null);
  const supabaseServer = await getSupabase();
  const { error } = await supabaseServer
    .from("destinations")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`Failed to delete destination: ${error.message}`);
  if (previous) {
    await releaseMediaUrl(previous.image);
  }
}
