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
  getPublicPackages,
  getPublicTeamMembers,
  getPublicTestimonials,
  getPublicVisaServices,
} from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [destinations, packages, testimonials, teamMembers, blogPosts, visaServices] =
    await Promise.all([
      getPublicDestinations(),
      getPublicPackages(),
      getPublicTestimonials(),
      getPublicTeamMembers(),
      getPublicBlogPosts(),
      getPublicVisaServices(),
    ]);

  return (
    <>
      <HeroSection />
      <SearchTrips />
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
