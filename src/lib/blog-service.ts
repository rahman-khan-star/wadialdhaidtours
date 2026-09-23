import type { BlogPost } from "@/types";
import { releaseMediaUrl } from "@/lib/storage";

async function getSupabase() {
  const { getSupabaseServer } = await import("./supabase-server");
  return getSupabaseServer();
}

function toDbBlogPost(p: {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  author: string;
  date: string;
  category: string;
  slug: string;
}) {
  return {
    id: p.id,
    title: p.title,
    excerpt: p.excerpt,
    image: p.image,
    author: p.author,
    date: p.date,
    category: p.category,
    slug: p.slug,
  };
}

function toClientBlogPost(row: Record<string, unknown>): BlogPost {
  return {
    id: row.id as string,
    title: row.title as string,
    excerpt: row.excerpt as string,
    image: row.image as string,
    author: row.author as string,
    date: row.date as string,
    category: row.category as string,
    slug: row.slug as string,
  };
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to fetch blog posts: ${error.message}`);
  return (data ?? []).map(toClientBlogPost);
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch blog post: ${error.message}`);
  }
  return toClientBlogPost(data);
}

export async function createBlogPost(p: Omit<BlogPost, "id">): Promise<BlogPost> {
  const supabaseServer = await getSupabase();
  const { data, error } = await supabaseServer
    .from("blog_posts")
    .upsert(toDbBlogPost({ ...p, id: crypto.randomUUID() }), {
      onConflict: "slug",
      count: "exact",
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to create blog post: ${error.message}`);
  return toClientBlogPost(data);
}

export async function updateBlogPost(id: string, updates: Partial<BlogPost>): Promise<BlogPost> {
  const supabaseServer = await getSupabase();
  const { data: existing, error: fetchError } = await supabaseServer
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError) throw new Error(`Failed to fetch existing blog post: ${fetchError.message}`);

  const current = toClientBlogPost(existing);
  const merged = { ...current, ...updates, id } as BlogPost;
  const { data, error } = await supabaseServer
    .from("blog_posts")
    .update(toDbBlogPost(merged))
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update blog post: ${error.message}`);
  const updated = toClientBlogPost(data);
  if (current.image !== updated.image) {
    await releaseMediaUrl(current.image);
  }
  return updated;
}

export async function deleteBlogPost(id: string): Promise<void> {
  const previous = await getBlogPostById(id).catch(() => null);
  const supabaseServer = await getSupabase();
  const { error } = await supabaseServer
    .from("blog_posts")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`Failed to delete blog post: ${error.message}`);
  if (previous) {
    await releaseMediaUrl(previous.image);
  }
}
