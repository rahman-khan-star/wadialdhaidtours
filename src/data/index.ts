import type {
  Destination,
  TourPackage,
  Testimonial,
  BlogPost,
  VisaService,
  FAQ,
  GalleryItem,
  Statistic,
  NavLink,
  TeamMember,
} from "@/types";

export const navLinks: NavLink[] = [
  { label: "Home", href: "/" },
  {
    label: "Destinations",
    href: "/destinations",
    children: [
      { label: "Dubai", href: "/destinations/dubai" },
      { label: "Northern Pakistan", href: "/destinations/northern-pakistan" },
      { label: "All Destinations", href: "/destinations" },
    ],
  },
  {
    label: "Tour Packages",
    href: "/tour-packages",
    children: [
      { label: "Dubai Tours", href: "/tour-packages/luxury-dubai-5d" },
      { label: "Pakistan Tours", href: "/tour-packages/pakistan-heritage-6d" },
      { label: "All Packages", href: "/tour-packages" },
    ],
  },
  { label: "Visa Services", href: "/visa-services" },
  { label: "Umrah Packages", href: "/umrah-packages" },
  { label: "Hotels", href: "/hotels" },
  { label: "Flights", href: "/flights" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
  { label: "Our Team", href: "/#team" },
];

export const destinations: Destination[] = [
  {
    id: "dubai",
    name: "Dubai",
    country: "UAE",
    description:
      "Experience the pinnacle of luxury in Dubai, where futuristic skyline meets Arabian heritage. From the Burj Khalifa to pristine beaches, every moment is extraordinary.",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
    rating: 4.9,
    priceFrom: 1299,
    tags: ["luxury", "shopping", "nightlife", "beach"],
  },
  {
    id: "islamabad",
    name: "Islamabad",
    country: "Pakistan",
    description:
      "Discover the serene beauty of Pakistan's capital, nestled against the Margalla Hills. A perfect blend of modern architecture and natural splendor.",
    image: "https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?w=800&q=80",
    rating: 4.7,
    priceFrom: 899,
    tags: ["nature", "culture", "mountains", "heritage"],
  },
  {
    id: "northern-pakistan",
    name: "Northern Pakistan",
    country: "Pakistan",
    description:
      "Explore the breathtaking valleys of Hunza, Skardu, and Swat. Home to some of the world's highest peaks and most stunning landscapes.",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    rating: 4.8,
    priceFrom: 1099,
    tags: ["adventure", "mountains", "trekking", "scenic"],
  },
  {
    id: "lahore",
    name: "Lahore",
    country: "Pakistan",
    description:
      "The cultural heart of Pakistan, Lahore mesmerizes with its Mughal architecture, vibrant bazaars, and legendary food streets.",
    image: "https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800&q=80",
    rating: 4.6,
    priceFrom: 699,
    tags: ["heritage", "food", "culture", "history"],
  },
];

export const tourPackages: TourPackage[] = [
  {
    id: "luxury-dubai-5d",
    title: "Luxury Dubai Experience",
    destination: "Dubai",
    description:
      "An indulgent 5-day journey through Dubai's most exclusive experiences, from private yacht dinners to desert safari adventures.",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
    duration: "5 Days / 4 Nights",
    price: 2499,
    originalPrice: 3199,
    rating: 4.9,
    reviewCount: 234,
    highlights: [
      "Private yacht dinner cruise",
      "Burj Khalifa VIP access",
      "Desert safari with BBQ dinner",
      "Gold Souk & Spice Souk tour",
      "Luxury spa treatment",
    ],
    included: [
      "5-star hotel accommodation",
      "All transfers in luxury vehicle",
      "Daily breakfast & 2 dinners",
      "Professional English guide",
      "All entrance fees",
    ],
    category: "dubai",
  },
  {
    id: "northern-adventure-7d",
    title: "Northern Pakistan Adventure",
    destination: "Northern Pakistan",
    description:
      "Discover the majestic valleys of Hunza and Skardu on this unforgettable 7-day adventure through Pakistan's most stunning landscapes.",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    duration: "7 Days / 6 Nights",
    price: 1899,
    originalPrice: 2399,
    rating: 4.8,
    reviewCount: 189,
    highlights: [
      "Attabad Lake boat ride",
      "Baltit Fort guided tour",
      "Deosai Plains safari",
      "Skardu Shangrila Resort",
      "Local cultural immersion",
    ],
    included: [
      "Hotel accommodation",
      "4x4 transport throughout",
      "All meals included",
      "Professional guide",
      "All permits & fees",
    ],
    category: "pakistan",
  },
  {
    id: "umrah-premium-10d",
    title: "Premium Umrah Package",
    destination: "Makkah & Madinah",
    description:
      "A spiritually enriching 10-day Umrah journey with premium accommodations steps from the Haram, guided rituals, and complete peace of mind.",
    image: "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80",
    duration: "10 Days / 9 Nights",
    price: 3499,
    rating: 4.9,
    reviewCount: 412,
    highlights: [
      "5-star hotel near Haram",
      "Guided Ziyarat tours",
      "VIP transportation",
      "Visa processing included",
      "24/7 religious guidance",
    ],
    included: [
      "Premium hotel accommodation",
      "All ground transportation",
      "Full board meals",
      "Licensed guide",
      "Visa & insurance",
    ],
    category: "umrah",
  },
  {
    id: "dubai-new-year-4d",
    title: "Dubai New Year Celebration",
    destination: "Dubai",
    description:
      "Ring in the New Year with the world's most spectacular fireworks display and exclusive Dubai celebrations.",
    image: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800&q=80",
    duration: "4 Days / 3 Nights",
    price: 3999,
    originalPrice: 4999,
    rating: 4.9,
    reviewCount: 156,
    highlights: [
      "Burj Khalifa fireworks view",
      "Gala dinner at Atlantis",
      "Dubai Mall VIP shopping",
      "Beach club access",
      "Luxury transfers",
    ],
    included: [
      "5-star hotel with Burj view",
      "All transfers",
      "Breakfast & gala dinner",
      "Event tickets",
      "Dedicated concierge",
    ],
    category: "dubai",
  },
  {
    id: "pakistan-heritage-6d",
    title: "Pakistan Heritage Trail",
    destination: "Lahore & Islamabad",
    description:
      "Journey through Pakistan's rich Mughal heritage, from Lahore's magnificent forts to Islamabad's modern elegance.",
    image: "https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800&q=80",
    duration: "6 Days / 5 Nights",
    price: 1299,
    originalPrice: 1699,
    rating: 4.7,
    reviewCount: 98,
    highlights: [
      "Lahore Fort & Badshahi Mosque",
      "Wagah Border ceremony",
      "Faisal Mosque visit",
      "Food street tour",
      "Shalimar Gardens",
    ],
    included: [
      "4-star hotel accommodation",
      "AC transport",
      "Daily breakfast & dinner",
      "Expert heritage guide",
      "Entrance fees",
    ],
    category: "pakistan",
  },
  {
    id: "dubai-safari-3d",
    title: "Desert Safari Exclusive",
    destination: "Dubai",
    description:
      "An exclusive 3-day desert experience with private camping, falconry, and stargazing in the Arabian dunes.",
    image: "https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=800&q=80",
    duration: "3 Days / 2 Nights",
    price: 1799,
    rating: 4.8,
    reviewCount: 167,
    highlights: [
      "Private luxury desert camp",
      "Falconry experience",
      "Stargazing with astronomer",
      "Dune bashing in Range Rover",
      "Traditional Bedouin dinner",
    ],
    included: [
      "Luxury desert camp",
      "All desert activities",
      "Full board dining",
      "4x4 transfers",
      "Professional camp staff",
    ],
    category: "dubai",
  },
];

export const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Sarah Al Maktoum",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
    location: "Dubai, UAE",
    rating: 5,
    text: "An absolutely extraordinary experience. The attention to detail was incredible — from the private yacht dinner to the desert camp. This is luxury travel done right.",
    package: "Luxury Dubai Experience",
  },
  {
    id: "2",
    name: "Ahmed Khan",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    location: "London, UK",
    rating: 5,
    text: "The Northern Pakistan tour exceeded all expectations. The valleys were breathtaking, and the team handled everything perfectly. I'll definitely be booking again.",
    package: "Northern Pakistan Adventure",
  },
  {
    id: "3",
    name: "Fatima Hassan",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    location: "Karachi, Pakistan",
    rating: 5,
    text: "Our Umrah journey was seamless and deeply spiritual. The premium accommodations and knowledgeable guide made this sacred trip truly memorable for our family.",
    package: "Premium Umrah Package",
  },
  {
    id: "4",
    name: "Omar Patel",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
    location: "Toronto, Canada",
    rating: 5,
    text: "From the moment we landed to the final farewell, everything was impeccable. The VIP treatment at Burj Khalifa and the gala dinner were highlights we'll never forget.",
    package: "Dubai New Year Celebration",
  },
];

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Top 10 Luxury Experiences in Dubai You Can't Miss",
    excerpt:
      "From private island dinners to helicopter tours over the Palm, discover the most exclusive experiences Dubai has to offer.",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
    author: "Travel Experts",
    date: "2026-01-15",
    category: "Dubai",
    slug: "top-10-luxury-experiences-dubai",
  },
  {
    id: "2",
    title: "Discovering the Hidden Gems of Northern Pakistan",
    excerpt:
      "Beyond the famous valleys lie secret waterfalls, ancient villages, and untouched trails waiting to be explored.",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    author: "Adventure Guide",
    date: "2026-01-10",
    category: "Pakistan",
    slug: "hidden-gems-northern-pakistan",
  },
  {
    id: "3",
    title: "A Complete Guide to Planning Your Umrah Journey",
    excerpt:
      "Everything you need to know about preparing for a meaningful Umrah pilgrimage, from visa to spiritual preparation.",
    image: "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80",
    author: "Religious Advisor",
    date: "2026-01-05",
    category: "Umrah",
    slug: "complete-guide-umrah-journey",
  },
  {
    id: "4",
    title: "Why Dubai is the Ultimate Luxury Travel Destination",
    excerpt:
      "With world-class hotels, Michelin-star dining, and unparalleled experiences, Dubai redefines luxury travel.",
    image: "https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=800&q=80",
    author: "Travel Experts",
    date: "2025-12-28",
    category: "Dubai",
    slug: "why-dubai-ultimate-luxury-destination",
  },
];

