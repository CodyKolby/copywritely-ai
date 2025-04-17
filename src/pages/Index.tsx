
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import HeroSection from '@/components/home/HeroSection';
import SocialProofSection from '@/components/home/SocialProofSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import ThreeStepsSection from '@/components/home/ThreeStepsSection';
import ClientTestimonialsSection from '@/components/home/ClientTestimonialsSection';
import CaseStudiesSection from '@/components/home/CaseStudiesSection';
import TrialCTASection from '@/components/home/TrialCTASection';

const Index = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">      
      <HeroSection />
      <SocialProofSection />
      <FeaturesSection />
      <TestimonialsSection />
      <ThreeStepsSection />
      <ClientTestimonialsSection />
      <CaseStudiesSection />
      <TrialCTASection />
    </div>
  );
};

export default Index;
