import { releaseMediaUrl } from "@/lib/storage";

async function getSupabase() {
  const { getSupabaseServer } = await import("./supabase-server");
  return getSupabaseServer();
}

function toDbAboutTeam(m: { id: string; name: string; role: string; image: string }) {
  return {
    id: m.id,
    name: m.name,
    role: m.role,
    image: m.image,
  };
}

type AboutTeamRow = {
  id: string;
  name: string;
  role: string;
  image: string;
  created_at: string;
  updated_at: string;
};

function toClientAboutTeam(row: AboutTeamRow) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    image: row.image,
  };
}

export async function getAllAboutTeam(): Promise<{ id: string; name: string; role: string; image: string }[]> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("about_team")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(`Failed to fetch about team: ${error.message}`);
  return (data ?? []).map(toClientAboutTeam);
}

export async function getAboutTeamById(id: string): Promise<{ id: string; name: string; role: string; image: string } | null> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("about_team")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch about team member: ${error.message}`);
  }
  return toClientAboutTeam(data);
}

export async function createAboutTeam(m: { name: string; role: string; image: string }): Promise<{ id: string; name: string; role: string; image: string }> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("about_team")
    .upsert(toDbAboutTeam({ id: crypto.randomUUID(), ...m } as { id: string; name: string; role: string; image: string }), { onConflict: "name", count: "exact" })
    .select()
    .single();
  if (error) throw new Error(`Failed to create about team member: ${error.message}`);
  return toClientAboutTeam(data);
}

export async function updateAboutTeam(id: string, updates: Partial<{ name: string; role: string; image: string }>): Promise<{ id: string; name: string; role: string; image: string }> {
  const previous = await getAboutTeamById(id);
  if (!previous) throw new Error("Failed to fetch existing about team member");

  const merged = { ...previous, ...updates, id };
  const supabaseServer = await getSupabase();
  // Update by primary key: upserting on name breaks when the name changes.
  const { data, error } = await supabaseServer
    .from("about_team")
    .update(toDbAboutTeam(merged))
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update about team member: ${error.message}`);
  const updated = toClientAboutTeam(data);
  if (previous.image !== updated.image) {
    await releaseMediaUrl(previous.image);
  }
  return updated;
}

export async function deleteAboutTeam(id: string): Promise<void> {
  const previous = await getAboutTeamById(id).catch(() => null);
  const supabaseServer = await getSupabase();
  const { error } = await supabaseServer
    .from("about_team")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`Failed to delete about team member: ${error.message}`);
  if (previous) {
    await releaseMediaUrl(previous.image);
  }
}