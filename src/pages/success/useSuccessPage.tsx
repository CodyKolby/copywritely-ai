
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useSuccessPageState } from './useSuccessPageState';
import { toast } from 'sonner';

interface SuccessPageProps {
  sessionId: string | null;
}

export const useSuccessPage = ({ sessionId }: SuccessPageProps) => {
  const { user, isPremium, refreshSession } = useAuth();
  
  const {
    loading,
    error,
    verificationSuccess,
    waitTime,
    redirectTimer,
    handleManualCompletion,
    handleManualRetry
  } = useSuccessPageState(
    user,
    isPremium,
    sessionId,
    refreshSession
  );
  
  // Start verification process on component mount
  useEffect(() => {
    console.log("[SUCCESS-PAGE] Component mounted, starting verification");
    
    // If the user is already premium, no need to verify
    if (isPremium) {
      console.log("[SUCCESS-PAGE] User already has premium status");
      return;
    }
    
    // If we have session ID and user, try to verify
    if (sessionId && user) {
      console.log("[SUCCESS-PAGE] Starting verification with sessionId:", sessionId);
      // Show toast to indicate verification is in progress
      toast.info("Weryfikacja płatności w toku...");
      
      // Start verification
      handleManualCompletion();
    } else if (!sessionId) {
      console.error("[SUCCESS-PAGE] Missing sessionId for verification");
      toast.error("Brak identyfikatora sesji płatności.");
    }
  }, [sessionId, user, isPremium, handleManualCompletion]);
  
  return {
    loading,
    error,
    verificationSuccess,
    waitTime,
    redirectTimer,
    handleManualRetry
  };
};
