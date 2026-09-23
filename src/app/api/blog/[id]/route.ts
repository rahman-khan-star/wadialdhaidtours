import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { updateBlogPost, deleteBlogPost } from "@/lib/blog-service";
import { isRecord } from "@/lib/validation";
import type { BlogPost } from "@/types";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing post id" }, { status: 400 });
    }

    const body = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Route id always wins so a payload cannot reassign another record's id.
    const updates = { ...body, id } as Partial<BlogPost>;

    const updated = await updateBlogPost(id, updates);
    await logAdminAction(request, auth, {
      action: "update",
      resource: "blog_post",
      resourceId: id,
    });
    return NextResponse.json({ post: updated });
  } catch (error) {
    console.error("Failed to update blog post:", error);
    return NextResponse.json({ error: "Failed to update blog post" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing post id" }, { status: 400 });
    }
    await deleteBlogPost(id);
    await logAdminAction(request, auth, {
      action: "delete",
      resource: "blog_post",
      resourceId: id,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete blog post:", error);
    return NextResponse.json({ error: "Failed to delete blog post" }, { status: 500 });
  }
}
