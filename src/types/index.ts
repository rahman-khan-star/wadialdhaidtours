export interface Destination {
  id: string;
  name: string;
  country: string;
  description: string;
  image: string;
  rating: number;
  priceFrom: number;
  tags: string[];
}

export interface TourPackage {
  id: string;
  title: string;
  destination: string;
  description: string;
  image: string;
  duration: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  highlights: string[];
  included: string[];
  category: "dubai" | "pakistan" | "umrah" | "visa";
}

export interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  location: string;
  rating: number;
  text: string;
  package: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  author: string;
  date: string;
  category: string;
  slug: string;
}

export interface VisaService {
  id: string;
  country: string;
  flag: string;
  type: string;
  duration: string;
  price: number;
  processingTime: string;
  requirements: string[];
  // Optional so the static fallback dataset keeps type-checking; database rows
  // always carry both values.
  isActive?: boolean;
  displayOrder?: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface GalleryItem {
  id: string;
  image: string;
  title: string;
  destination: string;
}

export interface Statistic {
  label: string;
  value: string;
  suffix?: string;
}

export interface NavLink {
  label: string;
  href: string;
  children?: NavLink[];
}

export interface SearchResult {
  type: "destination" | "package" | "blog";
  title: string;
  description: string;
  image: string;
  href: string;
}

export interface TeamMember {
  id: string;
  name: string;
  designation: string;
  photo: string;
  phone: string;
  whatsapp: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
}

export interface Hotel {
  id: string;
  name: string;
  location: string;
  image: string;
  rating: number;
  price: number;
  amenities: string[];
}

export interface Booking {
  id: string;
  name: string;
  packageName: string;
  date: string;
  amount: number;
  status: "Confirmed" | "Pending";
}
