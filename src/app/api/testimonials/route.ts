import { NextResponse } from "next/server";
import { requireAdmin, requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { getAllTestimonials, createTestimonial } from "@/lib/testimonial-service";
import { findInvalidStringFields, isRecord } from "@/lib/validation";
import type { Testimonial } from "@/types";

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const testimonials = await getAllTestimonials();
    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error("Failed to fetch testimonials:", error);
    return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 });
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

    const missing = findInvalidStringFields(body, ["name", "text", "location"]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    if (typeof body.rating !== "number" || body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const testimonial: Omit<Testimonial, "id"> = {
      name: String(body.name).slice(0, 200),
      avatar: typeof body.avatar === "string" ? body.avatar.slice(0, 2000) : "",
      location: String(body.location).slice(0, 200),
      rating: body.rating,
      text: String(body.text).slice(0, 2000),
      package: typeof body.package === "string" ? body.package.slice(0, 300) : "",
    };

    const created = await createTestimonial(testimonial);
    await logAdminAction(request, auth, {
      action: "create",
      resource: "testimonial",
      resourceId: created.id,
      metadata: { name: created.name },
    });
    return NextResponse.json({ testimonial: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create testimonial:", error);
    return NextResponse.json({ error: "Failed to create testimonial" }, { status: 500 });
  }
}
