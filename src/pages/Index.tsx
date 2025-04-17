
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
import StripeVerificationTest from '@/components/stripe-test/StripeVerificationTest';
import { useAuth } from '@/contexts/auth/AuthContext';

const Index = () => {
  const { user } = useAuth();
  
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
      
      {/* Only show the Stripe verification test for admins/developers */}
      {user && (
        <div className="py-8 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-6">Stripe Integration Test</h2>
            <StripeVerificationTest />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
