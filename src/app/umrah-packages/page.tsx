import { getPublicPackages } from "@/lib/public-data";
import { UmrahPackagesView } from "./umrah-packages-view";

export const dynamic = "force-dynamic";

export default async function UmrahPackagesPage() {
  const packages = await getPublicPackages();

  return <UmrahPackagesView packages={packages} />;
}
