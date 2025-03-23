
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';
import { createCheckoutSession } from '@/lib/stripe';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BillingToggle } from '@/components/pricing/BillingToggle';
import { PricingCard } from '@/components/pricing/PricingCard';
import { PricingFAQ } from '@/components/pricing/PricingFAQ';
import { BillingCycle, getProPrice, getPricingLabel, getPriceId } from '@/components/pricing/pricing-utils';

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Check if the user was redirected after canceling payment
  const isCanceled = searchParams.get('canceled') === 'true';
  
  // Check for Stripe redirect flag
  useEffect(() => {
    // Only show payment failure notification when:
    // 1. We returned from a Stripe redirect (redirectingToStripe == true)
    // 2. We are on the pricing page
    // 3. There's no canceled=true parameter (which already has its own toast)
    
    const wasRedirectingToStripe = sessionStorage.getItem('redirectingToStripe') === 'true';
    
    if (wasRedirectingToStripe && !isCanceled) {
      // This is a return from Stripe without success or cancel parameters
      toast.info('Płatność nie została ukończona', {
        description: 'Możesz spróbować ponownie lub skontaktować się z obsługą'
      });
      // Clear redirect flag
      sessionStorage.removeItem('redirectingToStripe');
    } else if (!wasRedirectingToStripe) {
      // If we're not returning from Stripe, just ensure the flag is cleared
      // This prevents showing the message for new users or page refreshes
      sessionStorage.removeItem('redirectingToStripe');
    }
  }, [isCanceled]);
  
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Show message if user canceled payment
    if (isCanceled) {
      toast.info('Anulowano proces płatności', {
        description: 'Możesz kontynuować korzystanie z aplikacji w wersji podstawowej'
      });
      // Ensure we clear the redirecting flag
      sessionStorage.removeItem('redirectingToStripe');
    }
  }, [isCanceled]);

  // Save user email in localStorage (for Stripe)
  useEffect(() => {
    if (user?.email) {
      localStorage.setItem('userEmail', user.email);
    }
  }, [user]);

  // Handle subscribe button click
  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Musisz się zalogować', {
        description: 'Zaloguj się, aby kontynuować zakup subskrypcji',
        action: {
          label: 'Zaloguj',
          onClick: () => navigate('/login')
        }
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Log the price ID we're using for debugging
      const priceId = getPriceId(billingCycle);
      console.log('Using price ID for checkout:', priceId);
      
      const redirectSuccessful = await createCheckoutSession(priceId);
      
      // If no redirect happened, but there was no error
      if (!redirectSuccessful) {
        toast.error('Nie udało się rozpocząć procesu płatności', {
          description: 'Spróbuj ponownie później lub skontaktuj się z obsługą'
        });
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      // Toast error is already shown in createCheckoutSession function
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Wybierz plan idealny dla siebie
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Profesjonalne narzędzie do copywritingu, które pomoże Ci tworzyć
            skuteczne teksty reklamowe.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <BillingToggle value={billingCycle} onChange={setBillingCycle} />

        {/* Pricing card centered with max width */}
        <motion.div 
          className="max-w-md mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Pro Plan */}
          <PricingCard 
            price={getProPrice(billingCycle)}
            pricingLabel={getPricingLabel()}
            isAnnual={billingCycle === 'annual'}
            isLoading={isLoading}
            onSubscribe={handleSubscribe}
          />
        </motion.div>

        {/* FAQ Section */}
        <PricingFAQ />
      </div>
    </div>
  );
};

export default Pricing;
