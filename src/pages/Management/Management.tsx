import HeroSection from "./component/HeroSection";
import PropertyManagementSection from "./component/PropertyManagementSection";

const Management = () => {
  return (
    <div
    
    >
      <HeroSection className=" "
        title="Property Management, Perfected"
        subtitle="Emphasize luxury villas as assets, sanctuaries, reflections of taste."
        ctaLabel="Contact Our Team"
        onCtaClick={() => {
          /* route to contact, open modal, etc. */
        }}
        imageUrl="/images/managementHeroSection.png" // place your image in /public/assets
      />
   <div className="lg:p-0 p-2 mb-[920px] " > <PropertyManagementSection/></div>

    </div>
  );
};

export default Management;
