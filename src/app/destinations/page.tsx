import { getPublicDestinations } from "@/lib/public-data";
import { DestinationsView } from "./destinations-view";

export const dynamic = "force-dynamic";

export default async function DestinationsPage() {
  const destinations = await getPublicDestinations();

  return <DestinationsView destinations={destinations} />;
}
