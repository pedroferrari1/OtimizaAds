import {
  LandingHeader,
  HeroSection,
  FeaturesSection,
  PricingSection,
  CTASection,
  LandingFooter
} from './components';

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