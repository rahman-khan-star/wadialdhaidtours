import { getSupabaseServer } from "../src/lib/supabase-server";
import {
  destinations,
  tourPackages,
  testimonials,
  blogPosts,
  visaServices,
  faqs,
  galleryItems,
  statistics,
  teamMembers,
} from "../src/data";

const supabaseServer = getSupabaseServer();

// Hardcoded datasets from outside src/data/index.ts
const hotels = [
  { name: "Atlantis The Royal", location: "Dubai, UAE", image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80", rating: 4.9, price: 899, amenities: ["Spa", "Pool", "Restaurant", "Beach"] },
  { name: "Burj Al Arab", location: "Dubai, UAE", image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80", rating: 4.9, price: 1299, amenities: ["Spa", "Pool", "Restaurant", "Helipad"] },
  { name: "Shangrila Skardu", location: "Skardu, Pakistan", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80", rating: 4.7, price: 299, amenities: ["Lake View", "Restaurant", "Garden", "WiFi"] },
  { name: "Serena Islamabad", location: "Islamabad, Pakistan", image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80", rating: 4.8, price: 349, amenities: ["Pool", "Spa", "Restaurant", "Gym"] },
  { name: "Emirates Palace", location: "Abu Dhabi, UAE", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80", rating: 4.8, price: 799, amenities: ["Beach", "Pool", "Spa", "Restaurant"] },
  { name: "Pearl Continental", location: "Lahore, Pakistan", image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80", rating: 4.5, price: 199, amenities: ["Pool", "Gym", "Restaurant", "WiFi"] },
];

const aboutTeam = [
  { name: "James Mitchell", role: "Founder & CEO", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" },
  { name: "Sarah Al-Hassan", role: "Head of Operations", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80" },
  { name: "Ahmed Khan", role: "Travel Director", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80" },
  { name: "Fatima Rashid", role: "Customer Experience Lead", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80" },
];

function parseAmount(amount: string): number {
  return parseInt(amount.replace(/[$,]/g, ""), 10);
}

async function upsert(
  table: string,
  records: Record<string, unknown>[],
  conflictColumn: string
): Promise<number> {
  const { data, error } = await supabaseServer
    .from(table)
    .upsert(records, { onConflict: conflictColumn, count: "exact" });
  if (error) {
    console.error(`Error upserting into ${table}:`, error.message);
    return 0;
  }
  return (data as unknown[]).length;
}

async function seed() {
  let total = 0;

  // 1. Destinations
  const destCount = await upsert(
    "destinations",
    destinations.map((d) => ({
      name: d.name,
      country: d.country,
      description: d.description,
      image: d.image,
      rating: d.rating,
      price_from: d.priceFrom,
      tags: d.tags,
      slug: d.id,
    })),
    "slug"
  );
  total += destCount;
  console.log(`Destinations: ${destCount} upserted`);

  // 2. Tour Packages
  const pkgCount = await upsert(
    "tour_packages",
    tourPackages.map((p) => ({
      title: p.title,
      destination: p.destination,
      description: p.description,
      image: p.image,
      duration: p.duration,
      price: p.price,
      original_price: p.originalPrice ?? null,
      rating: p.rating,
      review_count: p.reviewCount,
      highlights: p.highlights,
      included: p.included,
      category: p.category,
    })),
    "title"
  );
  total += pkgCount;
  console.log(`Tour Packages: ${pkgCount} upserted`);

  // 3. Testimonials
  const testCount = await upsert(
    "testimonials",
    testimonials.map((t) => ({
      name: t.name,
      avatar: t.avatar,
      location: t.location,
      rating: t.rating,
      text: t.text,
      package: t.package,
    })),
    "name,text"
  );
  total += testCount;
  console.log(`Testimonials: ${testCount} upserted`);

  // 4. Blog Posts
  const blogCount = await upsert(
    "blog_posts",
    blogPosts.map((p) => ({
      title: p.title,
      excerpt: p.excerpt,
      image: p.image,
      author: p.author,
      date: p.date,
      category: p.category,
      slug: p.slug,
    })),
    "slug"
  );
  total += blogCount;
  console.log(`Blog Posts: ${blogCount} upserted`);

  // 5. Visa Services
  const visaCount = await upsert(
    "visa_services",
    visaServices.map((v) => ({
      country: v.country,
      flag: v.flag,
      type: v.type,
      duration: v.duration,
      price: v.price,
      processing_time: v.processingTime,
      requirements: v.requirements,
    })),
    "country,type"
  );
  total += visaCount;
  console.log(`Visa Services: ${visaCount} upserted`);

  // 6. FAQs
  const faqCount = await upsert(
    "faqs",
    faqs.map((f) => ({
      question: f.question,
      answer: f.answer,
    })),
    "question"
  );
  total += faqCount;
  console.log(`FAQs: ${faqCount} upserted`);

  // 7. Gallery Items
  const galleryCount = await upsert(
    "gallery_items",
    galleryItems.map((g) => ({
      image: g.image,
      title: g.title,
      destination: g.destination,
    })),
    "image,title"
  );
  total += galleryCount;
  console.log(`Gallery Items: ${galleryCount} upserted`);

  // 8. Statistics
  const statsCount = await upsert(
    "statistics",
    statistics.map((s) => ({
      label: s.label,
      value: s.value,
      suffix: s.suffix ?? null,
    })),
    "label"
  );
  total += statsCount;
  console.log(`Statistics: ${statsCount} upserted`);

  // 9. Team Members
  const teamCount = await upsert(
    "team_members",
    teamMembers.map((t) => ({
      name: t.name,
      designation: t.designation,
      photo: t.photo,
      phone: t.phone,
      whatsapp: t.whatsapp,
      description: t.description ?? null,
      is_active: t.isActive,
      display_order: t.displayOrder,
    })),
    "name"
  );
  total += teamCount;
  console.log(`Team Members: ${teamCount} upserted`);

  // 10. Settings (includes agencyContact data via whatsapp field)
  const settingsCount = await upsert(
    "settings",
    [{
      company_name: "Wadi Al Dhaid Tours LLC",
      email: "info@luxurytravel.com",
      phone: "+92 342 900 5290",
      whatsapp: "+971501234567",
      website: "https://luxurytravel.com",
      address: "Dubai, United Arab Emirates",
      currency: "USD",
      timezone: "Asia/Dubai",
    }],
    "company_name"
  );
  total += settingsCount;
  console.log(`Settings: ${settingsCount} upserted`);

  // 11. Hotels
  const hotelCount = await upsert(
    "hotels",
    hotels.map((h) => ({
      name: h.name,
      location: h.location,
      image: h.image,
      rating: h.rating,
      price: h.price,
      amenities: h.amenities,
    })),
    "name"
  );
  total += hotelCount;
  console.log(`Hotels: ${hotelCount} upserted`);

  // 12. About Team
  const aboutCount = await upsert(
    "about_team",
    aboutTeam.map((m) => ({
      name: m.name,
      role: m.role,
      image: m.image,
    })),
    "name"
  );
  total += aboutCount;
  console.log(`About Team: ${aboutCount} upserted`);

  // 13. Messages
  const messages = [
    { name: "Ahmed Khan", email: "ahmed@example.com", phone: "+92 300 1234567", subject: "Dubai Tour Inquiry", message: "Hi, I'm interested in the Luxury Dubai Experience package for a family of 4.", date: "2026-01-15", read: false },
    { name: "Sarah Ali", email: "sarah@example.com", phone: "+971 55 9876543", subject: "Umrah Package Question", message: "Available dates for Premium Umrah Package in February?", date: "2026-01-14", read: true },
    { name: "Omar Hassan", email: "omar@example.com", phone: "+44 7912 345678", subject: "Visa Service Request", message: "Need a UAE tourist visa for myself and my wife.", date: "2026-01-13", read: false },
  ];
  const msgCount = await upsert("messages", messages, "name,subject,date");
  total += msgCount;
  console.log(`Messages: ${msgCount} upserted`);

  // 14. Bookings
  const bookings = [
    { name: "Ahmed Khan", package_name: "Luxury Dubai Experience", date: "2026-01-15", amount: parseAmount("$2,499"), status: "Confirmed" },
    { name: "Sarah Ali", package_name: "Northern Pakistan Adventure", date: "2026-01-14", amount: parseAmount("$1,899"), status: "Pending" },
    { name: "Omar Hassan", package_name: "Premium Umrah Package", date: "2026-01-13", amount: parseAmount("$3,499"), status: "Confirmed" },
    { name: "Fatima Noor", package_name: "Dubai New Year Celebration", date: "2026-01-12", amount: parseAmount("$3,999"), status: "Confirmed" },
  ];
  const bookCount = await upsert("bookings", bookings, "name,package_name,date");
  total += bookCount;
  console.log(`Bookings: ${bookCount} upserted`);

  console.log(`\nTotal records upserted: ${total}`);
}

seed().catch(console.error);
