import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { getPublicBlogPostBySlug } from "@/lib/public-data";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPublicBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-navy-900">
        <div className="absolute inset-0">
          <Image
            src={post.image}
            alt={post.title}
            fill
            priority
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-950/90 via-navy-900/70 to-navy-800/50" />
        </div>

        <div className="relative z-10 container-premium mx-auto px-4 py-24 sm:py-32">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to blog
          </Link>
          <div className="mt-8 max-w-3xl">
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-secondary backdrop-blur-sm">
              {post.category}
            </span>
            <h1 className="mt-4 text-4xl font-bold text-white sm:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
              {post.title}
            </h1>
            <div className="mt-4 flex items-center gap-2 text-white/70">
              <CalendarDays className="h-4 w-4" />
              <span>{new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            </div>
            <p className="mt-6 max-w-2xl text-lg text-white/70">{post.excerpt}</p>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-premium mx-auto max-w-3xl rounded-3xl border border-border bg-white p-8 shadow-sm dark:bg-navy-800 dark:border-white/10">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-secondary">Travel insight</p>
          <h2 className="mt-3 text-2xl font-bold text-text dark:text-white">A closer look at this experience</h2>
          <p className="mt-4 text-text-light dark:text-white/70">
            This article is part of our luxury travel storytelling collection. The full editorial experience is designed to inspire and guide travelers through exclusive destinations and premium itineraries.
          </p>
          <div className="mt-6 rounded-2xl border border-border bg-gold-50 p-5 text-sm text-text-light dark:border-white/10 dark:bg-gold-900/20 dark:text-white/70">
            Written by {post.author} for travelers planning unforgettable journeys with Wadi Al Dhaid Tours.
          </div>
        </div>
      </section>
    </main>
  );
}
