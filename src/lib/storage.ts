import { getSupabaseServer } from "@/lib/supabase-server";

export const MEDIA_BUCKET = "media";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

const MEDIA_TABLES: { table: string; column: string }[] = [
  { table: "destinations", column: "image" },
  { table: "tour_packages", column: "image" },
  { table: "blog_posts", column: "image" },
  { table: "testimonials", column: "avatar" },
  { table: "team_members", column: "photo" },
  { table: "hotels", column: "image" },
  { table: "about_team", column: "image" },
  { table: "gallery_items", column: "image" },
];

function getPublicBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  return `${url.replace(/\/$/, "")}/storage/v1/object/public/${MEDIA_BUCKET}`;
}

export function sanitizeFolder(folder: string): string {
  return folder.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "misc";
}

export function sanitizeFileName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() || "image";
  const cleaned = base
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80);
  return cleaned || "image";
}

export function validateImageFile(file: File): string | null {
  if (!file || file.size === 0) {
    return "Please choose an image file.";
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowedExtension = Object.values(ALLOWED_IMAGE_TYPES);
  const typeOk = Boolean(ALLOWED_IMAGE_TYPES[file.type]);
  const extensionOk =
    allowedExtension.includes(extension) ||
    (extension === "jpeg" && allowedExtension.includes("jpg"));

  if (!typeOk || !extensionOk) {
    return "Invalid file type. Allowed: JPEG, PNG, WebP, GIF, AVIF.";
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return "File is too large. Maximum size is 5MB.";
  }

  return null;
}

async function ensureBucket(): Promise<void> {
  const supabase = getSupabaseServer();
  const { error } = await supabase.storage.createBucket(MEDIA_BUCKET, {
    public: true,
    fileSizeLimit: MAX_IMAGE_BYTES,
    allowedMimeTypes: Object.keys(ALLOWED_IMAGE_TYPES),
  });

  if (error && !/already exists|duplicate/i.test(error.message)) {
    throw new Error(`Failed to ensure media bucket: ${error.message}`);
  }
}

export async function uploadMediaImage(
  file: File,
  folder: string
): Promise<{ url: string; path: string }> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  await ensureBucket();

  const safeFolder = sanitizeFolder(folder);
  const safeName = sanitizeFileName(file.name);
  const path = `${safeFolder}/${Date.now()}-${safeName}`;
  const supabase = getSupabaseServer();

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, buffer, {
      contentType: ALLOWED_IMAGE_TYPES[file.type] ? file.type : "application/octet-stream",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  return {
    path,
    url: `${getPublicBaseUrl()}/${path}`,
  };
}

export function getManagedStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;

  const prefix = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const markerIndex = url.indexOf(prefix);
  if (markerIndex === -1) return null;

  const path = url.slice(markerIndex + prefix.length).split(/[?#]/)[0];
  if (!path || path.includes("..")) return null;
  return path;
}

export function isManagedMediaUrl(url: string | null | undefined): boolean {
  return getManagedStoragePath(url) !== null;
}

async function isUrlReferenced(url: string): Promise<boolean> {
  const supabase = getSupabaseServer();

  for (const { table, column } of MEDIA_TABLES) {
    const { data, error } = await supabase
      .from(table)
      .select("id")
      .eq(column, url)
      .limit(1);

    if (error) {
      throw new Error(`Failed to check media references on ${table}: ${error.message}`);
    }

    if (data && data.length > 0) {
      return true;
    }
  }

  return false;
}

export async function releaseMediaUrl(url: string | null | undefined): Promise<void> {
  const path = getManagedStoragePath(url);
  if (!path) return;

  try {
    if (await isUrlReferenced(url as string)) {
      return;
    }

    const supabase = getSupabaseServer();
    const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
    if (error) {
      console.error("Failed to remove orphaned media file:", error.message);
    }
  } catch (error) {
    console.error("Media cleanup failed:", error);
  }
}
