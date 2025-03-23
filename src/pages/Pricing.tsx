
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
  
  // Reset loading state and check for redirect flags on component mount and when route changes
  useEffect(() => {
    // CRITICAL: Immediate reset of loading state on ANY component render
    setIsLoading(false);
    
    // CRITICAL: Clear ALL possible redirect flags
    const clearAllFlags = () => {
      console.log('Clearing all Stripe flags on page load/navigation');
      sessionStorage.removeItem('redirectingToStripe');
      sessionStorage.removeItem('stripeCheckoutInProgress');
      localStorage.removeItem('stripeCheckoutInProgress');
      toast.dismiss(); // Clear any existing toasts
    };
    
    // Run the cleanup immediately
    clearAllFlags();
    
    // Handle canceled payment if needed
    if (isCanceled) {
      toast.info('Anulowano proces płatności', {
        description: 'Możesz kontynuować korzystanie z aplikacji w wersji podstawowej'
      });
    }
    
    // Clean up function will also be called when component unmounts
    return () => {
      clearAllFlags();
    };
  }, [isCanceled, location.pathname]); // Add location.pathname to ensure this runs on route changes

  // Save user email in localStorage (for Stripe)
  useEffect(() => {
    if (user?.email) {
      localStorage.setItem('userEmail', user.email);
    }
  }, [user]);

  // Handle subscribe button click
  const handleSubscribe = async () => {
    // CRITICAL: Immediately clear any stale flags
    sessionStorage.removeItem('redirectingToStripe');
    sessionStorage.removeItem('stripeCheckoutInProgress');
    
    // Prevent multiple clicks or processing while already loading
    if (isLoading) {
      console.log('Already processing payment request, ignoring click');
      return;
    }
    
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

    // Dismiss any existing toasts before starting new payment process
    toast.dismiss();
    
    // Show a clear loading toast
    const loadingToastId = toast.loading('Łączenie z systemem płatności...');
    
    // Set loading state
    setIsLoading(true);
    
    try {
      // Log the price ID we're using for debugging
      const priceId = getPriceId(billingCycle);
      console.log('Using price ID for checkout:', priceId);
      
      // Initiate checkout process
      const result = await createCheckoutSession(priceId);
      
      // CRITICAL: If checkout function returns false or takes too long, reset loading state
      if (!result) {
        console.log('Checkout failed, resetting loading state');
        setIsLoading(false);
        toast.dismiss(loadingToastId);
        toast.error('Nie udało się połączyć z systemem płatności', {
          description: 'Spróbuj ponownie za chwilę lub skontaktuj się z obsługą'
        });
      }
      // If successful, the page will redirect, so we don't need to do anything else here
      
    } catch (error) {
      console.error('Error in handleSubscribe:', error);
      // Reset loading state if there's an exception
      setIsLoading(false);
      toast.dismiss(loadingToastId);
      
      // Show a more specific error message
      toast.error('Wystąpił błąd podczas inicjowania płatności', {
        description: 'Prosimy odświeżyć stronę i spróbować ponownie'
      });
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
