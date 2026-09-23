"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle,
} from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);

    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${fd.get("firstName") ?? ""} ${fd.get("lastName") ?? ""}`.trim(),
          email: fd.get("email") ?? "",
          phone: fd.get("phone") ?? "",
          subject: fd.get("subject") ?? "",
          message: fd.get("message") ?? "",
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Failed to send message");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative z-10 container-premium mx-auto px-4 text-center">
          <h1
            className="text-3xl sm:text-4xl font-bold text-white mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Get in <span className="text-sky-200">Touch</span>
          </h1>
          <p className="text-base text-white/80 max-w-xl mx-auto">
            Ready to plan your dream vacation? Our travel experts are here to
            help.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="container-premium mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                {submitted ? (
                  <div className="rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-lg border border-slate-100 dark:border-slate-700 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <CheckCircle className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                      Message Sent!
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      We&apos;ll get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}
                    className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg border border-slate-100 dark:border-slate-700"
                  >
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-5">
                      Send Us a Message
                    </h2>
                    {error && (
                      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400">
                        {error}
                      </div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          required
                          maxLength={100}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          required
                          maxLength={100}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                          placeholder="Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          required
                          maxLength={254}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          maxLength={50}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                          placeholder="+92 342 900 5290"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Subject
                        </label>
                        <input
                          type="text"
                          name="subject"
                          required
                          maxLength={300}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                          placeholder="Dubai Tour Package Inquiry"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Message
                        </label>
                        <textarea
                          rows={4}
                          name="message"
                          required
                          maxLength={5000}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none"
                          placeholder="Tell us about your travel plans..."
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={sending}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-sky-600 disabled:opacity-60"
                    >
                      <Send className="h-4 w-4" />
                      {sending ? "Sending..." : "Send Message"}
                    </button>
                  </form>
                )}
              </motion.div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {[
                {
                  icon: Phone,
                  label: "Phone",
                  value: "+92 342 900 5290",
                  href: "tel:+923429005290",
                },
                {
                  icon: Mail,
                  label: "Email",
                  value: "info@luxurytravel.com",
                  href: "mailto:info@luxurytravel.com",
                },
                {
                  icon: MapPin,
                  label: "Office",
                  value: "Dubai, United Arab Emirates",
                  href: "#",
                },
                {
                  icon: Clock,
                  label: "Hours",
                  value: "24/7 Support Available",
                  href: "#",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex items-start gap-3 rounded-xl bg-white dark:bg-slate-800 p-4 shadow-md border border-slate-100 dark:border-slate-700"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/50 shrink-0">
                    <item.icon className="h-5 w-5 text-sky-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-0.5">
                      {item.label}
                    </h3>
                    <a
                      href={item.href}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-sky-500"
                    >
                      {item.value}
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
