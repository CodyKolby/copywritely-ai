
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';
import { createCheckoutSession } from '@/lib/stripe';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BillingToggle } from '@/components/pricing/BillingToggle';
import { PricingCard } from '@/components/pricing/PricingCard';
import { PricingFAQ } from '@/components/pricing/PricingFAQ';
import { BillingCycle, getProPrice, getPricingLabel, getPriceId } from '@/components/pricing/pricing-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<Record<string, string>>({});
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Check if the user was redirected after canceling payment
  const isCanceled = searchParams.get('canceled') === 'true';
  
  // Force reset all Stripe-related flags on component mount and route changes
  const clearAllFlags = useCallback(() => {
    console.log('Forcing clear of all Stripe flags and loading state on page load/navigation');
    
    // Clear all session storage flags
    sessionStorage.removeItem('redirectingToStripe');
    sessionStorage.removeItem('stripeCheckoutInProgress');
    localStorage.removeItem('stripeCheckoutInProgress');
    
    // Reset loading state
    setIsLoading(false);
    
    // Clear any existing toasts
    toast.dismiss();
    
    // Add a diagnostic toast when flags are cleared
    toast.info('System płatności zresetowany');
  }, []);
  
  // Collect debug information
  const collectDebugInfo = useCallback(() => {
    const info: Record<string, string> = {
      'User authenticated': user ? 'Yes' : 'No',
      'User ID': user?.id || 'Not logged in',
      'Browser': navigator.userAgent,
      'URL': window.location.href,
      'Route params': searchParams.toString() || 'None',
      'stripeCheckoutInProgress': sessionStorage.getItem('stripeCheckoutInProgress') || 'Not set',
      'redirectingToStripe': sessionStorage.getItem('redirectingToStripe') || 'Not set',
      'Timestamp': new Date().toISOString()
    };
    
    setDebugInfo(info);
    return info;
  }, [user, searchParams]);
  
  // Check for stale stripe flags on component mount
  useEffect(() => {
    const stripeProgress = sessionStorage.getItem('stripeCheckoutInProgress');
    const redirecting = sessionStorage.getItem('redirectingToStripe');
    
    if (stripeProgress || redirecting) {
      console.log('Found stale Stripe flags on page load:', { stripeProgress, redirecting });
      toast.warning('Znaleziono nieaktualne flagi płatności - resetowanie...', {
        duration: 3000
      });
    }
    
    // CRITICAL: Reset all states and flags on mount
    clearAllFlags();
    collectDebugInfo();
    
    // Handle canceled payment if needed
    if (isCanceled) {
      toast.info('Anulowano proces płatności', {
        description: 'Możesz kontynuować korzystanie z aplikacji w wersji podstawowej'
      });
    }
    
    // Clean up function will also be called when component unmounts
    return clearAllFlags;
  }, [isCanceled, clearAllFlags, collectDebugInfo]);
  
  // Listen for route or URL changes to reset flags
  useEffect(() => {
    // Add event listener for visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // When page becomes visible again (like returning from another tab)
        console.log('Page visibility changed - clearing flags');
        clearAllFlags();
        collectDebugInfo();
      }
    };
    
    // Add event listener for browser history navigation
    const handlePopState = () => {
      console.log('Browser navigation event detected - clearing flags');
      clearAllFlags();
      collectDebugInfo();
    };
    
    // Register the event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);
    
    // Clean up on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [clearAllFlags, collectDebugInfo]);
  
  // Save user email in localStorage (for Stripe)
  useEffect(() => {
    if (user?.email) {
      localStorage.setItem('userEmail', user.email);
    }
  }, [user]);

  // Handle subscribe button click
  const handleSubscribe = async () => {
    // Collect debug info
    const debug = collectDebugInfo();
    console.log('Debug info at subscription start:', debug);
    
    // Explicitly clear any existing flags before starting
    clearAllFlags();
    
    // Prevent multiple clicks or processing while already loading
    if (isLoading) {
      console.log('Already processing payment request, ignoring click');
      toast.info('Płatność jest już w trakcie przetwarzania...');
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

    // Dismiss any existing toasts
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
      
      // If checkout function returns false, reset loading state
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
        description: 'Prosimy odświeżyć stronę i spróbować ponownie',
        action: {
          label: 'Odśwież',
          onClick: () => window.location.reload()
        }
      });
    }
  };

  // Show debug dialog
  const showDebugDialog = () => {
    collectDebugInfo();
    setIsDebugOpen(true);
  };

  // Handle manual reset
  const handleManualReset = () => {
    clearAllFlags();
    collectDebugInfo();
    setIsDebugOpen(false);
    window.location.reload();
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
          
          {/* Debug button */}
          <button 
            onClick={showDebugDialog}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600"
          >
            Debug
          </button>
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
      
      {/* Debug Dialog */}
      <Dialog open={isDebugOpen} onOpenChange={setIsDebugOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Informacje diagnostyczne</DialogTitle>
            <DialogDescription>
              Informacje o statusie płatności i sesji
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 text-sm">
            <div className="bg-gray-50 p-4 rounded-md max-h-60 overflow-y-auto">
              {Object.entries(debugInfo).map(([key, value]) => (
                <div key={key} className="mb-2">
                  <span className="font-medium">{key}:</span> {value}
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex justify-between">
              <Button variant="outline" onClick={() => setIsDebugOpen(false)}>
                Zamknij
              </Button>
              <Button onClick={handleManualReset} className="bg-red-500 hover:bg-red-600">
                Wyczyść flagi i odśwież
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pricing;
