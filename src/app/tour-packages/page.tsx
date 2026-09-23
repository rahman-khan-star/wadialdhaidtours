import { getPublicPackages } from "@/lib/public-data";
import { TourPackagesView } from "./tour-packages-view";

export const dynamic = "force-dynamic";

export default async function TourPackagesPage() {
  const packages = await getPublicPackages();

  return <TourPackagesView packages={packages} />;
}
