
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
    const debugInfo = collectDebugInfo(user);
    console.log('[PAYMENT-PROCESS] Debug info:', debugInfo);
    
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
            onClick: () => handleSubscribe(billingCycle)
          }
        });
      }, 30000); // Zmniejsz timeout do 30 sekund
      
      // Log environment details for debugging
      console.log('Browser details:', navigator.userAgent);
      console.log('Window location:', window.location.href);
      console.log('Window origin:', window.location.origin);
      
      // Add specific timeout handling for Stripe checkout
      const checkoutPromise = createCheckoutSession(priceId);
      const checkoutTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout during checkout creation'));
        }, 15000); // 15 second timeout for checkout creation
      });
      
      // Race between checkout and timeout
      const result = await Promise.race([
        checkoutPromise,
        checkoutTimeoutPromise
      ]);
      
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
        
        // Show helpful error info
        console.error('Checkout failure details:', {
          userEmail: user.email ? 'Available' : 'Not available',
          userId: user.id,
          browser: navigator.userAgent,
          time: new Date().toISOString()
        });
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
      
      // Try fallback with direct navigation if available
      try {
        toast.error('Wystąpił błąd podczas inicjowania płatności', {
          description: 'Spróbujemy alternatywną metodę płatności',
        });
        
        // Get the price ID for fallback
        const fallbackPriceId = getPriceId(billingCycle);
        
        // Try netlify fallback if available
        const netlifyFallbackUrl = `https://copywrite-assist.com/.netlify/functions/stripe-checkout?priceId=${fallbackPriceId}&customerEmail=${user.email || ''}`;
        console.log('Trying fallback URL:', netlifyFallbackUrl);
        
        // Delay a bit before redirecting
        window.setTimeout(() => {
          window.location.href = netlifyFallbackUrl;
        }, 2000);
      } catch (fallbackError) {
        console.error('Error with fallback:', fallbackError);
        
        // Show a more specific error message
        toast.error('Wystąpił błąd podczas inicjowania płatności', {
          description: 'Prosimy odświeżyć stronę i spróbować ponownie',
          action: {
            label: 'Odśwież',
            onClick: () => window.location.reload()
          }
        });
      }
    }
  };

  return {
    isLoading,
    setIsLoading,
    handleSubscribe
  };
}
