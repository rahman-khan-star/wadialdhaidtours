import {
  HeroSection,
  SearchTrips,
  UmrahPackages,
  FeaturedDestinations,
  VisaServices,
  PopularPackages,
  WhyChooseUs,
  Testimonials,
  Gallery,
  Statistics,
  LatestBlog,
  FAQ,
  ContactCTA,
  TeamSection,
} from "@/components/home";
import {
  getPublicBlogPosts,
  getPublicDestinations,
  getPublicHotels,
  getPublicPackages,
  getPublicTeamMembers,
  getPublicTestimonials,
  getPublicVisaServices,
} from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [destinations, packages, testimonials, teamMembers, blogPosts, visaServices, hotels] =
    await Promise.all([
      getPublicDestinations(),
      getPublicPackages(),
      getPublicTestimonials(),
      getPublicTeamMembers(),
      getPublicBlogPosts(),
      getPublicVisaServices(),
      getPublicHotels(),
    ]);

  return (
    <>
      <HeroSection />
      <SearchTrips hotels={hotels} packages={packages} />
      <UmrahPackages packages={packages} />
      <VisaServices services={visaServices} />
      <FeaturedDestinations destinations={destinations} />
      <PopularPackages packages={packages} />
      <WhyChooseUs />
      <TeamSection members={teamMembers} />
      <Testimonials testimonials={testimonials} />
      <Statistics />
      <Gallery />
      <LatestBlog posts={blogPosts} />
      <FAQ />
      <ContactCTA />
    </>
  );
}
