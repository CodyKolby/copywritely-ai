
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { SuccessState } from '@/components/payment/SuccessState';
import { ErrorState } from '@/components/payment/ErrorState';
import { LoadingState } from '@/components/payment/LoadingState';
import { toast } from 'sonner';

const Success = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, checkPremiumStatus, refreshSession } = useAuth();
  
  // Extract session ID from URL
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('session_id');
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [waitTime, setWaitTime] = useState(0);
  const [waitingForAuth, setWaitingForAuth] = useState(false);
  const [verificationAttempt, setVerificationAttempt] = useState(0);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  
  // Start wait timer
  useEffect(() => {
    // Start a timer to track how long we've been waiting
    const timer = setInterval(() => {
      setWaitTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Log important information for debugging
  useEffect(() => {
    console.log("Success page initialized", {
      sessionId,
      userId: user?.id,
      isPremium: user?.isPremium,
      waitTime,
      verificationAttempt
    });
  }, [sessionId, user, waitTime, verificationAttempt]);
  
  // First check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        console.log("No user, waiting for auth...");
        setWaitingForAuth(true);
        
        try {
          console.log("Attempting to refresh session");
          const refreshed = await refreshSession();
          
          if (!refreshed && verificationAttempt < 3) {
            // Try again after a delay
            setTimeout(() => {
              setVerificationAttempt(prev => prev + 1);
            }, 2000);
          } else if (!refreshed) {
            setError("Nie udało się zweryfikować Twojego konta. Prosimy o zalogowanie się.");
            setLoading(false);
            setDebugInfo(prev => ({
              ...prev,
              authError: "Failed to refresh session after multiple attempts",
              timestamp: new Date().toISOString()
            }));
          }
        } catch (err) {
          console.error("Auth refresh error:", err);
          setError("Błąd autoryzacji. Spróbuj zalogować się ponownie.");
          setLoading(false);
        }
      } else {
        setWaitingForAuth(false);
      }
    };
    
    checkAuth();
  }, [user, refreshSession, verificationAttempt]);
  
  // Once authenticated, verify the payment
  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setError("Brak identyfikatora sesji płatności");
        setLoading(false);
        return;
      }
      
      if (!user?.id || waitingForAuth) {
        return; // Wait for authentication to complete
      }
      
      try {
        console.log(`Verifying payment for session ${sessionId} and user ${user.id}`);
        
        // First check if user already has premium access
        if (user.isPremium) {
          console.log("User already has premium status");
          if (waitTime > 1) { // Avoid immediate toast on page load
            toast.success("Masz już aktywny dostęp premium!");
          }
          setVerificationSuccess(true);
          setLoading(false);
          return;
        }
        
        // Set up parallel verification methods for redundancy
        // 1. Check payment logs in database
        const { data: logData, error: logError } = await supabase
          .from('payment_logs')
          .select('*')
          .eq('session_id', sessionId)
          .single();
        
        if (logData) {
          console.log("Payment found in logs, confirming premium status");
          
          // Force update of premium status
          try {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ is_premium: true })
              .eq('id', user.id);
              
            if (updateError) {
              console.error("Error updating premium status:", updateError);
            } else {
              console.log("Premium status updated successfully");
            }
          } catch (e) {
            console.error("Exception updating premium status:", e);
          }
          
          // Refresh user status
          await checkPremiumStatus(user.id, true);
          
          toast.success("Płatność została zrealizowana pomyślnie!");
          setVerificationSuccess(true);
          setLoading(false);
          return;
        }
        
        // 2. Verify with direct Stripe API call via our edge function
        try {
          console.log("Verifying payment with Stripe API");
          const { data, error } = await supabase.functions.invoke('verify-payment-session', {
            body: { sessionId, userId: user.id }
          });
          
          if (error) {
            throw new Error(error.message || "Verification failed");
          }
          
          console.log("Verification response:", data);
          
          if (data?.success) {
            console.log("Payment verified successfully!");
            
            // Force refresh of user premium status
            await checkPremiumStatus(user.id, true);
            
            toast.success("Witaj w Premium! Twoja płatność została zrealizowana.");
            setVerificationSuccess(true);
            setLoading(false);
            return;
          } else {
            throw new Error(data?.message || "Payment verification failed");
          }
        } catch (verifyError: any) {
          console.error("Verification error:", verifyError);
          
          if (waitTime > 20) {
            // After 20 seconds, try a manual update as a last resort
            console.log("Timeout reached, attempting manual profile update");
            
            try {
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ 
                  is_premium: true,
                  updated_at: new Date().toISOString()
                })
                .eq('id', user.id);
                
              if (!updateError) {
                console.log("Manual profile update successful");
                await checkPremiumStatus(user.id, true);
                
                toast.success("Płatność została zrealizowana!");
                setVerificationSuccess(true);
                setLoading(false);
                return;
              } else {
                console.error("Manual update failed:", updateError);
              }
            } catch (e) {
              console.error("Exception during manual update:", e);
            }
          }
          
          // If we've tried multiple times, show a friendly message
          if (verificationAttempt >= 2) {
            setError("Weryfikacja płatności trwa dłużej niż zwykle. Twoje konto zostanie zaktualizowane wkrótce.");
            setLoading(false);
          } else {
            // Try again with increasing delay
            const retryDelay = 5000 + (verificationAttempt * 2000);
            console.log(`Scheduling retry in ${retryDelay}ms`);
            
            setTimeout(() => {
              setVerificationAttempt(prev => prev + 1);
            }, retryDelay);
          }
        }
      } catch (err: any) {
        console.error("Payment verification process error:", err);
        setError("Wystąpił problem z weryfikacją płatności. Jeśli Twoja karta została obciążona, konto zostanie zaktualizowane wkrótce.");
        setDebugInfo({
          error: err.message,
          timestamp: new Date().toISOString(),
          verificationAttempt,
          sessionId,
          userId: user?.id
        });
        setLoading(false);
      }
    };
    
    verifyPayment();
  }, [sessionId, user, waitingForAuth, checkPremiumStatus, verificationAttempt, waitTime]);
  
  // Handle manual retry
  const handleRetryVerification = () => {
    setError(null);
    setLoading(true);
    setWaitTime(0);
    setVerificationAttempt(prev => prev + 1);
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
              isWaitingForAuth={waitingForAuth} 
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
            <SuccessState />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Success;
