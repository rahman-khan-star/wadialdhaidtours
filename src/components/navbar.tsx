"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";
import { navLinks } from "@/data";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Lock background page scrolling while the mobile menu is open; the menu's
  // own link list scrolls independently via its overflow container. The lock
  // lives on <html> because globals.css sets overflow-x there (body overflow
  // would not propagate to the viewport in that case).
  useEffect(() => {
    if (!mobileOpen) return;

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    // Crossing to the desktop breakpoint hides the menu (lg:hidden), so
    // release the lock instead of leaving the page unscrollable.
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const handleDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileOpen(false);
    };
    desktopQuery.addEventListener("change", handleDesktop);

    return () => {
      root.style.overflow = previousOverflow;
      desktopQuery.removeEventListener("change", handleDesktop);
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          isScrolled
            ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 shadow-sm"
            : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md"
        )}
      >
        <div className="container-premium mx-auto flex items-center justify-between px-4 py-2.5">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <Image src="/logo travel 2-01.png" alt="WADI AL DHAID TOURS" width={32} height={32} className="shrink-0 object-contain" />
            <div className="flex min-w-0 flex-col">
              <span className="text-xs sm:text-sm font-bold leading-tight text-slate-800 dark:text-white tracking-tight truncate">
                WADI AL DHAID TOURS
              </span>
              <span className="text-[8px] font-medium uppercase tracking-[0.15em] text-sky-500 truncate">
                Premium Experiences
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() =>
                  link.children && setOpenDropdown(link.label)
                }
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  href={link.href}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {link.label}
                  {link.children && (
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  )}
                </Link>

                <AnimatePresence>
                  {link.children && openDropdown === link.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full z-50 mt-1 w-48 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl p-1.5"
                    >
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300 transition-colors hover:bg-sky-50 dark:hover:bg-slate-700 hover:text-sky-500"
                          onClick={() => setOpenDropdown(null)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            )}

            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
            >
              Admin
            </Link>

            <Link
              href="/contact"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-white transition-all duration-300 hover:bg-sky-600"
            >
              Book Now
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden absolute inset-x-0 top-full bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="container-premium mx-auto min-h-[calc(100dvh_-_3.25rem)] max-h-[calc(100dvh_-_3.25rem)] overflow-y-auto overscroll-contain px-4 pt-3 pb-[max(0.75rem,_env(safe-area-inset-bottom))]">
                {navLinks.map((link) => (
                  <div key={link.label}>
                    <Link
                      href={link.href}
                      className="block py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                    {link.children?.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block py-2 pl-4 text-xs text-slate-500 dark:text-slate-400"
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ))}
                <Link
                  href="/contact"
                  className="mt-3 block w-full btn-primary text-center text-sm"
                  onClick={() => setMobileOpen(false)}
                >
                  Book Now
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
