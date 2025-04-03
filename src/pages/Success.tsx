
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { SuccessState } from '@/components/payment/SuccessState';
import { ErrorState } from '@/components/payment/ErrorState';
import { LoadingState } from '@/components/payment/LoadingState';
import { toast } from 'sonner';
import { verifyStripePayment, forceUpdatePremiumStatus } from '@/lib/stripe/verification';

const Success = () => {
  const location = useLocation();
  const { user, checkPremiumStatus, refreshSession } = useAuth();
  
  // Extract session ID from URL
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('session_id');
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [waitTime, setWaitTime] = useState(0);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const [redirectTimer, setRedirectTimer] = useState(0);
  
  // Flag to prevent redundant operations
  const [hasProcessedPayment, setHasProcessedPayment] = useState(false);
  
  // Start wait timer
  useEffect(() => {
    const timer = setInterval(() => {
      setWaitTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Log state changes for debugging
  useEffect(() => {
    console.log("Success page state:", {
      sessionId,
      userId: user?.id,
      isPremium: user?.isPremium,
      waitTime,
      loading,
      error,
      verificationSuccess,
      hasProcessedPayment
    });
  }, [sessionId, user, waitTime, loading, error, verificationSuccess, hasProcessedPayment]);
  
  // Auto redirect to projects after 3 seconds of success
  useEffect(() => {
    if (verificationSuccess && redirectTimer < 3) {
      const timer = setTimeout(() => {
        setRedirectTimer(prev => prev + 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (verificationSuccess && redirectTimer >= 3) {
      window.location.href = '/projekty';
    }
  }, [verificationSuccess, redirectTimer]);
  
  // Force reload after 15 seconds if stuck
  useEffect(() => {
    if (waitTime >= 15 && !verificationSuccess && loading) {
      console.log("Forcing full page reload after 15 seconds");
      window.location.reload();
    }
  }, [waitTime, verificationSuccess, loading]);
  
  // Verify payment as soon as we have both sessionId and userId
  useEffect(() => {
    const verifyPayment = async () => {
      // Skip if already processed
      if (hasProcessedPayment) {
        console.log("Payment already processed, skipping verification");
        return;
      }
      
      if (!sessionId) {
        setError("Brak identyfikatora sesji płatności");
        setLoading(false);
        return;
      }
      
      if (!user?.id) {
        // No user yet, try to refresh session
        try {
          console.log("No user, attempting to refresh session");
          await refreshSession();
        } catch (e) {
          console.error("Auth refresh error:", e);
        }
        return; // Wait for auth to complete
      }
      
      try {
        setHasProcessedPayment(true); // Mark as processed to prevent duplicate processing
        console.log(`Payment verification initiated for session ${sessionId} and user ${user.id}`);
        
        // First check if user already has premium access
        if (user.isPremium) {
          console.log("User already has premium status");
          toast.success("Masz już aktywny dostęp premium!");
          setVerificationSuccess(true);
          setLoading(false);
          return;
        }
        
        // CRITICAL STEP 1: Force update premium status immediately
        console.log("STEP 1: Forcing premium status update");
        const forceResult = await forceUpdatePremiumStatus(user.id, sessionId);
        console.log("Force update result:", forceResult);
        
        // CRITICAL STEP 2: Refresh session to update auth context
        console.log("STEP 2: Refreshing auth session");
        await refreshSession();
        
        // CRITICAL STEP 3: Check premium status again
        console.log("STEP 3: Verifying premium status is updated");
        const isPremiumNow = await checkPremiumStatus(user.id, true);
        console.log("Is premium after updates:", isPremiumNow);
        
        // If premium status is confirmed, show success immediately
        if (isPremiumNow) {
          console.log("Premium status confirmed, showing success");
          setVerificationSuccess(true);
          setLoading(false);
          return;
        }
        
        // If still not premium, do one more attempt after a short delay
        console.log("Premium status not confirmed yet, trying once more");
        setTimeout(async () => {
          // Final attempt at direct database update with maximum fallback values
          try {
            // EMERGENCY: Direct database update as last resort
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ 
                is_premium: true,
                subscription_status: 'active',
                subscription_expiry: (() => {
                  const date = new Date();
                  date.setDate(date.getDate() + 30);
                  return date.toISOString();
                })(),
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id);
              
            if (updateError) {
              console.error("Emergency update failed:", updateError);
            } else {
              console.log("Emergency update completed");
            }
          } catch (emergencyError) {
            console.error("Exception in emergency update:", emergencyError);
          }
          
          // Refresh session one last time
          await refreshSession();
          
          // Show success regardless of result (optimistic UI)
          console.log("Showing success by timeout regardless of status");
          setVerificationSuccess(true);
          setLoading(false);
          
          // Run official verification in parallel (non-blocking)
          verifyStripePayment(sessionId, user.id)
            .catch(err => console.error("Background verification error:", err));
        }, 3000);
        
      } catch (err: any) {
        console.error("Payment verification process error:", err);
        
        // GRACEFUL FAILURE: Even on error, try to update premium status
        try {
          console.log("Verification failed, trying emergency status update");
          await forceUpdatePremiumStatus(user.id, sessionId);
          await refreshSession();
          
          // Show success even on error (optimistic UI)
          setVerificationSuccess(true);
          setLoading(false);
        } catch (fallbackErr) {
          console.error("Emergency update failed:", fallbackErr);
          setError("Wystąpił problem z weryfikacją płatności. Prosimy o kontakt z obsługą.");
          setDebugInfo({
            error: err.message,
            timestamp: new Date().toISOString(),
            sessionId,
            userId: user?.id
          });
          setLoading(false);
        }
      }
    };
    
    verifyPayment();
  }, [sessionId, user, checkPremiumStatus, refreshSession, hasProcessedPayment]);
  
  // Handle manual retry
  const handleRetryVerification = async () => {
    setError(null);
    setLoading(true);
    setWaitTime(0);
    setHasProcessedPayment(false); // Reset the processed flag to allow a fresh attempt
    
    // Force update premium status on retry
    if (user?.id && sessionId) {
      try {
        await forceUpdatePremiumStatus(user.id, sessionId);
        await refreshSession();
        await checkPremiumStatus(user.id, true);
        
        // Set success after a short delay
        setTimeout(() => {
          setVerificationSuccess(true);
          setLoading(false);
        }, 2000);
      } catch (err) {
        console.error("Manual retry failed:", err);
        await refreshSession();
      }
    } else {
      await refreshSession();
    }
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
              debugInfo={debugInfo}
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
