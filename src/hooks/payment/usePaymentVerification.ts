
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function usePaymentVerification(sessionId: string | null) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationAttempt, setVerificationAttempt] = useState(0);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [waitingForAuth, setWaitingForAuth] = useState(true);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const { user, checkPremiumStatus, isPremium, refreshSession } = useAuth();
  const verificationTimeoutRef = useRef<number | null>(null);
  
  const successToastShown = sessionStorage.getItem('paymentProcessed') === 'true';

  // Log initial hook state
  useEffect(() => {
    console.log('usePaymentVerification initialized:', { 
      sessionId, 
      hasUser: !!user,
      userId: user?.id,
      isPremium
    });
    
    return () => {
      // Clear any timeouts when the hook unmounts
      if (verificationTimeoutRef.current) {
        window.clearTimeout(verificationTimeoutRef.current);
      }
    };
  }, [sessionId, user, isPremium]);

  // Handle retry verification
  const handleRetryVerification = async () => {
    console.log('Manually retrying verification');
    setError(null);
    setLoading(true);
    setWaitingForAuth(true);
    setVerificationAttempt(0);
    
    // Clear any existing timeouts
    if (verificationTimeoutRef.current) {
      window.clearTimeout(verificationTimeoutRef.current);
      verificationTimeoutRef.current = null;
    }
    
    // Try to manually refresh auth
    try {
      console.log('Manually refreshing session before retry');
      const refreshResult = await refreshSession();
      console.log('Manual session refresh result:', refreshResult);
    } catch (e) {
      console.error("Exception refreshing auth on manual retry:", e);
      setDebugInfo(prev => ({ ...prev, refreshError: String(e) }));
    }
  };

  // Check authentication status with retry mechanism
  useEffect(() => {
    const checkAuthWithRetry = async () => {
      console.log("Checking authentication status...");
      
      // If we already have a user, we can proceed
      if (user?.id) {
        console.log("User already authenticated:", user.id);
        setWaitingForAuth(false);
        return;
      }
      
      try {
        // Get current session to check auth status
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting session:", sessionError);
          setDebugInfo(prev => ({ ...prev, sessionError: String(sessionError) }));
        }
        
        if (session?.user) {
          console.log("Found session for user:", session.user.id);
          setWaitingForAuth(false);
        } else {
          // No session and no session ID means we can't proceed
          if (!sessionId) {
            console.error("No session ID and no authenticated user");
            setError("Nie jesteś zalogowany. Zaloguj się, aby kontynuować.");
            setLoading(false);
            return;
          }
          
          console.log("No user session but have Stripe session ID:", sessionId);
          
          // Try to manually refresh the session
          try {
            console.log("Attempting to refresh auth session");
            const refreshResult = await refreshSession();
            console.log("Session refresh result:", refreshResult);
            
            // Check if we now have a session - delay slightly to allow state update
            setTimeout(async () => {
              const { data: { session: refreshedSession } } = await supabase.auth.getSession();
              if (refreshedSession?.user) {
                console.log("Got user after refresh:", refreshedSession.user.id);
                setWaitingForAuth(false);
                return;
              } else {
                console.log("Still no user after session refresh");
                
                // We have a session ID but no user - wait a bit and retry
                if (verificationAttempt < 5) {
                  console.log(`Auth retry attempt ${verificationAttempt + 1}/5`);
                  setTimeout(() => {
                    setVerificationAttempt(prev => prev + 1);
                  }, 2000); // Increased delay
                } else {
                  console.log("Max auth retry attempts reached");
                  setError("Nie udało się zidentyfikować użytkownika. Spróbuj zalogować się ponownie.");
                  setLoading(false);
                }
              }
            }, 500);
          } catch (refreshError) {
            console.error("Exception refreshing session:", refreshError);
            setDebugInfo(prev => ({ ...prev, refreshError: String(refreshError) }));
            
            if (verificationAttempt < 5) {
              setTimeout(() => {
                setVerificationAttempt(prev => prev + 1);
              }, 2000);
            } else {
              setError("Wystąpił błąd podczas weryfikacji użytkownika.");
              setLoading(false);
            }
          }
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setDebugInfo(prev => ({ ...prev, authError: String(error) }));
        
        if (verificationAttempt < 5) {
          setTimeout(() => {
            setVerificationAttempt(prev => prev + 1);
          }, 2000);
        } else {
          setError("Wystąpił błąd podczas weryfikacji użytkownika.");
          setLoading(false);
        }
      }
    };
    
    checkAuthWithRetry();
  }, [user, sessionId, verificationAttempt, refreshSession]);

  // Verify payment after authentication is confirmed
  useEffect(() => {
    if (waitingForAuth) {
      console.log("Waiting for authentication before verifying payment...");
      return;
    }
    
    const forceUpdatePremiumStatus = async (userId: string) => {
      try {
        console.log('Forced update of premium status for user:', userId);
        const { error } = await supabase
          .from('profiles')
          .update({ is_premium: true })
          .eq('id', userId);
          
        if (error) {
          console.error('Error in forced premium status update:', error);
          setDebugInfo(prev => ({ ...prev, forceUpdateError: String(error) }));
        } else {
          console.log('Successfully forced premium status update');
          return true;
        }
      } catch (err) {
        console.error('Exception in forced update:', err);
        setDebugInfo(prev => ({ ...prev, forcedUpdateException: String(err) }));
      }
      return false;
    };

    const verifyPayment = async () => {
      if (!user?.id || !sessionId) {
        console.error('Missing required data for verification:', { 
          hasUser: !!user?.id, 
          hasSessionId: !!sessionId 
        });
        setError(user ? 'Brak identyfikatora sesji płatności' : 'Nie udało się zidentyfikować użytkownika');
        setLoading(false);
        return;
      }

      if (successToastShown) {
        console.log('Payment already processed in this session, skipping verification');
        setLoading(false);
        setVerificationSuccess(true);
        return;
      }

      try {
        console.log('Verifying payment session:', { sessionId, userId: user.id });
        setDebugInfo(prev => ({ 
          ...prev, 
          verifyingPayment: true,
          sessionId,
          userId: user.id,
          timestamp: new Date().toISOString()
        }));

        // Set up a timeout to prevent the request from hanging indefinitely
        const verificationPromise = new Promise<any>((resolve, reject) => {
          // Capture the current timeout
          const timeoutId = setTimeout(() => {
            reject(new Error('Verification request timeout'));
          }, 20000); // Increased timeout to 20 seconds
          
          // Store the timeout ref for cleanup
          verificationTimeoutRef.current = timeoutId as unknown as number;
          
          // Try to verify the payment
          supabase.functions.invoke('verify-payment-session', {
            body: { sessionId, userId: user.id }
          }).then(result => {
            clearTimeout(timeoutId);
            verificationTimeoutRef.current = null;
            resolve(result);
          }).catch(error => {
            clearTimeout(timeoutId);
            verificationTimeoutRef.current = null;
            reject(error);
          });
        });

        // Execute the verification with timeout
        const { data, error: verifyError } = await verificationPromise;

        if (verifyError) {
          console.error('Error invoking verify-payment-session function:', verifyError);
          setDebugInfo(prev => ({ 
            ...prev, 
            verifyError: String(verifyError),
            verifyErrorStack: verifyError.stack
          }));
          setError('Wystąpił błąd podczas weryfikacji płatności: ' + verifyError.message);
          setLoading(false);
          return;
        }

        console.log('Payment verification response:', data);
        setDebugInfo(prev => ({ ...prev, verificationResponse: data }));

        if (!data?.success) {
          console.error('Payment verification returned failure:', data);
          setError(data?.message || 'Wystąpił błąd podczas weryfikacji płatności');
          setLoading(false);
          return;
        }

        // Force update premium status first
        await forceUpdatePremiumStatus(user.id);
        
        // Wait a bit for database to update
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check premium status
        const isPremiumStatus = await checkPremiumStatus(user.id, true);
        console.log('Premium status after verification and check:', isPremiumStatus);
        
        if (isPremiumStatus) {
          console.log('Premium status confirmed, showing success');
          if (!successToastShown) {
            toast.success('Gratulacje! Twoje konto zostało zaktualizowane do wersji Premium.', {
              dismissible: true
            });
            sessionStorage.setItem('paymentProcessed', 'true');
          }
          setVerificationSuccess(true);
        } else {
          console.log('Payment verified but premium status is not active yet');
          // Even if premium status isn't confirmed yet, consider it a success
          // and show a different message
          toast.success('Gratulacje! Twoja płatność została zarejestrowana. Status premium zostanie aktywowany w ciągu kilku minut.', {
            dismissible: true
          });
          sessionStorage.setItem('paymentProcessed', 'true');
          setVerificationSuccess(true);
        }

        setLoading(false);
      } catch (err: any) {
        // Detailed error logging
        console.error('Error during payment verification process:', err);
        
        const errorDetail = {
          message: err?.message || String(err),
          stack: err?.stack,
          name: err?.name,
          code: err?.code
        };
        
        setDebugInfo(prev => ({ 
          ...prev, 
          verificationException: errorDetail,
          timestamp: new Date().toISOString()
        }));
        
        let errorMessage = 'Wystąpił błąd podczas weryfikacji płatności.';
        if (err?.message?.includes('timeout')) {
          errorMessage = 'Przekroczono czas oczekiwania na weryfikację płatności. Spróbuj odświeżyć stronę.';
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    };

    // Only proceed with payment verification if we have a user
    if (user?.id) {
      verifyPayment();
    }
  }, [user, sessionId, waitingForAuth, checkPremiumStatus, successToastShown, refreshSession]);

  return {
    loading,
    error,
    verificationSuccess,
    waitingForAuth,
    debugInfo,
    handleRetryVerification
  };
}