export const visaServices: VisaService[] = [
  {
    id: "uae-tourist",
    country: "United Arab Emirates",
    flag: "🇦🇪",
    type: "Tourist Visa",
    duration: "30 Days",
    price: 150,
    processingTime: "3-5 Business Days",
    requirements: [
      "Valid passport (6+ months)",
      "Passport-size photographs",
      "Hotel booking confirmation",
      "Return flight ticket",
      "Bank statement (last 3 months)",
    ],
  },
  {
    id: "uae-business",
    country: "United Arab Emirates",
    flag: "🇦🇪",
    type: "Business Visa",
    duration: "90 Days",
    price: 350,
    processingTime: "5-7 Business Days",
    requirements: [
      "Valid passport (6+ months)",
      "Invitation letter from UAE company",
      "Company registration documents",
      "Bank statement (last 3 months)",
      "Travel insurance",
    ],
  },
  {
    id: "pakistan-tourist",
    country: "Pakistan",
    flag: "🇵🇰",
    type: "Tourist Visa",
    duration: "30 Days",
    price: 100,
    processingTime: "5-10 Business Days",
    requirements: [
      "Valid passport (6+ months)",
      "Passport-size photographs",
      "Hotel booking confirmation",
      "Return flight ticket",
      "No objection certificate",
    ],
  },
  {
    id: "saudi-umrah",
    country: "Saudi Arabia",
    flag: "🇸🇦",
    type: "Umrah Visa",
    duration: "30 Days",
    price: 200,
    processingTime: "7-10 Business Days",
    requirements: [
      "Valid passport (6+ months)",
      "Passport-size photographs",
      "Vaccination certificates",
      "Proof of accommodation",
      "Return flight ticket",
    ],
  },
];

