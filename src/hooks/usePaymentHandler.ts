
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth/AuthContext';
import { createCheckoutSession, PRICE_IDS } from '@/lib/stripe';
import { BillingCycle } from '@/components/pricing/pricing-utils';

export function usePaymentHandler() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const timeoutRef = useRef<number | null>(null);

  // Get debug info about the current state
  const debugInfo = {
    'User ID': user?.id || 'Not logged in',
    'User Email': user?.email || 'Not available',
    'Is Loading': isLoading ? 'Yes' : 'No',
    'Window Location': window.location.href,
    'API Key Available': 'Using hardcoded key'
  };

  // Handle URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const canceled = params.get('canceled');

    if (canceled) {
      toast.info('Płatność została anulowana');
      
      // Remove the parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    // Clean up timeout on unmount
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Clear any payment flags that might be stuck
  const clearPaymentFlags = () => {
    sessionStorage.removeItem('redirectingToStripe');
    sessionStorage.removeItem('stripeCheckoutInProgress');
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsLoading(false);
  };

  // Collect debug info
  const collectDebugInfo = () => {
    return debugInfo;
  };

  // Handle subscribe button click
  const handleSubscribe = async (billingCycle: BillingCycle) => {
    console.log('Subscribe button clicked with billing cycle:', billingCycle);
    
    // Clear any stuck flags
    clearPaymentFlags();
    
    // Prevent multiple clicks
    if (isLoading) {
      console.log('Already processing payment, ignoring click');
      return;
    }
    
    // Check if user is logged in
    if (!user) {
      console.log('User not logged in, redirecting to login');
      toast.error('Musisz się zalogować', {
        description: 'Zaloguj się, aby kontynuować zakup subskrypcji',
        action: {
          label: 'Zaloguj',
          onClick: () => navigate('/login')
        }
      });
      return;
    }
    
    // Store user email for Stripe
    if (user.email) {
      localStorage.setItem('userEmail', user.email);
    }
    
    // Set loading state
    setIsLoading(true);
    
    try {
      // Get price ID based on billing cycle
      const priceId = billingCycle === 'annual' 
        ? PRICE_IDS.PRO_ANNUAL 
        : PRICE_IDS.PRO_MONTHLY;
      
      console.log('Using price ID:', priceId);
      
      // Set timeout to reset loading state if checkout takes too long
      timeoutRef.current = window.setTimeout(() => {
        console.log('Checkout timeout reached, resetting state');
        clearPaymentFlags();
        toast.error('Proces płatności trwa zbyt długo', {
          description: 'Spróbuj ponownie za chwilę'
        });
      }, 20000);
      
      // Start checkout process
      const result = await createCheckoutSession(priceId);
      
      // If checkout failed, reset loading state
      if (!result) {
        clearPaymentFlags();
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      clearPaymentFlags();
      
      toast.error('Wystąpił błąd', {
        description: error instanceof Error ? error.message : 'Spróbuj ponownie za chwilę'
      });
    }
  };

  return {
    isLoading,
    debugInfo,
    collectDebugInfo,
    clearPaymentFlags,
    handleSubscribe
  };
}

export type DebugInfo = Record<string, string>;
