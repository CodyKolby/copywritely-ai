
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';
import { useDebugInfo, DebugInfo } from './useDebugInfo';
import { usePaymentFlags } from './usePaymentFlags';
import { usePaymentProcess } from './usePaymentProcess';
import { useUrlParams } from './useUrlParams';
import { BillingCycle } from '@/components/pricing/pricing-utils';

export type { DebugInfo } from './useDebugInfo';

/**
 * Main hook that combines all payment-related functionality
 */
export function usePaymentHandler() {
  const { user } = useAuth();
  const { debugInfo, collectDebugInfo } = useDebugInfo();
  const { timeoutRef, clearPaymentFlags } = usePaymentFlags();
  const { isCanceled, cleanupUrlParams } = useUrlParams();
  const { isLoading, setIsLoading, handleSubscribe } = usePaymentProcess(
    user,
    timeoutRef,
    collectDebugInfo,
    clearPaymentFlags
  );
  
  // Handle canceled payments and initialization
  useEffect(() => {
    console.log('usePaymentHandler useEffect running');
    
    // Force clear any flags when the component mounts
    sessionStorage.removeItem('redirectingToStripe');
    sessionStorage.removeItem('stripeCheckoutInProgress');
    setIsLoading(false);
    console.log('Flags cleared and isLoading set to false on mount');
    
    if (isCanceled) {
      console.log('Payment canceled via URL parameter');
      clearPaymentFlags();
      toast.info('Anulowano proces płatności', {
        description: 'Możesz kontynuować korzystanie z aplikacji w wersji podstawowej'
      });
      
      // Clean up the URL
      cleanupUrlParams();
    }
    
    // Save user email in localStorage (for Stripe)
    if (user?.email) {
      console.log('Storing user email in localStorage on mount');
      localStorage.setItem('userEmail', user.email);
    }
    
    // Collect initial debug info
    collectDebugInfo(user);
    
    // Clean up timeout on unmount
    return () => {
      console.log('usePaymentHandler cleanup running');
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Force clear any flags when the component unmounts
      sessionStorage.removeItem('redirectingToStripe');
      sessionStorage.removeItem('stripeCheckoutInProgress');
    };
  }, [isCanceled, clearPaymentFlags, collectDebugInfo, user, cleanupUrlParams, setIsLoading]);

  /**
   * Combined handler with proper typings
   */
  const handleSubscribeWithBilling = (billingCycle: BillingCycle) => {
    return handleSubscribe(billingCycle);
  };

  return {
    isLoading,
    debugInfo,
    collectDebugInfo,
    clearPaymentFlags,
    handleSubscribe: handleSubscribeWithBilling
  };
}
