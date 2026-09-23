import type { TeamMember } from "@/types";
import { releaseMediaUrl } from "@/lib/storage";

async function getSupabase() {
  const { getSupabaseServer } = await import("./supabase-server");
  return getSupabaseServer();
}

function toDbTeamMember(m: {
  id: string;
  name: string;
  designation: string;
  photo: string;
  phone: string;
  whatsapp: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
}) {
  return {
    id: m.id,
    name: m.name,
    designation: m.designation,
    photo: m.photo,
    phone: m.phone,
    whatsapp: m.whatsapp,
    description: m.description ?? null,
    is_active: m.isActive,
    display_order: m.displayOrder,
  };
}

type TeamMemberRow = {
  id: string;
  name: string;
  designation: string;
  photo: string;
  phone: string;
  whatsapp: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

function toClientMember(row: TeamMemberRow): TeamMember {
  return {
    id: row.id,
    name: row.name,
    designation: row.designation,
    photo: row.photo,
    phone: row.phone,
    whatsapp: row.whatsapp,
    description: row.description ?? undefined,
    isActive: row.is_active,
    displayOrder: row.display_order,
  };
}

export async function getAllMembers(): Promise<TeamMember[]> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("team_members")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw new Error(`Failed to fetch team members: ${error.message}`);
  return (data ?? []).map(toClientMember);
}

export async function getMemberById(id: string): Promise<TeamMember | null> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("team_members")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch team member: ${error.message}`);
  }
  return toClientMember(data);
}

export async function createMember(m: Omit<TeamMember, "id">): Promise<TeamMember> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("team_members")
    .upsert(toDbTeamMember({ ...m, id: crypto.randomUUID() }), { onConflict: "name", count: "exact" })
    .select()
    .single();
  if (error) throw new Error(`Failed to create team member: ${error.message}`);
  return toClientMember(data);
}

export async function updateMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember> {
  const supabaseServer = await getSupabase();
  const { data: existing, error: fetchError } = await supabaseServer
    .from("team_members")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError) throw new Error(`Failed to fetch existing member: ${fetchError.message}`);

  const current = toClientMember(existing);
  const merged = { ...current, ...updates, id } as TeamMember;
  const { data, error } = await supabaseServer
    .from("team_members")
    .update(toDbTeamMember(merged))
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update team member: ${error.message}`);
  const updated = toClientMember(data);
  if (current.photo !== updated.photo) {
    await releaseMediaUrl(current.photo);
  }
  return updated;
}

export async function deleteMember(id: string): Promise<void> {
  const previous = await getMemberById(id).catch(() => null);
  const supabaseServer = await getSupabase();
  const { error } = await supabaseServer
    .from("team_members")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`Failed to delete team member: ${error.message}`);
  if (previous) {
    await releaseMediaUrl(previous.photo);
  }
}

export async function reorderMembers(members: { id: string; displayOrder: number }[]): Promise<void> {
  const supabaseServer = await getSupabase();
  for (const m of members) {
    await supabaseServer
      .from("team_members")
      .update({ display_order: m.displayOrder })
      .eq("id", m.id);
  }
}
