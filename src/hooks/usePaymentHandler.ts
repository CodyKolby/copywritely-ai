
import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';
import { createCheckoutSession } from '@/lib/stripe';
import { BillingCycle, getPriceId } from '@/components/pricing/pricing-utils';

export type DebugInfo = Record<string, string>;

export function usePaymentHandler() {
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Check for URL parameters but don't immediately trigger actions
  const isCanceled = searchParams.get('canceled') === 'true';
  
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
      'isLoading state': isLoading ? 'True' : 'False',
      'Timestamp': new Date().toISOString()
    };
    
    setDebugInfo(info);
    return info;
  }, [user, searchParams, isLoading]);
  
  // Handle clear flags ONLY when explicitly needed
  const clearPaymentFlags = useCallback(() => {
    console.log('Explicitly clearing payment flags');
    
    // Clear session storage flags
    sessionStorage.removeItem('redirectingToStripe');
    sessionStorage.removeItem('stripeCheckoutInProgress');
    
    // Reset loading state
    setIsLoading(false);
    
    toast.info('System płatności zresetowany');
  }, []);
  
  // Handle subscribe button click
  const handleSubscribe = async (billingCycle: BillingCycle) => {
    // Collect debug info
    collectDebugInfo();
    
    // Prevent multiple clicks while already loading
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
    
    // Set loading state
    setIsLoading(true);
    
    try {
      // Log the price ID we're using for debugging
      const priceId = getPriceId(billingCycle);
      console.log('Using price ID for checkout:', priceId);
      
      // Add automatic timeout to reset loading state if checkout process takes too long
      const timeoutId = setTimeout(() => {
        console.log('Checkout process timeout reached, resetting state');
        clearPaymentFlags();
        setIsLoading(false);
        toast.error('Proces płatności trwa zbyt długo', {
          description: 'Spróbuj ponownie za chwilę'
        });
      }, 10000); // 10 seconds timeout
      
      // Initiate checkout process
      const result = await createCheckoutSession(priceId);
      
      // Clear timeout if we get a response
      clearTimeout(timeoutId);
      
      // If checkout function returns false, reset loading state
      if (!result) {
        console.log('Checkout failed, resetting loading state');
        setIsLoading(false);
      }
      // If successful, the page will redirect, so we don't need to do anything else here
      
    } catch (error) {
      console.error('Error in handleSubscribe:', error);
      // Reset loading state if there's an exception
      setIsLoading(false);
      clearPaymentFlags();
      
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

  // Handle canceled payments when the page is first loaded
  useEffect(() => {
    if (isCanceled) {
      console.log('Payment canceled via URL parameter');
      clearPaymentFlags();
      toast.info('Anulowano proces płatności', {
        description: 'Możesz kontynuować korzystanie z aplikacji w wersji podstawowej'
      });
      
      // Clean up the URL
      if (searchParams.has('canceled')) {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('canceled');
        const newUrl = newParams.toString() 
          ? `${window.location.pathname}?${newParams}` 
          : window.location.pathname;
        navigate(newUrl, { replace: true });
      }
    }
    
    // Save user email in localStorage (for Stripe)
    if (user?.email) {
      localStorage.setItem('userEmail', user.email);
    }
    
    // Collect initial debug info
    collectDebugInfo();
  }, [isCanceled, clearPaymentFlags, collectDebugInfo, user, searchParams, navigate]);

  return {
    isLoading,
    debugInfo,
    collectDebugInfo,
    clearPaymentFlags,
    handleSubscribe
  };
}
