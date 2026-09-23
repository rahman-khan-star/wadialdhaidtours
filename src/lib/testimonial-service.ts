import type { Testimonial } from "@/types";
import { releaseMediaUrl } from "@/lib/storage";

async function getSupabase() {
  const { getSupabaseServer } = await import("./supabase-server");
  return getSupabaseServer();
}

function toDbTestimonial(t: {
  id: string;
  name: string;
  avatar: string;
  location: string;
  rating: number;
  text: string;
  package: string;
}) {
  return {
    id: t.id,
    name: t.name,
    avatar: t.avatar,
    location: t.location,
    rating: t.rating,
    text: t.text,
    package: t.package,
  };
}

function toClientTestimonial(row: Testimonial): Testimonial {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    location: row.location,
    rating: row.rating,
    text: row.text,
    package: row.package,
  };
}

export async function getAllTestimonials(): Promise<Testimonial[]> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to fetch testimonials: ${error.message}`);
  return (data ?? []).map(toClientTestimonial);
}

export async function getTestimonialById(id: string): Promise<Testimonial | null> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("testimonials")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch testimonial: ${error.message}`);
  }
  return toClientTestimonial(data);
}

export async function createTestimonial(t: Omit<Testimonial, "id">): Promise<Testimonial> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("testimonials")
    .upsert(toDbTestimonial({ ...t, id: crypto.randomUUID() }), {
      onConflict: "name,text",
      count: "exact",
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to create testimonial: ${error.message}`);
  return toClientTestimonial(data);
}

export async function updateTestimonial(id: string, updates: Partial<Testimonial>): Promise<Testimonial> {
  const supabaseServer = await getSupabase();
  const { data: existing, error: fetchError } = await supabaseServer
    .from("testimonials")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError) throw new Error(`Failed to fetch existing testimonial: ${fetchError.message}`);

  const current = toClientTestimonial(existing);
  const merged = { ...current, ...updates, id } as Testimonial;
  const { data, error } = await supabaseServer
    .from("testimonials")
    .update(toDbTestimonial(merged))
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update testimonial: ${error.message}`);
  const updated = toClientTestimonial(data);
  if (current.avatar !== updated.avatar) {
    await releaseMediaUrl(current.avatar);
  }
  return updated;
}

export async function deleteTestimonial(id: string): Promise<void> {
  const previous = await getTestimonialById(id).catch(() => null);
  const supabaseServer = await getSupabase();
  const { error } = await supabaseServer
    .from("testimonials")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`Failed to delete testimonial: ${error.message}`);
  if (previous) {
    await releaseMediaUrl(previous.avatar);
  }
}
