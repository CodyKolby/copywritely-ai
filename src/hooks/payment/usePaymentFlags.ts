
import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Hook to manage payment-related flags and timeouts
 */
export function usePaymentFlags() {
  // Timeout reference
  const timeoutRef = useRef<number | null>(null);

  // Clear all payment flags and timeouts
  const clearPaymentFlags = useCallback(() => {
    console.log('Explicitly clearing payment flags');
    
    // Safely clear flags in session storage
    try {
      // Clear session storage flags
      sessionStorage.removeItem('redirectingToStripe');
      sessionStorage.removeItem('stripeCheckoutInProgress');
      sessionStorage.removeItem('paymentProcessed'); // Also clear the payment processed flag
    } catch (e) {
      console.error('Error clearing session storage:', e);
    }
    
    // Clear any pending timeout
    if (timeoutRef.current) {
      try {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      } catch (e) {
        console.error('Error clearing timeout:', e);
      }
    }
    
    // Info for user
    toast.info('System płatności zresetowany');
  }, []);
  
  return {
    timeoutRef,
    clearPaymentFlags
  };
}
