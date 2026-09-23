"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Phone,
  Mail,
  MapPin,
  Globe,
  MessageCircle,
  Hash,
  Play,
} from "lucide-react";

const footerLinks = {
  company: [
    { label: "About Us", href: "/about" },
    { label: "Our Team", href: "/#team" },
    { label: "Blog", href: "/blog" },
  ],
  destinations: [
    { label: "Dubai", href: "/destinations/dubai" },
    { label: "Northern Pakistan", href: "/destinations/northern-pakistan" },
    { label: "Lahore", href: "/destinations/lahore" },
    { label: "Islamabad", href: "/destinations/islamabad" },
  ],
  services: [
    { label: "Tour Packages", href: "/tour-packages" },
    { label: "Visa Services", href: "/visa-services" },
    { label: "Umrah Packages", href: "/umrah-packages" },
    { label: "Hotels", href: "/hotels" },
  ],
  support: [
    { label: "Contact Us", href: "/contact" },
    { label: "FAQs", href: "/#faq" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms & Conditions", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="container-premium mx-auto px-4 pt-16 pb-8">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <Image src="/logo travel 2-01.png" alt="WADI AL DHAID TOURS" width={40} height={40} className="object-contain" />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white leading-tight">
                  WADI AL DHAID TOURS
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-sky-400">
                  Premium Experiences
                </span>
              </div>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-sm">
              Creating extraordinary travel experiences since 2014. We
              specialize in luxury tours, visa services, and Umrah packages
              across Dubai, Pakistan, and worldwide destinations.
            </p>
            <div className="flex items-center gap-3 mb-6">
              <a
                href="#"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400 transition-all hover:bg-sky-500 hover:text-white"
              >
                <Globe className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400 transition-all hover:bg-orange-500 hover:text-white"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400 transition-all hover:bg-sky-500 hover:text-white"
              >
                <Hash className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400 transition-all hover:bg-red-500 hover:text-white"
              >
                <Play className="h-4 w-4" />
              </a>
            </div>
            <div className="space-y-3 text-sm text-slate-400">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-sky-400" />
                +92 342 900 5290
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-sky-400" />
                info@luxurytravel.com
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-sky-400" />
                Dubai, United Arab Emirates
              </div>
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-sky-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} Wadi Al Dhaid Tours LLC. All rights
              reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
