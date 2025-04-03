
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
            setError("Could not authenticate user. Please log in and try again.");
            setLoading(false);
            setDebugInfo(prev => ({
              ...prev,
              authError: "Failed to refresh session after multiple attempts",
              timestamp: new Date().toISOString()
            }));
          }
        } catch (err) {
          console.error("Auth refresh error:", err);
          setError("Authentication error. Please try logging in again.");
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
        setError("No session ID provided");
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
          toast.success("You already have premium access!");
          setVerificationSuccess(true);
          setLoading(false);
          return;
        }
        
        // Set up parallel verification methods for redundancy
        // 1. Check payment logs in database
        const checkLogsPromise = supabase
          .from('payment_logs')
          .select('*')
          .eq('session_id', sessionId)
          .eq('user_id', user.id)
          .single();
          
        // 2. Verify with direct Stripe API call via our edge function
        const verifyWithStripePromise = supabase.functions.invoke('verify-payment-session', {
          body: { sessionId, userId: user.id }
        });
        
        // Set timeout for verification (15 seconds max)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Verification request timed out"));
          }, 15000);
        });
        
        // Check payment logs first (fastest)
        console.log("Checking payment logs first");
        const { data: logData, error: logError } = await checkLogsPromise;
        
        if (logData) {
          console.log("Payment found in logs, confirming premium status");
          const isPremium = await checkPremiumStatus(user.id, true);
          
          if (isPremium) {
            console.log("Premium status confirmed from logs!");
            toast.success("Your payment has been processed successfully!");
            setVerificationSuccess(true);
            setLoading(false);
            return;
          }
          
          console.log("Found in logs but premium flag not set, updating status");
          // Try to update the user's premium status
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ is_premium: true })
            .eq('id', user.id);
            
          if (!updateError) {
            toast.success("Your premium status has been activated!");
            setVerificationSuccess(true);
            setLoading(false);
            return;
          }
        }
        
        // If not found in logs, continue with Stripe verification
        console.log("Payment not found in logs, verifying with Stripe");
        try {
          // Race between verification and timeout
          const verifyResponse = await Promise.race([
            verifyWithStripePromise,
            timeoutPromise
          ]);
          
          const { data, error } = verifyResponse as any;
          
          if (error) {
            throw new Error(error.message || "Verification failed");
          }
          
          if (data?.success) {
            console.log("Payment verified successfully with Stripe!");
            
            // Verify profile update
            const isPremium = await checkPremiumStatus(user.id, true);
            
            if (isPremium) {
              toast.success("Welcome to Premium! Your payment has been processed.");
            } else {
              toast.success("Payment successful! Your premium access will be activated shortly.");
            }
            
            setVerificationSuccess(true);
            setLoading(false);
          } else {
            throw new Error(data?.message || "Payment verification failed");
          }
        } catch (verifyError: any) {
          console.error("Stripe verification error:", verifyError);
          
          // If it's a timeout but we already found the payment in logs
          if (verifyError.message.includes("timed out") && logData) {
            console.log("Verification timed out but payment found in logs");
            toast.success("Your payment has been processed!");
            setVerificationSuccess(true);
            setLoading(false);
            return;
          }
          
          // Handle specific error types
          if (verifyError.message.includes("timed out")) {
            setError("Verification is taking longer than expected. The system will continue processing your payment. Please check back later.");
          } else {
            setError("There was a problem verifying your payment. If your card was charged, your account will be updated shortly.");
          }
          
          setDebugInfo({
            error: verifyError.message,
            timestamp: new Date().toISOString(),
            verificationAttempt,
            sessionId,
            userId: user.id
          });
          
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Payment verification process error:", err);
        setError("There was a problem processing your payment verification.");
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
  }, [sessionId, user, waitingForAuth, checkPremiumStatus, verificationAttempt]);
  
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
