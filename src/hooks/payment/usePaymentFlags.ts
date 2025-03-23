
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
    
    // Clear session storage flags
    sessionStorage.removeItem('redirectingToStripe');
    sessionStorage.removeItem('stripeCheckoutInProgress');
    
    // Clear any pending timeout
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Reset loading state (will be handled by parent hook)
    toast.info('System płatności zresetowany');
  }, []);
  
  return {
    timeoutRef,
    clearPaymentFlags
  };
}
