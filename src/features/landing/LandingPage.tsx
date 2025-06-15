
import LandingHeader from "@/components/landing/LandingHeader";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PricingSection from "@/components/landing/PricingSection";
import CTASection from "@/components/landing/CTASection";
import LandingFooter from "@/components/landing/LandingFooter";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
