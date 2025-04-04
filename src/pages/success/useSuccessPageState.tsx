
import { useState, useEffect, useCallback } from 'react';
import { useSuccessStatusVerification } from './useSuccessStatusVerification';
import { supabase } from '@/integrations/supabase/client';
import { updateLocalStoragePremium } from '@/lib/stripe/localStorage-utils';
import { User } from '@supabase/supabase-js';

/**
 * Handle state and timers for success page
 */
export const useSuccessPageState = (
  user: User | null,
  isPremium: boolean,
  sessionId: string | null,
  refreshSession: () => Promise<boolean>
) => {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [waitTime, setWaitTime] = useState(0);
  const [redirectTimer, setRedirectTimer] = useState(0);
  const [processAttempts, setProcessAttempts] = useState(0);
  const [forceRedirect, setForceRedirect] = useState(false);
  
  // Get verification utilities
  const { verifyPaymentSuccess, updateProfileDirectly } = useSuccessStatusVerification();
  
  // Start wait timer
  useEffect(() => {
    const timer = setInterval(() => {
      setWaitTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Auto redirect after success with shorter timeout
  useEffect(() => {
    if ((verificationSuccess || isPremium) && redirectTimer < 2) {
      const timer = setTimeout(() => {
        setRedirectTimer(prev => prev + 1);
      }, 800); // Faster redirection
      
      return () => clearTimeout(timer);
    } else if ((verificationSuccess || isPremium) && redirectTimer >= 2) {
      console.log("[SUCCESS-PAGE] Redirecting to /projekty after success");
      // Use window.location for a full page refresh to ensure auth state is updated
      window.location.href = '/projekty';
    }
  }, [verificationSuccess, redirectTimer, isPremium]);
  
  // Force redirect after 10 seconds regardless of verification
  useEffect(() => {
    if (waitTime >= 10 && !forceRedirect) {
      console.log("[SUCCESS-PAGE] Force redirecting after 10 seconds regardless of status");
      setForceRedirect(true);
      
      // Store session information to indicate payment was processed
      sessionStorage.setItem('paymentProcessed', 'true');
      
      // Set premium in local storage as a backup mechanism
      updateLocalStoragePremium(true);
      
      // Force one more direct update to DB
      if (user?.id) {
        updateProfileDirectly(user.id)
          .then(() => {
            console.log("[SUCCESS-PAGE] Final DB update before redirect");
            
            // Redirect to projects page after one final attempt
            setTimeout(() => {
              window.location.href = '/projekty';
            }, 500);
          });
      } else {
        // No user, just redirect
        setTimeout(() => {
          window.location.href = '/projekty';
        }, 500);
      }
    }
  }, [waitTime, user, forceRedirect, updateProfileDirectly]);
  
  // Handle manual completion (used in timeout and retry)
  const handleManualCompletion = useCallback(async () => {
    if (!user?.id || !sessionId) {
      console.error("[SUCCESS-PAGE] Cannot complete verification - missing user or sessionId");
      setError("Brak danych użytkownika lub sesji. Proszę zalogować się ponownie.");
      setLoading(false);
      return;
    }
    
    try {
      console.log("[SUCCESS-PAGE] Manual completion initiated");
      
      const success = await verifyPaymentSuccess(user, sessionId, refreshSession);
      
      if (success) {
        setVerificationSuccess(true);
        setLoading(false);
      } else {
        throw new Error("Verification failed");
      }
    } catch (error) {
      console.error("[SUCCESS-PAGE] Error in manual completion:", error);
      
      // Final emergency attempt
      try {
        console.log("[SUCCESS-PAGE] Attempting emergency direct update");
        
        const success = await updateProfileDirectly(user.id);
          
        if (!success) {
          console.error("[SUCCESS-PAGE] Emergency update failed");
          setError("Wystąpił błąd podczas aktualizacji konta. Prosimy odświeżyć stronę.");
          setLoading(false);
        } else {
          console.log("[SUCCESS-PAGE] Emergency update succeeded");
          sessionStorage.setItem('paymentProcessed', 'true');
          setVerificationSuccess(true);
          setLoading(false);
          
          updateLocalStoragePremium(true);
        }
      } catch (finalError) {
        console.error("[SUCCESS-PAGE] Final emergency attempt failed:", finalError);
        setError("Wystąpił błąd podczas aktualizacji konta. Prosimy odświeżyć stronę.");
        setLoading(false);
      }
    }
  }, [user, sessionId, refreshSession, verifyPaymentSuccess, updateProfileDirectly]);
  
  // Handle manual retry
  const handleManualRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    setWaitTime(0);
    setProcessAttempts(0);
    refreshSession();
  }, [refreshSession]);
  
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
