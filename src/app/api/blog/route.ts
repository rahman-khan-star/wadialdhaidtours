import { NextResponse } from "next/server";
import { requireAdmin, requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { getAllBlogPosts, createBlogPost } from "@/lib/blog-service";
import { findInvalidStringFields, isRecord } from "@/lib/validation";
import type { BlogPost } from "@/types";

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const posts = await getAllBlogPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
    return NextResponse.json({ error: "Failed to fetch blog posts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const missing = findInvalidStringFields(body, ["title", "excerpt", "author", "category", "slug"]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const post: Omit<BlogPost, "id"> = {
      title: String(body.title).slice(0, 300),
      excerpt: String(body.excerpt).slice(0, 1000),
      image: typeof body.image === "string" ? body.image.slice(0, 2000) : "",
      author: String(body.author).slice(0, 200),
      date: typeof body.date === "string" ? body.date.slice(0, 40) : new Date().toISOString().slice(0, 10),
      category: String(body.category).slice(0, 100),
      slug: String(body.slug).slice(0, 200),
    };

    const created = await createBlogPost(post);
    await logAdminAction(request, auth, {
      action: "create",
      resource: "blog_post",
      resourceId: created.id,
      metadata: { title: created.title },
    });
    return NextResponse.json({ post: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create blog post:", error);
    return NextResponse.json({ error: "Failed to create blog post" }, { status: 500 });
  }
}
