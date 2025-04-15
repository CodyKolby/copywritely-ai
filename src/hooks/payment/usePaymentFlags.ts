
import { useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Hook to manage payment-related flags and timeouts
 */
export function usePaymentFlags() {
  // Timeout reference
  const timeoutRef = useRef<number | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Clear all payment flags and timeouts
  const clearPaymentFlags = useCallback(() => {
    console.log('[PAYMENT-FLAGS] Explicitly clearing payment flags');
    
    // Safely clear flags in session storage
    try {
      // Clear session storage flags
      sessionStorage.removeItem('redirectingToStripe');
      sessionStorage.removeItem('stripeCheckoutInProgress');
      sessionStorage.removeItem('paymentProcessed'); // Also clear the payment processed flag
    } catch (e) {
      console.error('[PAYMENT-FLAGS] Error clearing session storage:', e);
    }
    
    // Clear any pending timeout
    if (timeoutRef.current !== null) {
      try {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      } catch (e) {
        console.error('[PAYMENT-FLAGS] Error clearing timeout:', e);
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
