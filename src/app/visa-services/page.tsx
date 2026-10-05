import { getPublicVisaServices } from "@/lib/public-data";
import { VisaServicesView } from "./visa-services-view";

export const dynamic = "force-dynamic";

export default async function VisaServicesPage() {
  const services = await getPublicVisaServices();

  return <VisaServicesView services={services} />;
}
