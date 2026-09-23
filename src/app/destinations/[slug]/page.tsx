import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Star } from "lucide-react";
import { getPublicDestinationById } from "@/lib/public-data";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DestinationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const destination = await getPublicDestinationById(slug);

  if (!destination) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-navy-900">
        <div className="absolute inset-0">
          <Image
            src={destination.image}
            alt={destination.name}
            fill
            priority
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-950/90 via-navy-900/70 to-navy-800/50" />
        </div>

        <div className="relative z-10 container-premium mx-auto px-4 py-24 sm:py-32">
          <Link href="/destinations" className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to destinations
          </Link>
          <div className="mt-8 max-w-3xl">
            <div className="flex items-center gap-2 text-secondary">
              <Star className="h-4 w-4 fill-secondary" />
              <span className="text-sm font-semibold uppercase tracking-[0.25em]">Featured destination</span>
            </div>
            <h1 className="mt-4 text-4xl font-bold text-white sm:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
              {destination.name}
            </h1>
            <p className="mt-4 text-lg text-white/80">{destination.country}</p>
            <p className="mt-6 max-w-2xl text-lg text-white/70">{destination.description}</p>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-premium mx-auto grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-border bg-white p-8 shadow-sm dark:bg-navy-800 dark:border-white/10">
            <div className="flex items-center gap-2 text-secondary">
              <MapPin className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-[0.25em]">Highlights</span>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-text dark:text-white">Why travelers love {destination.name}</h2>
            <p className="mt-4 text-text-light dark:text-white/70">
              This destination blends comfort, culture, and unforgettable scenery into a premium travel experience.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {destination.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-gold-50 px-3 py-1 text-sm font-medium text-secondary dark:bg-gold-900/30">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-gradient-to-br from-secondary/10 to-primary/5 p-8 shadow-sm dark:border-white/10 dark:bg-navy-800">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-secondary">Starting from</p>
            <p className="mt-3 text-4xl font-bold text-text dark:text-white">${destination.priceFrom.toLocaleString()}</p>
            <p className="mt-3 text-text-light dark:text-white/70">Perfect for luxury getaways, private itineraries, and memorable experiences.</p>
            <Link href="/contact" className="mt-6 inline-flex items-center justify-center rounded-xl gradient-gold px-6 py-3 text-sm font-semibold text-white">
              Plan this trip
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
