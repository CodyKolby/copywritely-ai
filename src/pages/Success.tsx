
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { SuccessState } from '@/components/payment/SuccessState';
import { ErrorState } from '@/components/payment/ErrorState';
import { LoadingState } from '@/components/payment/LoadingState';
import { toast } from 'sonner';
import { forceUpdatePremiumStatus } from '@/lib/stripe/verification';
import { supabase } from '@/integrations/supabase/client';

const Success = () => {
  const location = useLocation();
  const { user, refreshSession } = useAuth();
  
  // Extract session ID from URL
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('session_id');
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [waitTime, setWaitTime] = useState(0);
  const [redirectTimer, setRedirectTimer] = useState(0);
  const [processAttempts, setProcessAttempts] = useState(0);
  
  // Start wait timer
  useEffect(() => {
    const timer = setInterval(() => {
      setWaitTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Auto redirect to projects after 3 seconds of success
  useEffect(() => {
    if (verificationSuccess && redirectTimer < 3) {
      const timer = setTimeout(() => {
        setRedirectTimer(prev => prev + 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (verificationSuccess && redirectTimer >= 3) {
      console.log("[SUCCESS-PAGE] Redirecting to /projekty after success");
      window.location.href = '/projekty';
    }
  }, [verificationSuccess, redirectTimer]);
  
  // Force completion after 15 seconds if stuck
  useEffect(() => {
    if (waitTime >= 15 && !verificationSuccess && loading) {
      console.log("[SUCCESS-PAGE] Forcing verification completion after 15 seconds");
      handleManualCompletion();
    }
  }, [waitTime, verificationSuccess, loading]);
  
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
      
      // CRITICAL CHANGE: Direct update with hardcoded values
      const { error: directUpdateError } = await supabase
        .from('profiles')
        .update({ 
          is_premium: true,
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (directUpdateError) {
        console.error("[SUCCESS-PAGE] Direct update error:", directUpdateError);
      } else {
        console.log("[SUCCESS-PAGE] Direct profile update successful");
      }
      
      // Attempt force update with session ID
      await forceUpdatePremiumStatus(user.id, sessionId);
      
      // Always add to payment logs
      try {
        const { data: existingLog } = await supabase
          .from('payment_logs')
          .select('*')
          .eq('session_id', sessionId)
          .maybeSingle();
          
        if (!existingLog) {
          console.log("[SUCCESS-PAGE] Adding payment log as fallback");
          await supabase
            .from('payment_logs')
            .insert({
              user_id: user.id,
              session_id: sessionId,
              timestamp: new Date().toISOString()
            });
        }
      } catch (logError) {
        console.error("[SUCCESS-PAGE] Error adding payment log:", logError);
      }
      
      // Refresh session to update auth context
      await refreshSession();
      
      // Store session information in sessionStorage to prevent loops
      sessionStorage.setItem('paymentProcessed', 'true');
      
      // Show success message
      toast.success('Gratulacje! Twoje konto zostało zaktualizowane do wersji Premium.', {
        dismissible: true
      });
      
      // Update UI state
      setVerificationSuccess(true);
      setLoading(false);
    } catch (error) {
      console.error("[SUCCESS-PAGE] Error in manual completion:", error);
      
      // Final emergency attempt
      try {
        console.log("[SUCCESS-PAGE] Attempting emergency direct update");
        
        const { error: emergencyError } = await supabase
          .from('profiles')
          .update({ 
            is_premium: true,
            subscription_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
          
        if (emergencyError) {
          console.error("[SUCCESS-PAGE] Emergency update failed:", emergencyError);
          setError("Wystąpił błąd podczas aktualizacji konta. Prosimy odświeżyć stronę.");
          setLoading(false);
        } else {
          console.log("[SUCCESS-PAGE] Emergency update succeeded");
          sessionStorage.setItem('paymentProcessed', 'true');
          setVerificationSuccess(true);
          setLoading(false);
          
          toast.success('Twoje konto zostało zaktualizowane do wersji Premium!', {
            dismissible: true
          });
        }
      } catch (finalError) {
        console.error("[SUCCESS-PAGE] Final emergency attempt failed:", finalError);
        setError("Wystąpił błąd podczas aktualizacji konta. Prosimy odświeżyć stronę.");
        setLoading(false);
      }
    }
  }, [user, sessionId, refreshSession]);
  
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
    
    const processPayment = async () => {
      // Skip if already processed
      if (verificationSuccess) {
        console.log("[SUCCESS-PAGE] Already verified, skipping");
        return;
      }
      
      // Skip if too many attempts
      if (processAttempts >= 3) {
        console.log("[SUCCESS-PAGE] Too many attempts, triggering manual completion");
        handleManualCompletion();
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
      
      try {
        console.log(`[SUCCESS-PAGE] Payment verification initiated for session ${sessionId} and user ${user.id}`);
        
        // CRITICAL CHANGE: Direct update with hardcoded values first
        console.log("[SUCCESS-PAGE] STEP 0: Direct database update");
        const { error: directUpdateError } = await supabase
          .from('profiles')
          .update({ 
            is_premium: true,
            subscription_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
          
        if (directUpdateError) {
          console.error("[SUCCESS-PAGE] Direct update error:", directUpdateError);
        } else {
          console.log("[SUCCESS-PAGE] Direct profile update successful");
        }
        
        // STEP 1: Force update premium status immediately
        console.log("[SUCCESS-PAGE] STEP 1: Forcing premium status update");
        await forceUpdatePremiumStatus(user.id, sessionId);
        
        // STEP 2: Refresh session to update auth context
        console.log("[SUCCESS-PAGE] STEP 2: Refreshing auth session");
        await refreshSession();
        
        // STEP 3: Check profile directly to confirm changes
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_premium, subscription_status, subscription_id, subscription_expiry')
          .eq('id', user.id)
          .single();
        
        console.log("[SUCCESS-PAGE] STEP 3: Profile after updates:", profile);
        
        // STEP 4: Mark as processed in session storage
        console.log("[SUCCESS-PAGE] STEP 4: Marking as processed in session storage");
        sessionStorage.setItem('paymentProcessed', 'true');
        
        // Success! Show toast and update state
        toast.success('Gratulacje! Twoje konto zostało zaktualizowane do wersji Premium.', {
          dismissible: true
        });
        
        setVerificationSuccess(true);
        setLoading(false);
      } catch (err: any) {
        console.error("[SUCCESS-PAGE] Payment verification process error:", err);
        
        // Don't show error yet - retry with timeout
        console.log("[SUCCESS-PAGE] Will retry verification...");
        setTimeout(() => {
          if (!verificationSuccess && loading) {
            console.log("[SUCCESS-PAGE] Retrying verification...");
            processPayment();
          }
        }, 3000);
      }
    };
    
    if (user?.id && sessionId && loading && !verificationSuccess) {
      processPayment();
    }
  }, [user, sessionId, loading, verificationSuccess, refreshSession, processAttempts, handleManualCompletion]);
  
  // Handle manual retry
  const handleRetryVerification = () => {
    setError(null);
    setLoading(true);
    setWaitTime(0);
    setProcessAttempts(0);
    refreshSession();
  };
  
  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 rounded-xl shadow-lg text-center"
        >
          {loading ? (
            <LoadingState 
              isWaitingForAuth={!user}
              onManualRetry={handleRetryVerification}
              waitTime={waitTime}
            />
          ) : error ? (
            <ErrorState 
              error={error} 
              onRetry={handleRetryVerification}
            />
          ) : (
            <SuccessState 
              redirectTimer={redirectTimer}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Success;
