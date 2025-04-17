
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { updateLocalStoragePremium } from '@/lib/stripe/localStorage-utils';
import { updateProfilePremiumStatus } from '@/lib/stripe/profile-updates';

export const useSuccessPageState = (
  user: User | null,
  isPremium: boolean,
  sessionId: string | null,
  refreshSession: () => Promise<boolean>
) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [waitTime, setWaitTime] = useState(30);
  const [redirectTimer, setRedirectTimer] = useState(0);
  const [processAttempts, setProcessAttempts] = useState(0);
  const navigate = useNavigate();

  // Force update profile directly when manual completion is needed
  const handleManualCompletion = useCallback(async () => {
    if (!user?.id) {
      console.error("[SUCCESS-PAGE] No user for manual completion");
      setError("Brak użytkownika, zaloguj się ponownie");
      setLoading(false);
      return;
    }
    
    try {
      console.log("[SUCCESS-PAGE] Performing manual completion");
      
      // CRITICAL: Direct profile update
      await updateProfilePremiumStatus(user.id, true);
      
      // Update localStorage
      updateLocalStoragePremium(true);
      
      // Refresh session
      await refreshSession();
      
      // Store in session storage that we processed payment
      sessionStorage.setItem('paymentProcessed', 'true');
      
      // Set success state
      setVerificationSuccess(true);
      setLoading(false);
      
      // Show success message
      toast.success('Twoje konto zostało zaktualizowane do wersji Premium!');
      
      // Start redirect countdown
      startRedirectCountdown();
    } catch (err) {
      console.error("[SUCCESS-PAGE] Error in manual completion:", err);
      setError("Nie udało się zaktualizować statusu konta. Spróbuj ponownie.");
      setLoading(false);
    }
  }, [user, refreshSession]);
  
  // Manual retry handler
  const handleManualRetry = useCallback(async () => {
    if (!user?.id || !sessionId) {
      setError("Brak danych do weryfikacji. Spróbuj ponownie później.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // CRITICAL: First try direct profile update 
      await updateProfilePremiumStatus(user.id, true);
      
      // Update localStorage
      updateLocalStoragePremium(true);
      
      // Refresh session
      await refreshSession();
      
      // Set success
      setVerificationSuccess(true);
      setLoading(false);
      
      // Start redirect
      startRedirectCountdown();
    } catch (err) {
      console.error("[SUCCESS-PAGE] Manual retry failed:", err);
      setError("Weryfikacja nie powiodła się. Skontaktuj się z obsługą.");
      setLoading(false);
    }
  }, [user, sessionId, refreshSession]);
  
  // Start redirect countdown
  const startRedirectCountdown = useCallback(() => {
    setRedirectTimer(5);
    
    const interval = setInterval(() => {
      setRedirectTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate('/projekty');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [navigate]);
  
  // Wait time countdown
  useEffect(() => {
    if (loading && !verificationSuccess) {
      const interval = setInterval(() => {
        setWaitTime(prev => Math.max(0, prev - 1));
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [loading, verificationSuccess]);
  
  // If manual verification is needed after waiting
  useEffect(() => {
    if (waitTime === 0 && loading && !verificationSuccess && !error) {
      handleManualCompletion();
    }
  }, [waitTime, loading, verificationSuccess, error, handleManualCompletion]);
  
  // Start redirect countdown after success
  useEffect(() => {
    if (verificationSuccess && !redirectTimer) {
      startRedirectCountdown();
    }
  }, [verificationSuccess, redirectTimer, startRedirectCountdown]);

  return {
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
  };
};
