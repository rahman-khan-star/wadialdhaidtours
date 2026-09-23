"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import type { Testimonial } from "@/types";

const extraReviews = [
  {
    id: "extra-1",
    name: "Ahmed Hassan",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    location: "Abu Dhabi, UAE",
    rating: 5,
    text: "The Northern Pakistan tour was breathtaking. Every detail was perfectly arranged.",
    package: "Northern Adventure 7D",
  },
  {
    id: "extra-2",
    name: "Fatima Al Zahra",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    location: "Riyadh, Saudi Arabia",
    rating: 5,
    text: "Our Umrah journey was spiritually fulfilling. The guidance and care was exceptional.",
    package: "Umrah Premium 10D",
  },
  {
    id: "extra-3",
    name: "Omar Khan",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
    location: "Lahore, Pakistan",
    rating: 5,
    text: "Dubai luxury experience exceeded all expectations. Will book again!",
    package: "Luxury Dubai 5D",
  },
];

interface TestimonialsProps {
  testimonials: Testimonial[];
}

const allReviews = (testimonials: Testimonial[]) => [...testimonials, ...extraReviews];

export function Testimonials({ testimonials }: TestimonialsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const reviews = allReviews(testimonials);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-10 bg-slate-50 dark:bg-slate-800/50">
      <div className="container-premium mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex items-end justify-between"
        >
          <div>
            <span className="text-xs font-semibold text-sky-500 uppercase tracking-wider">
              Testimonials
            </span>
            <h2
              className="mt-1 text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              What Our Travelers Say
            </h2>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </motion.div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="flex-shrink-0 w-[300px] snap-start rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4"
            >
              <Quote className="h-6 w-6 text-sky-200 dark:text-sky-800 mb-2" />
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3 line-clamp-3">
                &ldquo;{review.text}&rdquo;
              </p>
              <div className="flex items-center gap-0.5 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-3 w-3 fill-orange-400 text-orange-400"
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Image
                  src={review.avatar}
                  alt={review.name}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-white">
                    {review.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {review.location}
                  </p>
                  <p className="text-[10px] text-sky-500 font-medium">
                    {review.package}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