export const faqs: FAQ[] = [
  {
    id: "1",
    question: "How far in advance should I book my trip?",
    answer:
      "We recommend booking at least 4-6 weeks in advance for the best availability and rates. For peak seasons and holidays like Umrah during Ramadan, we suggest booking 2-3 months ahead.",
  },
  {
    id: "2",
    question: "What is your cancellation policy?",
    answer:
      "We offer flexible cancellation with full refunds up to 14 days before departure. Cancellations within 7-14 days receive a 50% refund. Within 7 days, we offer rescheduling at no extra cost.",
  },
  {
    id: "3",
    question: "Do you offer customized tour packages?",
    answer:
      "Absolutely! We specialize in bespoke travel experiences. Contact our team to design a tailored itinerary that matches your preferences, budget, and travel style.",
  },
  {
    id: "4",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit/debit cards, bank transfers, and secure online payments. For group bookings, we offer flexible installment plans.",
  },
  {
    id: "5",
    question: "Is travel insurance included?",
    answer:
      "Comprehensive travel insurance is included in all our premium packages. For other packages, we strongly recommend adding travel insurance and can assist with purchasing it.",
  },
  {
    id: "6",
    question: "Do you provide visa assistance?",
    answer:
      "Yes! Our dedicated visa team handles the entire process for you, from document preparation to submission and tracking. We have a 99.5% visa approval rate.",
  },
];

