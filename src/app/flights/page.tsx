import { FlightsView } from "./flights-view";
import type { FlightSearchFormInitial } from "@/components/flights/flight-search-form";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(params: SearchParams, key: string): string | undefined {
  const value = params[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

export default async function FlightsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const initial: FlightSearchFormInitial = {
    from: pick(params, "from"),
    to: pick(params, "to"),
    date: pick(params, "date"),
    passengers: pick(params, "passengers") ?? pick(params, "guests"),
  };

  return <FlightsView initial={initial} />;
}
