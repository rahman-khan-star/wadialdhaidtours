import type { Hotel, TourPackage } from "@/types";

// Shared filtering used by the dedicated tour packages page and the homepage
// search hub, so both apply exactly the same matching rules.

export interface TourSearchFilters {
  query?: string;
  category?: string;
  days?: number | null;
}

export const TOUR_CATEGORIES: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Dubai Tours", value: "dubai" },
  { label: "Pakistan Tours", value: "pakistan" },
  { label: "Umrah Packages", value: "umrah" },
];

function normalize(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function filterPackages(
  packages: TourPackage[],
  filters: TourSearchFilters = {}
): TourPackage[] {
  const query = normalize(filters.query);
  const category = normalize(filters.category) || "all";
  const days = filters.days ?? null;

  return packages.filter((pkg) => {
    const matchesCategory = category === "all" || pkg.category === category;
    const matchesDays = days === null || parseInt(pkg.duration, 10) === days;
    const matchesQuery =
      !query ||
      pkg.title.toLowerCase().includes(query) ||
      pkg.destination.toLowerCase().includes(query);
    return matchesCategory && matchesDays && matchesQuery;
  });
}

export function filterHotels(hotels: Hotel[], query?: string): Hotel[] {
  const needle = normalize(query);
  if (!needle) return hotels;
  return hotels.filter(
    (hotel) =>
      hotel.name.toLowerCase().includes(needle) ||
      hotel.location.toLowerCase().includes(needle)
  );
}
