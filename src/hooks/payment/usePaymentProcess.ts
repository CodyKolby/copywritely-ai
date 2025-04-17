
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { updateLocalStoragePremium } from '@/lib/stripe/localStorage-utils';

export interface PaymentProcessResult {
  success: boolean;
  error: string | null;
  isProcessing: boolean;
  verifyPayment: (sessionId: string) => Promise<boolean>;
}

export function usePaymentProcess(): PaymentProcessResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { user, refreshSession, isPremium } = useAuth();

  // Clear any stale payment flags
  useEffect(() => {
    // Only clear if we're not on the success page
    if (!window.location.pathname.includes('/success')) {
      sessionStorage.removeItem('redirectingToStripe');
      sessionStorage.removeItem('stripeCheckoutInProgress');
    }
  }, []);

  // Process payment verification
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

    setIsProcessing(true);
    setError(null);

    try {
      console.log(`Verifying payment for session ID: ${sessionId}`);

      // Call the edge function to verify the payment
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

      // Update local storage premium status
      updateLocalStoragePremium(true);
      
      // Refresh the session to update the auth context
      await refreshSession();
      
      // Show success notification
      toast.success('Gratulacje! Twoje konto zostało zaktualizowane do wersji Premium.');
      
      // Set success state
      setSuccess(true);
      
      // Redirect to projects page after a short delay
      setTimeout(() => {
        navigate('/projekty');
      }, 2000);
      
      return true;
    } catch (err) {
      console.error('Error verifying payment:', err);
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas weryfikacji płatności');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return { isProcessing, error, success, verifyPayment };
}
