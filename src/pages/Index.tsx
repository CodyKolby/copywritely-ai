
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import HeroSection from '@/components/home/HeroSection';
import SocialProofSection from '@/components/home/SocialProofSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import ThreeStepsSection from '@/components/home/ThreeStepsSection';
import ClientTestimonialsSection from '@/components/home/ClientTestimonialsSection';
import CaseStudiesSection from '@/components/home/CaseStudiesSection';
import TrialCTASection from '@/components/home/TrialCTASection';
import Footer from '@/components/home/Footer';

const Index = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Version Indicator - Only for testing purposes */}
      <div className="fixed bottom-2 right-2 z-50 bg-copywrite-teal text-white text-xs px-2 py-1 rounded-md opacity-70">
        v1.3.3 - Fixed tab corners and text color
      </div>
      
      <HeroSection />
      <SocialProofSection />
      <FeaturesSection />
      <TestimonialsSection />
      <ThreeStepsSection />
      <ClientTestimonialsSection />
      <CaseStudiesSection />
      <TrialCTASection />
      <Footer />
    </div>
  );
};

export default Index;
