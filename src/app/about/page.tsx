import type { Metadata } from "next";
import Image from "next/image";
import { Globe, Heart, Shield, Target } from "lucide-react";
import { getPublicAboutTeam } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Wadi Al Dhaid Tours LLC — a premier travel agency crafting extraordinary experiences across Dubai, Pakistan, and worldwide destinations.",
};

const values = [
  {
    icon: Heart,
    title: "Passion for Excellence",
    description:
      "Every detail matters. We obsess over perfection to deliver experiences that exceed expectations.",
  },
  {
    icon: Shield,
    title: "Trust & Integrity",
    description:
      "Transparent pricing, honest advice, and unwavering commitment to our travelers' best interests.",
  },
  {
    icon: Globe,
    title: "Global Perspective",
    description:
      "Deep local knowledge combined with international standards of luxury and service.",
  },
  {
    icon: Target,
    title: "Client-Centric",
    description:
      "Your vision drives everything we do. Each journey is crafted around your unique desires.",
  },
];

export default async function AboutPage() {
  const displayedTeam = await getPublicAboutTeam();
  return (
    <>
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative z-10 container-premium mx-auto px-4 text-center">
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            About <span className="text-gradient-gold">Wadi Al Dhaid Tours</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Crafting extraordinary journeys since 2014. We believe travel
            should be transformative, luxurious, and deeply personal.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-premium mx-auto">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <span className="text-sm font-semibold text-secondary uppercase tracking-wider">
                Our Story
              </span>
              <h2
                className="mt-2 text-3xl sm:text-4xl font-bold text-text dark:text-white"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                A Decade of Extraordinary Travel
              </h2>
              <p className="mt-4 text-text-light dark:text-white/60 leading-relaxed">
                Founded in 2014, Luxury Travel began with a simple vision: to
                redefine how people experience the world. What started as a
                boutique travel consultancy in Dubai has grown into an
                award-winning agency serving discerning travelers across the
                globe.
              </p>
              <p className="mt-4 text-text-light dark:text-white/60 leading-relaxed">
                Our deep roots in both Dubai and Pakistan give us unique
                access to experiences that others simply cannot offer. From
                private desert camps under starlit skies to exclusive
                helicopter tours over the Himalayas, we craft journeys that
                become lifelong memories.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-6">
                {
                  [
                    { label: "Years", value: "12+" },
                    { label: "Travelers", value: "15K+" },
                    { label: "Countries", value: "50+" },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p
                        className="text-3xl font-bold text-secondary"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {stat.value}
                      </p>
                      <p className="text-sm text-text-light dark:text-white/60">
                        {stat.label}
                      </p>
                    </div>
                  ))
                }
              </div>
            </div>
            <div className="relative h-[500px] rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80"
                alt="Wadi Al Dhaid Tours Story"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-navy-50 dark:bg-navy-950">
        <div className="container-premium mx-auto">
          <div className="mb-12 text-center">
            <span className="text-sm font-semibold text-secondary uppercase tracking-wider">
              Values
            </span>
            <h2
              className="mt-2 text-3xl sm:text-4xl font-bold text-text dark:text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              What We Stand For
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div
                key={value.title}
                className="premium-card text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-50 dark:bg-gold-900/20">
                  <value.icon className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-lg font-bold text-text dark-text-white mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-text-light dark:text-white/60 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-premium mx-auto">
          <div className="mb-12 text-center">
            <span className="text-sm font-semibold text-secondary uppercase tracking-wider">
              Team
            </span>
            <h2
              className="mt-2 text-3xl sm:text-4xl font-bold text-text dark:text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Meet Our Experts
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {displayedTeam.map((member) => (
              <div
                key={member.id ?? member.name}
                className="premium-card text-center group"
              >
                <div className="relative mx-auto mb-4 h-32 w-32 overflow-hidden rounded-full">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-lg font-bold text-text dark:text-white">
                  {member.name}
                </h3>
                <p className="text-sm text-secondary">{member.role}</p>
              </div>
            ))}
            {displayedTeam.length === 0 && (
              <p className="col-span-full text-center text-text-light dark:text-white/60">
                Team members will appear here soon.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}