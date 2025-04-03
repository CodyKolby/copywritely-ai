
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
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
  const [verificationAttempt, setVerificationAttempt] = useState(0);
  const [waitingForAuth, setWaitingForAuth] = useState(true);
  const [waitTime, setWaitTime] = useState(0);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  
  // Reference for timing
  const verificationTimeoutRef = useRef<number | null>(null);
  const waitingTimerRef = useRef<number | null>(null);
  
  // Start wait timer
  useEffect(() => {
    if (loading) {
      waitingTimerRef.current = window.setInterval(() => {
        setWaitTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (waitingTimerRef.current) {
        clearInterval(waitingTimerRef.current);
      }
    };
  }, [loading]);
  
  // Add console logs to track component lifecycle
  useEffect(() => {
    console.log('Success page mounted, sessionId:', sessionId);
    
    // Initialize tracking flag in session storage if not already set
    if (!sessionStorage.getItem('paymentProcessed')) {
      sessionStorage.setItem('paymentProcessed', 'false');
    }
    
    return () => {
      console.log('Success page unmounted');
      // Clear any timeouts
      if (verificationTimeoutRef.current) {
        clearTimeout(verificationTimeoutRef.current);
      }
      if (waitingTimerRef.current) {
        clearInterval(waitingTimerRef.current);
      }
    };
  }, [sessionId]);
  
  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      if (user) {
        console.log('User authenticated:', user.id);
        setWaitingForAuth(false);
        return;
      }
      
      console.log('No user, attempting to refresh session');
      try {
        await refreshSession();
        // If we still don't have a user after refresh
        if (!user && verificationAttempt < 5) {
          console.log(`No user after refresh, retry ${verificationAttempt}/5`);
          setTimeout(() => {
            setVerificationAttempt(prev => prev + 1);
          }, 2000);
        } else if (!user) {
          setError('Nie udało się zidentyfikować użytkownika. Zaloguj się ponownie.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error refreshing session:', err);
        setError('Wystąpił błąd autoryzacji. Spróbuj zalogować się ponownie.');
        setLoading(false);
      }
    };
    
    if (waitingForAuth) {
      checkAuth();
    }
  }, [user, refreshSession, verificationAttempt, waitingForAuth]);
  
  // Verify payment when auth is confirmed
  useEffect(() => {
    let isMounted = true;
    
    const verifyPayment = async () => {
      // If no session ID, can't proceed with verification
      if (!sessionId) {
        console.error('No session ID provided');
        setError('Brak identyfikatora sesji płatności');
        setLoading(false);
        return;
      }
      
      // If no authenticated user, can't verify for a user
      if (!user) {
        return; // Auth check will handle this case
      }
      
      // Once we have both sessionId and user, proceed with verification
      console.log('Verifying payment', { sessionId, userId: user.id });
      
      try {
        // Set up a timeout promise to prevent hanging
        verificationTimeoutRef.current = window.setTimeout(() => {
          if (isMounted) {
            console.error('Verification timeout after 25 seconds');
            setError('Przekroczono czas oczekiwania na weryfikację płatności. Spróbuj odświeżyć stronę.');
            setLoading(false);
            setDebugInfo({
              error: 'Verification timeout',
              timestamp: new Date().toISOString(),
              verificationAttempt,
              sessionId,
              userId: user.id
            });
          }
        }, 25000);
        
        // Check if user already has premium status
        if (user.isPremium) {
          console.log('User already has premium status, skipping verification');
          clearTimeout(verificationTimeoutRef.current);
          verificationTimeoutRef.current = null;
          
          if (isMounted) {
            toast.success('Twoje konto już posiada status Premium!');
            setVerificationSuccess(true);
            setLoading(false);
          }
          return;
        }
        
        // Call our verification endpoint
        const { data, error } = await supabase.functions.invoke('verify-payment-session', {
          body: { sessionId, userId: user.id }
        });
        
        // Clear timeout since we got a response
        if (verificationTimeoutRef.current) {
          clearTimeout(verificationTimeoutRef.current);
          verificationTimeoutRef.current = null;
        }
        
        if (error) {
          console.error('Error from verification function:', error);
          throw error;
        }
        
        console.log('Verification response:', data);
        
        if (!data?.success) {
          throw new Error(data?.message || 'Weryfikacja płatności nie powiodła się');
        }
        
        // Update premium status
        const isPremium = await checkPremiumStatus(user.id, true);
        console.log('Premium status after verification:', isPremium);
        
        // Mark as successful regardless of premium status check
        // (it might take a moment for the database to update)
        if (isMounted) {
          toast.success('Twoja płatność została potwierdzona!', { duration: 5000 });
          sessionStorage.setItem('paymentProcessed', 'true');
          setVerificationSuccess(true);
          setLoading(false);
        }
        
      } catch (err: any) {
        console.error('Payment verification error:', err);
        
        // Clear timeout if it exists
        if (verificationTimeoutRef.current) {
          clearTimeout(verificationTimeoutRef.current);
          verificationTimeoutRef.current = null;
        }
        
        // Handle the error based on type
        if (isMounted) {
          setDebugInfo({
            error: err.message,
            timestamp: new Date().toISOString(),
            verificationAttempt,
            sessionId,
            userId: user.id
          });
          
          if (err.message.includes('time') || err.message.includes('timeout')) {
            setError('Przekroczono czas oczekiwania na weryfikację płatności. Spróbuj odświeżyć stronę.');
          } else {
            setError('Wystąpił błąd podczas weryfikacji płatności. Spróbuj odświeżyć stronę.');
          }
          setLoading(false);
        }
      }
    };
    
    // Start verification if we have auth but are still loading
    if (!waitingForAuth && loading) {
      verifyPayment();
    }
    
    return () => {
      isMounted = false;
      // Clear timeout on cleanup
      if (verificationTimeoutRef.current) {
        clearTimeout(verificationTimeoutRef.current);
      }
    };
  }, [sessionId, user, waitingForAuth, loading, verificationAttempt, checkPremiumStatus]);
  
  // Handle manual retry
  const handleRetryVerification = () => {
    console.log('Manually retrying verification');
    setLoading(true);
    setError(null);
    setWaitTime(0);
    setVerificationAttempt(prev => prev + 1);
    
    // Clear existing timeout
    if (verificationTimeoutRef.current) {
      clearTimeout(verificationTimeoutRef.current);
      verificationTimeoutRef.current = null;
    }
  };
  
  // Handle back to pricing
  const handleBackToPricing = () => {
    navigate('/pricing');
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
