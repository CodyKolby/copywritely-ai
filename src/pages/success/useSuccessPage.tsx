
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useSuccessPageState } from './useSuccessPageState';
import { useSuccessStatusVerification } from './useSuccessStatusVerification';

interface UseSuccessPageProps {
  sessionId: string | null;
}

interface UseSuccessPageResult {
  loading: boolean;
  error: string | null;
  verificationSuccess: boolean;
  waitTime: number;
  redirectTimer: number;
  handleManualRetry: () => void;
}

export const useSuccessPage = ({ sessionId }: UseSuccessPageProps): UseSuccessPageResult => {
  const { user, refreshSession, isPremium } = useAuth();
  const { verifyPaymentSuccess } = useSuccessStatusVerification();
  
  // Set up state management
  const {
    loading,
    setLoading,
    error,
    setError,
    verificationSuccess,
    setVerificationSuccess,
    waitTime,
    redirectTimer,
    processAttempts,
    setProcessAttempts,
    handleManualCompletion,
    handleManualRetry
  } = useSuccessPageState(user, isPremium, sessionId, refreshSession);
  
  // Check for isPremium directly from auth context
  useEffect(() => {
    if (isPremium && loading) {
      console.log("[SUCCESS-PAGE] User already has premium status from auth context");
      setVerificationSuccess(true);
      setLoading(false);
    }
  }, [isPremium, loading, setVerificationSuccess, setLoading]);
  
  // Process payment verification when we have user and sessionId
  useEffect(() => {
    const successToastShown = sessionStorage.getItem('paymentProcessed') === 'true';
    
    // Skip if already processed
    if (successToastShown) {
      console.log("[SUCCESS-PAGE] Payment already processed, showing success");
      setVerificationSuccess(true);
      setLoading(false);
      return;
    }
    
    // Skip if already verified
    if (verificationSuccess) {
      return;
    }
    
    // Skip if too many attempts - force manual completion
    if (processAttempts >= 2) {
      console.log("[SUCCESS-PAGE] Too many attempts, triggering manual completion");
      handleManualCompletion();
      return;
    }
    
    const processPayment = async () => {
      // Skip if already processed
      if (verificationSuccess) {
        console.log("[SUCCESS-PAGE] Already verified, skipping");
        return;
      }
      
      if (!sessionId) {
        console.error("[SUCCESS-PAGE] No session ID found in URL");
        setError("Brak identyfikatora sesji płatności");
        setLoading(false);
        return;
      }
      
      if (!user?.id) {
        try {
          console.log("[SUCCESS-PAGE] No user, attempting to refresh session");
          await refreshSession();
        } catch (e) {
          console.error("[SUCCESS-PAGE] Auth refresh error:", e);
        }
        return; // Wait for auth to complete
      }
      
      setProcessAttempts(prev => prev + 1);
      
      // Use the centralized verification handler
      const success = await verifyPaymentSuccess(user, sessionId, refreshSession);
      
      if (success) {
        setVerificationSuccess(true);
        setLoading(false);
      } else {
        // If verification failed, trigger manual completion
        console.log("[SUCCESS-PAGE] Automatic verification failed, trying manual completion");
        handleManualCompletion();
      }
    };
    
    if (user?.id && sessionId && loading && !verificationSuccess) {
      processPayment();
    }
  }, [
    user, 
    sessionId, 
    loading, 
    verificationSuccess, 
    refreshSession, 
    processAttempts, 
    handleManualCompletion,
    setVerificationSuccess,
    setLoading,
    setError,
    setProcessAttempts,
    verifyPaymentSuccess
  ]);
  
  return {
    loading,
    error,
    verificationSuccess, 
    waitTime,
    redirectTimer,
    handleManualRetry
  };
};
