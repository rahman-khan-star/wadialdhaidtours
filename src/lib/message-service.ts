import type { Message } from "@/types";

async function getSupabase() {
  const { getSupabaseServer } = await import("./supabase-server");
  return getSupabaseServer();
}

function toDbMessage(m: {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
}) {
  return {
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    subject: m.subject,
    message: m.message,
    date: m.date,
    read: m.read,
  };
}

function toClientMessage(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    phone: row.phone as string,
    subject: row.subject as string,
    message: row.message as string,
    date: row.date as string,
    read: row.read as boolean,
  };
}

export async function getAllMessages(): Promise<Message[]> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to fetch messages: ${error.message}`);
  return (data ?? []).map(toClientMessage);
}

export async function getMessageById(id: string): Promise<Message | null> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("messages")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch message: ${error.message}`);
  }
  return toClientMessage(data);
}

export async function createMessage(m: Omit<Message, "id">): Promise<Message> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("messages")
    .upsert(toDbMessage({ ...m, id: crypto.randomUUID() }), {
      onConflict: "name,subject,date",
      count: "exact",
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to create message: ${error.message}`);
  return toClientMessage(data);
}

export async function updateMessage(id: string, updates: Partial<Message>): Promise<Message> {
  const supabaseServer = await getSupabase();
  const { data: existing, error: fetchError } = await supabaseServer
    .from("messages")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError) throw new Error(`Failed to fetch existing message: ${fetchError.message}`);

  const current = toClientMessage(existing);
  const merged = { ...current, ...updates, id } as Message;
  const { data, error } = await supabaseServer
    .from("messages")
    .update(toDbMessage(merged))
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update message: ${error.message}`);
  return toClientMessage(data);
}

export async function markMessageRead(id: string): Promise<Message> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("messages")
    .update({ read: true })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`Failed to mark message as read: ${error.message}`);
  return toClientMessage(data);
}

export async function markMessageUnread(id: string): Promise<Message> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("messages")
    .update({ read: false })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`Failed to mark message as unread: ${error.message}`);
  return toClientMessage(data);
}

export async function deleteMessage(id: string): Promise<void> {
  const supabaseServer = await getSupabase();
  const { error } = await supabaseServer
    .from("messages")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`Failed to delete message: ${error.message}`);
}