export const galleryItems: GalleryItem[] = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
    title: "Dubai Skyline at Sunset",
    destination: "Dubai",
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    title: "Hunza Valley Panorama",
    destination: "Northern Pakistan",
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80",
    title: "Masjid al-Haram",
    destination: "Makkah",
  },
  {
    id: "4",
    image: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800&q=80",
    title: "New Year Fireworks",
    destination: "Dubai",
  },
  {
    id: "5",
    image: "https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800&q=80",
    title: "Badshahi Mosque",
    destination: "Lahore",
  },
  {
    id: "6",
    image: "https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=800&q=80",
    title: "Desert Safari Dunes",
    destination: "Dubai",
  },
];

export const statistics: Statistic[] = [
  { label: "Happy Travelers", value: "15", suffix: "K+" },
  { label: "Destinations", value: "50", suffix: "+" },
  { label: "Tour Packages", value: "200", suffix: "+" },
  { label: "Years Experience", value: "12", suffix: "+" },
  { label: "Customer Rating", value: "4.9", suffix: "/5" },
  { label: "Visa Success Rate", value: "99.5", suffix: "%" },
];

export const agencyContact = {
  phone: "+971501234567",
  whatsapp: "+971501234567",
};

export const teamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Ahmed Al Dhaid",
    designation: "CEO & Founder",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    phone: "+971501234567",
    whatsapp: "+971501234567",
    description: "With over 15 years in luxury travel, Ahmed leads our vision to deliver extraordinary journeys across the globe.",
    isActive: true,
    displayOrder: 1,
  },
  {
    id: "2",
    name: "Fatima Hassan",
    designation: "General Manager",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
    phone: "+971509876543",
    whatsapp: "+971509876543",
    description: "Fatima oversees daily operations ensuring every client receives seamless, world-class service.",
    isActive: true,
    displayOrder: 2,
  },
  {
    id: "3",
    name: "Omar Patel",
    designation: "Senior Travel Consultant",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
    phone: "+971502345678",
    whatsapp: "+971502345678",
    description: "Omar crafts bespoke itineraries tailored to each client's unique preferences and desires.",
    isActive: true,
    displayOrder: 3,
  },
  {
    id: "4",
    name: "Sara Khan",
    designation: "Tour Manager",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
    phone: "+971503456789",
    whatsapp: "+971503456789",
    description: "Sara ensures every tour runs flawlessly, coordinating logistics and enriching client experiences.",
    isActive: true,
    displayOrder: 4,
  },
  {
    id: "5",
    name: "Khalid Mirza",
    designation: "Customer Support Lead",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    phone: "+971504567890",
    whatsapp: "+971504567890",
    description: "Khalid and his team provide 24/7 support to ensure peace of mind throughout your journey.",
    isActive: true,
    displayOrder: 5,
  },
  {
    id: "6",
    name: "Aisha Noor",
    designation: "Visa Specialist",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80",
    phone: "+971505678901",
    whatsapp: "+971505678901",
    description: "Aisha handles all visa processing with a 99.5% approval rate, making travel hassle-free.",
    isActive: true,
    displayOrder: 6,
  },
];
