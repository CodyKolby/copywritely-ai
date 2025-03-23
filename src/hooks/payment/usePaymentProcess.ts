
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createCheckoutSession } from '@/lib/stripe';
import { BillingCycle, getPriceId } from '@/components/pricing/pricing-utils';

/**
 * Hook to handle the payment process
 */
export function usePaymentProcess(
  user: any,
  timeoutRef: React.MutableRefObject<number | null>,
  collectDebugInfo: (userData?: any) => Record<string, string>,
  clearPaymentFlags: () => void
) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // Handle subscribe button click
  const handleSubscribe = async (billingCycle: BillingCycle) => {
    console.log('Subscribe button clicked, billing cycle:', billingCycle);
    
    // Force clear any flags that might be stuck from previous attempts
    clearPaymentFlags();
    console.log('Explicitly clearing payment flags');
    
    // Collect debug info
    collectDebugInfo(user);
    
    // Prevent multiple clicks while already loading
    if (isLoading) {
      console.log('Already processing payment request, ignoring click');
      toast.info('Płatność jest już w trakcie przetwarzania...');
      return;
    }
    
    if (!user) {
      console.log('No authenticated user, redirecting to login');
      toast.error('Musisz się zalogować', {
        description: 'Zaloguj się, aby kontynuować zakup subskrypcji',
        action: {
          label: 'Zaloguj',
          onClick: () => navigate('/login')
        }
      });
      return;
    }

    // Make sure user email is stored in localStorage
    if (user.email) {
      console.log('Storing user email in localStorage');
      localStorage.setItem('userEmail', user.email);
    } else {
      console.warn('User email not available');
    }

    // Dismiss any existing toasts
    toast.dismiss();
    
    // Set loading state
    setIsLoading(true);
    console.log('Setting isLoading to true');
    
    try {
      // Get the price ID for the selected billing cycle
      const priceId = getPriceId(billingCycle);
      console.log('Using price ID for checkout:', priceId);
      
      // Add automatic timeout to reset loading state if checkout process takes too long
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = window.setTimeout(() => {
        console.log('Checkout process timeout reached, resetting state');
        clearPaymentFlags();
        setIsLoading(false);
        toast.error('Proces płatności trwa zbyt długo', {
          description: 'Spróbuj ponownie za chwilę lub skontaktuj się z obsługą',
          action: {
            label: 'Spróbuj ponownie',
            onClick: () => window.location.reload()
          }
        });
      }, 45000); // 45 seconds timeout
      
      // Log environment details for debugging
      console.log('Browser details:', navigator.userAgent);
      console.log('Window location:', window.location.href);
      console.log('Window origin:', window.location.origin);
      console.log('Stripe public key available:', !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      
      // Direct checkout with Stripe
      const result = await createCheckoutSession(priceId);
      console.log('createCheckoutSession result:', result);
      
      // If checkout function returns false, reset loading state
      if (!result) {
        console.log('Checkout failed, resetting loading state');
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setIsLoading(false);
        console.log('isLoading set to false after failed checkout');
        clearPaymentFlags(); // Clear flags again after failure
      }
      // If successful, the page will redirect, so we don't need to do anything else here
      
    } catch (error) {
      console.error('Error in handleSubscribe:', error);
      // Reset loading state if there's an exception
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsLoading(false);
      console.log('isLoading set to false after error');
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

  return {
    isLoading,
    setIsLoading,
    handleSubscribe
  };
}
