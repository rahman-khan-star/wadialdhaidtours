import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Star } from "lucide-react";
import { getPublicPackageById } from "@/lib/public-data";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TourPackageDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const pkg = await getPublicPackageById(slug);

  if (!pkg) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-navy-900">
        <div className="absolute inset-0">
          <Image
            src={pkg.image}
            alt={pkg.title}
            fill
            priority
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-950/90 via-navy-900/70 to-navy-800/50" />
        </div>

        <div className="relative z-10 container-premium mx-auto px-4 py-24 sm:py-32">
          <Link href="/tour-packages" className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to packages
          </Link>
          <div className="mt-8 max-w-3xl">
            <div className="flex items-center gap-2 text-secondary">
              <Star className="h-4 w-4 fill-secondary" />
              <span className="text-sm font-semibold uppercase tracking-[0.25em]">Signature package</span>
            </div>
            <h1 className="mt-4 text-4xl font-bold text-white sm:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
              {pkg.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-white/80">
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4" />{pkg.destination}</span>
              <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{pkg.duration}</span>
            </div>
            <p className="mt-6 max-w-2xl text-lg text-white/70">{pkg.description}</p>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-premium mx-auto grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-border bg-white p-8 shadow-sm dark:bg-navy-800 dark:border-white/10">
            <h2 className="text-2xl font-bold text-text dark:text-white">What is included</h2>
            <ul className="mt-6 space-y-3 text-text-light dark:text-white/70">
              {pkg.highlights.map((highlight) => (
                <li key={highlight} className="flex gap-2"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-secondary" />{highlight}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-border bg-gradient-to-br from-secondary/10 to-primary/5 p-8 shadow-sm dark:border-white/10 dark:bg-navy-800">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-secondary">From</p>
            <p className="mt-3 text-4xl font-bold text-text dark:text-white">{formatPrice(pkg.price)}</p>
            <p className="mt-4 text-text-light dark:text-white/70">Rated {pkg.rating}/5 by {pkg.reviewCount} travelers.</p>
            <div className="mt-6 space-y-3 text-sm text-text-light dark:text-white/70">
              {pkg.included.map((item) => (
                <div key={item} className="rounded-xl border border-border/70 bg-white/70 px-4 py-3 dark:bg-white/5">{item}</div>
              ))}
            </div>
            <Link href="/contact" className="mt-6 inline-flex items-center justify-center rounded-xl gradient-gold px-6 py-3 text-sm font-semibold text-white">
              Reserve this package
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
