import { getPublicHotels } from "@/lib/public-data";
import { HotelsView } from "./hotels-view";

export const dynamic = "force-dynamic";

export default async function HotelsPage() {
  const hotels = await getPublicHotels();

  return <HotelsView hotels={hotels} />;
}
