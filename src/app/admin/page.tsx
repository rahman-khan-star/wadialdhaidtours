"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Package,
  Star,
  MessageSquare,
  Eye,
} from "lucide-react";
import { destinations, tourPackages, testimonials, blogPosts } from "@/data";

const stats = [
  {
    label: "Total Destinations",
    value: destinations.length,
    icon: MapPin,
    color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    change: "+2 this month",
  },
  {
    label: "Tour Packages",
    value: tourPackages.length,
    icon: Package,
    color:
      "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
    change: "+1 this week",
  },
  {
    label: "Testimonials",
    value: testimonials.length,
    icon: Star,
    color:
      "bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400",
    change: "All verified",
  },
  {
    label: "Blog Posts",
    value: blogPosts.length,
    icon: MessageSquare,
    color:
      "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
    change: "3 published",
  },
];

const recentBookings = [
  {
    id: 1,
    name: "Ahmed Khan",
    package: "Luxury Dubai Experience",
    date: "2026-01-15",
    amount: "$2,499",
    status: "Confirmed",
  },
  {
    id: 2,
    name: "Sarah Ali",
    package: "Northern Pakistan Adventure",
    date: "2026-01-14",
    amount: "$1,899",
    status: "Pending",
  },
  {
    id: 3,
    name: "Omar Hassan",
    package: "Premium Umrah Package",
    date: "2026-01-13",
    amount: "$3,499",
    status: "Confirmed",
  },
  {
    id: 4,
    name: "Fatima Noor",
    package: "Dubai New Year Celebration",
    date: "2026-01-12",
    amount: "$3,999",
    status: "Confirmed",
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl bg-white p-5 luxury-shadow dark:bg-navy-800 dark:border dark:border-white/10"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="text-xs text-green-600 dark:text-green-400">
                {stat.change}
              </span>
            </div>
            <p
              className="text-2xl font-bold text-text dark:text-white"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {stat.value}
            </p>
            <p className="text-sm text-text-light dark:text-white/60">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 luxury-shadow dark:bg-navy-800 dark:border dark:border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text dark:text-white">
              Recent Bookings
            </h2>
            <button className="text-sm text-sky-500 hover:underline">
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border dark:border-white/10">
                  <th className="pb-3 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-white/10">
                {recentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="py-3">
                      <p className="text-sm font-medium text-text dark:text-white">
                        {booking.name}
                      </p>
                    </td>
                    <td className="py-3">
                      <p className="text-sm text-text-light dark:text-white/60">
                        {booking.package}
                      </p>
                    </td>
                    <td className="py-3">
                      <p
                        className="text-sm text-text-light dark:text-white/60"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {booking.date}
                      </p>
                    </td>
                    <td className="py-3">
                      <p
                        className="text-sm font-semibold text-sky-500"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {booking.amount}
                      </p>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          booking.status === "Confirmed"
                            ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-6 luxury-shadow dark:bg-navy-800 dark:border dark:border-white/10">
            <h2 className="text-lg font-bold text-text dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <a
                href="/admin/destinations"
                className="flex items-center gap-3 rounded-xl p-3 text-sm text-text-light hover:bg-sky-50 hover:text-text dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
              >
                <MapPin className="h-4 w-4 text-sky-500" />
                Add New Destination
              </a>
              <a
                href="/admin/packages"
                className="flex items-center gap-3 rounded-xl p-3 text-sm text-text-light hover:bg-sky-50 hover:text-text dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
              >
                <Package className="h-4 w-4 text-sky-500" />
                Create Tour Package
              </a>
              <a
                href="/admin/blog"
                className="flex items-center gap-3 rounded-xl p-3 text-sm text-text-light hover:bg-sky-50 hover:text-text dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
              >
                <MessageSquare className="h-4 w-4 text-sky-500" />
                Write Blog Post
              </a>
              <a
                href="/admin/messages"
                className="flex items-center gap-3 rounded-xl p-3 text-sm text-text-light hover:bg-sky-50 hover:text-text dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
              >
                <Eye className="h-4 w-4 text-sky-500" />
                View Messages
              </a>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 p-6">
            <h3 className="text-lg font-bold text-white mb-1">
              Website Performance
            </h3>
            <p className="text-white/80 text-sm mb-4">
              Your site is performing great!
            </p>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-white/80 mb-1">
                  <span>Lighthouse Score</span>
                  <span>96/100</span>
                </div>
                <div className="h-2 rounded-full bg-white/20">
                  <div className="h-2 w-[96%] rounded-full bg-white" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-white/80 mb-1">
                  <span>SEO Score</span>
                  <span>98/100</span>
                </div>
                <div className="h-2 rounded-full bg-white/20">
                  <div className="h-2 w-[98%] rounded-full bg-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
