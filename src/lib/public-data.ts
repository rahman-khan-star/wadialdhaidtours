import {
  blogPosts as staticBlogPosts,
  destinations as staticDestinations,
  teamMembers as staticTeamMembers,
  testimonials as staticTestimonials,
  tourPackages as staticTourPackages,
} from "@/data";
import type { BlogPost, Destination, Hotel, TeamMember, Testimonial, TourPackage } from "@/types";
import { getAllBlogPosts, getBlogPostById } from "@/lib/blog-service";
import { getAllDestinations, getDestinationById } from "@/lib/destination-service";
import { getAllHotels } from "@/lib/hotel-service";
import { getAllMembers } from "@/lib/team-service";
import { getAllTestimonials } from "@/lib/testimonial-service";
import { getAllPackages, getPackageById } from "@/lib/tour-package-service";
import { getAllAboutTeam } from "@/lib/about-team-service";

export type AboutTeamMember = { id: string; name: string; role: string; image: string };

const staticHotels: Hotel[] = [
  {
    id: "atlantis-the-royal",
    name: "Atlantis The Royal",
    location: "Dubai, UAE",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
    rating: 4.9,
    price: 899,
    amenities: ["Spa", "Pool", "Restaurant", "Beach"],
  },
  {
    id: "burj-al-arab",
    name: "Burj Al Arab",
    location: "Dubai, UAE",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    rating: 4.9,
    price: 1299,
    amenities: ["Spa", "Pool", "Restaurant", "Helipad"],
  },
  {
    id: "shangrila-skardu",
    name: "Shangrila Skardu",
    location: "Skardu, Pakistan",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    rating: 4.7,
    price: 299,
    amenities: ["Lake View", "Restaurant", "Garden", "WiFi"],
  },
  {
    id: "serena-islamabad",
    name: "Serena Islamabad",
    location: "Islamabad, Pakistan",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
    rating: 4.8,
    price: 349,
    amenities: ["Pool", "Spa", "Restaurant", "Gym"],
  },
  {
    id: "emirates-palace",
    name: "Emirates Palace",
    location: "Abu Dhabi, UAE",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
    rating: 4.8,
    price: 799,
    amenities: ["Beach", "Pool", "Spa", "Restaurant"],
  },
  {
    id: "pearl-continental",
    name: "Pearl Continental",
    location: "Lahore, Pakistan",
    image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
    rating: 4.5,
    price: 199,
    amenities: ["Pool", "Gym", "Restaurant", "WiFi"],
  },
];

const staticAboutTeam: AboutTeamMember[] = [
  {
    id: "about-james",
    name: "James Mitchell",
    role: "Founder & CEO",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  },
  {
    id: "about-sarah",
    name: "Sarah Al-Hassan",
    role: "Head of Operations",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
  },
  {
    id: "about-ahmed",
    name: "Ahmed Khan",
    role: "Travel Director",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
  },
  {
    id: "about-fatima",
    name: "Fatima Rashid",
    role: "Customer Experience Lead",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
  },
];

async function withFallback<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load();
  } catch (error) {
    console.error("Public Supabase fetch failed, using static fallback:", error);
    return fallback;
  }
}

export async function getPublicDestinations(): Promise<Destination[]> {
  return withFallback(getAllDestinations, staticDestinations);
}

export async function getPublicDestinationById(id: string): Promise<Destination | null> {
  try {
    const destination = await getDestinationById(id);
    if (destination) return destination;
    // DB rows use UUID keys while public URLs/sitemaps use slug-style ids;
    // fall back to the static dataset when the DB has no match.
    return staticDestinations.find((item) => item.id === id) ?? null;
  } catch (error) {
    console.error("Public destination fetch failed, using static fallback:", error);
    return staticDestinations.find((item) => item.id === id) ?? null;
  }
}

export async function getPublicPackages(): Promise<TourPackage[]> {
  return withFallback(getAllPackages, staticTourPackages);
}

export async function getPublicPackageById(id: string): Promise<TourPackage | null> {
  try {
    const pkg = await getPackageById(id);
    if (pkg) return pkg;
    // Static/sitemap package ids (e.g. "luxury-dubai-5d") may not match
    // DB UUID keys; fall back to the static dataset when there is no match.
    return staticTourPackages.find((item) => item.id === id) ?? null;
  } catch (error) {
    console.error("Public package fetch failed, using static fallback:", error);
    return staticTourPackages.find((item) => item.id === id) ?? null;
  }
}

export async function getPublicTestimonials(): Promise<Testimonial[]> {
  return withFallback(getAllTestimonials, staticTestimonials);
}

export async function getPublicTeamMembers(): Promise<TeamMember[]> {
  const members = await withFallback(getAllMembers, staticTeamMembers);
  return members
    .filter((member) => member.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function getPublicBlogPosts(): Promise<BlogPost[]> {
  return withFallback(getAllBlogPosts, staticBlogPosts);
}

export async function getPublicBlogPostById(id: string): Promise<BlogPost | null> {
  try {
    return await getBlogPostById(id);
  } catch (error) {
    console.error("Public blog post fetch failed, using static fallback:", error);
    return staticBlogPosts.find((post) => post.id === id) ?? null;
  }
}

export async function getPublicBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const posts = await getAllBlogPosts();
    return posts.find((post) => post.slug === slug) ?? null;
  } catch (error) {
    console.error("Public blog post fetch failed, using static fallback:", error);
    return staticBlogPosts.find((post) => post.slug === slug) ?? null;
  }
}

export async function getPublicHotels(): Promise<Hotel[]> {
  return withFallback(getAllHotels, staticHotels);
}

export async function getPublicAboutTeam(): Promise<AboutTeamMember[]> {
  return withFallback(getAllAboutTeam, staticAboutTeam);
}
