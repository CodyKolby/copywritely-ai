
import { useState } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { updateLocalStoragePremium } from '@/lib/stripe/localStorage-utils';
import { BillingCycle } from '@/components/pricing/pricing-utils';
import { User } from '@supabase/supabase-js';
import { updateProfilePremiumStatus } from '@/lib/stripe/profile-updates';
import { analyticsService } from '@/lib/analytics/analytics-service';

export interface PaymentProcessResult {
  isProcessing: boolean;
  error: string | null;
  success: boolean;
  verifyPayment: (sessionId: string) => Promise<boolean>;
}

export function usePaymentProcess() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { user, refreshSession, isPremium } = useAuth();

  const verifyPayment = async (sessionId: string): Promise<boolean> => {
    if (!user || !user.id) {
      console.error('No authenticated user found');
      setError('Musisz być zalogowany, aby dokonać weryfikacji płatności');
      return false;
    }

    if (isPremium) {
      console.log('User already has premium status');
      setSuccess(true);
      return true;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Verifying payment for session ID: ${sessionId}`);

      const { data, error: verifyError } = await supabase.functions.invoke(
        'verify-payment-session',
        {
          body: {
            userId: user.id,
            sessionId,
          },
        }
      );

      if (verifyError) {
        throw new Error(`Verification error: ${verifyError.message}`);
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Weryfikacja płatności nie powiodła się');
      }

      console.log('Payment verified successfully:', data);

      await updateProfilePremiumStatus(
        user.id, 
        true, 
        data.subscriptionId, 
        data.status || 'active',
        data.expiryDate
      );

      updateLocalStoragePremium(true);
      
      await refreshSession();
      
      toast.success('Gratulacje! Twoje konto zostało zaktualizowane do wersji Premium.');
      
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/projekty');
      }, 2000);
      
      // Track subscription events based on subscription status
      if (data.success) {
        if (data.status === 'trialing') {
          console.log('Tracking trial started event from verify-payment');
          analyticsService.trackTrialStarted();
        } else if (data.status === 'active' && data.previousStatus === 'trialing') {
          console.log('Tracking trial converted event from verify-payment');
          analyticsService.trackTrialConverted();
        }
      }

      return true;
    } catch (err) {
      console.error('Error verifying payment:', err);
      
      try {
        if (user && user.id) {
          console.log('Attempting direct profile update as fallback');
          await updateProfilePremiumStatus(user.id, true);
          updateLocalStoragePremium(true);
          await refreshSession();
          setSuccess(true);
          
          toast.success('Twoje konto zostało zaktualizowane do wersji Premium!');
          
          setTimeout(() => {
            navigate('/projekty');
          }, 2000);
          
          return true;
        }
      } catch (fallbackErr) {
        console.error('Failed fallback profile update:', fallbackErr);
      }
      
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas weryfikacji płatności');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (billingCycle: BillingCycle) => {
    if (isLoading) return;
    
    if (!user) {
      toast.error('Musisz być zalogowany, aby kontynuować');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Creating ${billingCycle} subscription for user:`, user.email);
      sessionStorage.setItem('redirectingToStripe', 'true');
      
      const { data, error: checkoutError } = await supabase.functions.invoke('stripe-checkout', {
        body: { 
          priceId: 'price_1REoq0P9eOGurTfE6HuKkge0',
          mode: 'subscription',
          trialPeriodDays: 3
        }
      });
      
      if (checkoutError) {
        throw new Error(`Checkout error: ${checkoutError.message}`);
      }
      
      if (!data?.url) {
        throw new Error('Nie otrzymano URL do płatności');
      }
      
      sessionStorage.setItem('stripeCheckoutStarted', Date.now().toString());
      
      console.log('Redirecting to Stripe Checkout URL:', data.url);
      window.location.href = data.url;
      
    } catch (err) {
      console.error('Error in subscription process:', err);
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas tworzenia subskrypcji');
      sessionStorage.removeItem('redirectingToStripe');
      setIsLoading(false);
      
      toast.error('Nie udało się utworzyć sesji płatności', { 
        description: 'Spróbuj ponownie za chwilę lub skontaktuj się z obsługą.'
      });
    }
  };

  return {
    isLoading,
    setIsLoading,
    error,
    success,
    verifyPayment,
    handleSubscribe
  };
}
