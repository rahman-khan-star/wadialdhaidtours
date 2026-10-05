"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  LayoutGrid,
  MapPin,
  Package,
  MessageSquare,
  FileText,
  Star,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Bell,
  Home,
  Users,
  ClipboardList,
  ScrollText,
  History,
  Database,
  FileCheck,
} from "lucide-react";

const sidebarLinks = [
  { label: "Dashboard", href: "/admin", icon: LayoutGrid },
  { label: "Destinations", href: "/admin/destinations", icon: MapPin },
  { label: "Tour Packages", href: "/admin/packages", icon: Package },
  { label: "Hotels", href: "/admin/hotels", icon: MapPin },
  { label: "Visa Services", href: "/admin/visa-services", icon: FileCheck },
  { label: "Bookings", href: "/admin/bookings", icon: ClipboardList },
  { label: "Team Members", href: "/admin/team", icon: Users },
  { label: "Testimonials", href: "/admin/testimonials", icon: Star },
  { label: "Blog Posts", href: "/admin/blog", icon: FileText },
  { label: "Messages", href: "/admin/messages", icon: MessageSquare },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Activity Logs", href: "/admin/activity", icon: ScrollText },
  { label: "Login History", href: "/admin/login-history", icon: History },
  { label: "Backup & Restore", href: "/admin/backup", icon: Database },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    // Verify auth via API cookie
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setIsLoggedIn(true);
        } else if (pathname !== "/admin/login") {
          router.push("/admin/login");
        }
      })
      .catch(() => {
        if (pathname !== "/admin/login") {
          router.push("/admin/login");
        }
      });

    return () => window.clearTimeout(timer);
  }, [pathname, router]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500 mx-auto mb-3">
            <span className="text-sm font-bold text-white">WA</span>
          </div>
          <p className="text-sm text-text-light dark:text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("admin_auth");
    localStorage.removeItem("admin_user");
    router.push("/admin/login");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-border bg-white dark:bg-navy-900 dark:border-white/10 transition-all duration-300 ${
          sidebarOpen ? "w-56" : "w-16"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-border dark:border-white/10">
          {sidebarOpen && (
            <Link href="/admin" className="flex items-center gap-2">
              <Image src="/logo travel 2-01.png" alt="WADI AL DHAID TOURS" width={36} height={36} className="shrink-0 object-contain" />
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-tight text-text dark:text-white tracking-tight">
                  WADI AL DHAID TOURS
                </span>
                <span className="text-[8px] font-medium uppercase tracking-[0.15em] text-sky-500">
                  Premium Experiences
                </span>
              </div>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <ChevronLeft
              className={`h-3.5 w-3.5 text-slate-500 dark:text-white/60 transition-transform ${
                !sidebarOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/admin" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-500"
                    : "text-text-light hover:bg-sky-50 hover:text-text dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                }`}
                title={!sidebarOpen ? link.label : undefined}
              >
                <link.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-border dark:border-white/10">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-light hover:bg-sky-50 hover:text-text dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white transition-all"
          >
            <Home className="h-5 w-5" />
            {sidebarOpen && <span>View Website</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-navy-900 border-r border-border dark:border-white/10 lg:hidden"
            >
              <div className="flex items-center justify-between px-4 py-5 border-b border-border dark:border-white/10">
                <Link href="/admin" className="flex items-center gap-2">
                  <Image src="/logo travel 2-01.png" alt="WADI AL DHAID TOURS" width={36} height={36} className="shrink-0 object-contain" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold leading-tight text-text dark:text-white tracking-tight">
                      WADI AL DHAID TOURS
                    </span>
                    <span className="text-[8px] font-medium uppercase tracking-[0.15em] text-sky-500">
                      Premium Experiences
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="px-3 py-4 space-y-1">
                {sidebarLinks.map((link) => {
                  const isActive =
                    pathname === link.href ||
                    (link.href !== "/admin" &&
                      pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-500"
                          : "text-text-light hover:bg-sky-50 hover:text-text dark:text-white/60 dark:hover:bg-white/10"
                      }`}
                    >
                      <link.icon className="h-5 w-5" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden ml-1">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-border bg-white dark:bg-navy-900 dark:border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg hover:bg-sky-50 dark:hover:bg-white/10"
            >
              <Menu className="h-5 w-5 text-text dark:text-white" />
            </button>
            <h1 className="text-lg font-bold text-text dark:text-white">
              {sidebarLinks.find(
                (l) =>
                  l.href === pathname ||
                  (l.href !== "/admin" && pathname.startsWith(l.href))
              )?.label || "Admin"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-sky-50 dark:hover:bg-white/10">
              <Bell className="h-5 w-5 text-text-light dark:text-white/60" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-sky-500" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-white text-xs font-bold">
                A
              </div>
              <span className="hidden sm:block text-sm font-medium text-text dark:text-white">
                Admin
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-background dark:bg-navy-950">
          {children}
        </main>
      </div>
    </div>
  );
}
