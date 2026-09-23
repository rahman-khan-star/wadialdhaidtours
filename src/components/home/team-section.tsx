"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Phone, MessageCircle } from "lucide-react";
import type { TeamMember } from "@/types";

function TeamCard({ member, index }: { member: TeamMember; index: number }) {
  const isLeader = member.designation.toLowerCase().includes("ceo") || member.designation.toLowerCase().includes("founder");

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={`group relative rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-lg ${
        isLeader ? "ring-2 ring-sky-500/30" : ""
      }`}
    >
      {isLeader && (
        <div className="absolute top-2 right-2 z-10 rounded-full bg-sky-500 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
          CEO
        </div>
      )}

      <div className="relative aspect-square overflow-hidden">
        <Image
          src={member.photo}
          alt={member.name}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          style={{ willChange: "transform" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      <div className="p-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">
          {member.name}
        </h3>
        <p className="text-[10px] font-medium text-sky-500 uppercase tracking-wider mt-0.5">
          {member.designation}
        </p>

        <div className="flex items-center gap-1.5 mt-2.5">
          <a
            href={`tel:${member.phone}`}
            className="flex items-center justify-center gap-1 flex-1 rounded-lg bg-sky-500 px-2 py-1.5 text-[10px] font-semibold text-white transition-all duration-300 hover:bg-sky-600"
          >
            <Phone className="h-3 w-3" />
            Call
          </a>
          <a
            href={`https://wa.me/${member.whatsapp.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 flex-1 rounded-lg bg-emerald-500 px-2 py-1.5 text-[10px] font-semibold text-white transition-all duration-300 hover:bg-emerald-600"
          >
            <MessageCircle className="h-3 w-3" />
            WhatsApp
          </a>
        </div>
      </div>
    </motion.div>
  );
}

interface TeamSectionProps {
  members: TeamMember[];
}

export function TeamSection({ members }: TeamSectionProps) {
  const activeMembers = members
    .filter((m) => m.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  if (activeMembers.length === 0) return null;

  return (
    <section id="team" className="section-padding bg-white dark:bg-slate-900">
      <div className="container-premium mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <span className="text-sm font-semibold text-sky-500 uppercase tracking-wider">
            Our Team
          </span>
          <h2
            className="mt-2 text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Meet the Experts Behind Your Journey
          </h2>
          <p className="mt-3 mx-auto max-w-2xl text-slate-600 dark:text-slate-300">
            Dedicated professionals committed to crafting extraordinary travel experiences tailored just for you.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {activeMembers.map((member, i) => (
            <TeamCard key={member.id} member={member} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
