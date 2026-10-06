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

// ---------------------------------------------------------------------------
// Flights — search + inquiry (no online booking, no customer-facing pricing)
// ---------------------------------------------------------------------------

export type CabinClass = "Economy" | "Premium Economy" | "Business" | "First";

export const CABIN_CLASSES: CabinClass[] = [
  "Economy",
  "Premium Economy",
  "Business",
  "First",
];

export type FlightTripType = "oneway" | "roundtrip";

export interface FlightPlace {
  iata: string;
  name: string;
  city: string;
  country: string;
}

export interface AirportOption extends FlightPlace {
  id: string;
}

export interface FlightLeg {
  airline: string;
  airlineCode: string;
  flightNumber: string;
  origin: FlightPlace;
  destination: FlightPlace;
  // Wall-clock local time at the respective airport, "YYYY-MM-DDTHH:mm".
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  stops: number;
  stopAirports: string[];
}

export type FlightAvailability = "Available" | "Limited";

// NOTE: deliberately contains no price/fare field. Customers never see pricing.
export interface FlightOffer {
  id: string;
  tripType: FlightTripType;
  cabin: CabinClass;
  availability: FlightAvailability;
  seatsRemaining: number;
  outbound: FlightLeg;
  inbound: FlightLeg | null;
}

export type FlightSearchStatus = "available" | "no_flights" | "unavailable";

export interface FlightSearchInput {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string | null;
  passengers: number;
  cabin: CabinClass;
  tripType: FlightTripType;
}

export interface FlightSearchQuery {
  origin: FlightPlace | null;
  destination: FlightPlace | null;
  departureDate: string;
  returnDate: string | null;
  passengers: number;
  cabin: CabinClass;
  tripType: FlightTripType;
}

// Server-signed reference the browser must present when submitting an inquiry,
// so flight details are never trusted from client-supplied fields.
export interface FlightSearchResult extends FlightOffer {
  requestToken: string;
}

export interface FlightSearchResponse {
  status: FlightSearchStatus;
  message: string | null;
  flights: FlightSearchResult[];
  query: FlightSearchQuery;
}

export type FlightRequestStatus =
  | "New"
  | "Contacted"
  | "In Progress"
  | "Completed"
  | "Cancelled";

export const FLIGHT_REQUEST_STATUSES: FlightRequestStatus[] = [
  "New",
  "Contacted",
  "In Progress",
  "Completed",
  "Cancelled",
];

export interface FlightRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  originCode: string;
  originName: string;
  destinationCode: string;
  destinationName: string;
  departureDate: string;
  returnDate: string | null;
  passengers: number;
  cabin: CabinClass;
  airline: string;
  flightNumber: string;
  message: string;
  status: FlightRequestStatus;
  date: string;
}
