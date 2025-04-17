
import { useRef } from 'react';

export function usePaymentFlags() {
  const timeoutRef = useRef<number | null>(null);

  // Clear any payment flags that might be stuck
  const clearPaymentFlags = () => {
    sessionStorage.removeItem('redirectingToStripe');
    sessionStorage.removeItem('stripeCheckoutInProgress');
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  return { timeoutRef, clearPaymentFlags };
}
