
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
    // Get the redirect timestamp (if it exists)
    const redirectTimestamp = sessionStorage.getItem('redirectingToStripe');
    
    // Check if it's a recent redirect (less than 1 hour old)
    const isRecentRedirect = redirectTimestamp && 
      (Date.now() - parseInt(redirectTimestamp)) < 3600000;
    
    if (isRecentRedirect && !isCanceled) {
      // This is a return from Stripe without success or cancel parameters
      toast.info('Płatność nie została ukończona', {
        description: 'Możesz spróbować ponownie lub skontaktować się z obsługą'
      });
      // Clear redirect flag
      sessionStorage.removeItem('redirectingToStripe');
    } else if (redirectTimestamp) {
      // If it's an old timestamp, just clear it
      sessionStorage.removeItem('redirectingToStripe');
    }
    
    // Always reset loading state on component mount
    setIsLoading(false);
  }, [isCanceled]);
  
  // Scroll to top on page load and show message if user canceled payment
  useEffect(() => {
    window.scrollTo(0, 0);
    
    if (isCanceled) {
      toast.info('Anulowano proces płatności', {
        description: 'Możesz kontynuować korzystanie z aplikacji w wersji podstawowej'
      });
      // Ensure we clear the redirecting flag
      sessionStorage.removeItem('redirectingToStripe');
      // Reset loading state
      setIsLoading(false);
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

    // Prevent multiple clicks - check if already loading
    if (isLoading) {
      console.log('Already processing payment request, ignoring click');
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
      
      // Clear any old redirect flags
      sessionStorage.removeItem('redirectingToStripe');
      
      // Direct window location redirect approach
      const result = await createCheckoutSession(priceId);
      
      if (!result) {
        // If the checkout function returns false, it means there was an error
        console.log('Checkout failed, resetting loading state');
        setIsLoading(false);
        toast.dismiss(loadingToastId);
        toast.error('Nie udało się połączyć z systemem płatności', {
          description: 'Spróbuj ponownie za chwilę lub skontaktuj się z obsługą'
        });
      }
      // If successful, the page will redirect, so we don't need to do anything
      
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
