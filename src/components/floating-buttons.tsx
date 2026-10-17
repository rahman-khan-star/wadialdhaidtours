"use client";

import { motion } from "framer-motion";
import { Phone, MessageCircle } from "lucide-react";
import { agencyContact } from "@/data";

export function FloatingButtons() {
  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 flex flex-col items-center gap-2 sm:bottom-6 sm:right-6 sm:gap-3">
      <motion.a
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
        href={`tel:${agencyContact.phone}`}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg shadow-sky-500/30 transition-all duration-300 hover:bg-sky-600 hover:scale-110 sm:h-12 sm:w-12"
        title="Call us"
      >
        <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
      </motion.a>

      <motion.a
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 20 }}
        href={`https://wa.me/${agencyContact.whatsapp.replace(/[^0-9]/g, "")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:bg-emerald-600 hover:scale-110 sm:h-12 sm:w-12"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
      </motion.a>
    </div>
  );
}
