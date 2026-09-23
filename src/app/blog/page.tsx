import { getPublicBlogPosts } from "@/lib/public-data";
import { BlogView } from "./blog-view";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await getPublicBlogPosts();

  return <BlogView posts={posts} />;
}
