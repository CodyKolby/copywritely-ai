
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Success = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationAttempt, setVerificationAttempt] = useState(0);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [waitingForAuth, setWaitingForAuth] = useState(true);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const { user, checkPremiumStatus, isPremium } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const successToastShown = sessionStorage.getItem('paymentProcessed') === 'true';

  // First, handle authentication check with retry mechanism
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
          setDebugInfo(prev => ({ ...prev, sessionError }));
        }
        
        if (session?.user) {
          console.log("Found session for user:", session.user.id);
          setWaitingForAuth(false);
        } else {
          // If we don't have a session, try to get the search params
          const searchParams = new URLSearchParams(location.search);
          const sessionId = searchParams.get('session_id');
          
          setDebugInfo(prev => ({ 
            ...prev, 
            hasSessionId: !!sessionId,
            sessionId: sessionId || 'none' 
          }));
          
          if (!sessionId) {
            // No session ID in URL, redirect to login
            console.error("No session ID and no authenticated user");
            setError("Nie jesteś zalogowany. Zaloguj się, aby kontynuować.");
            setLoading(false);
            return;
          }
          
          console.log("No user session but have Stripe session ID:", sessionId);
          
          // Try to manually refresh the session
          try {
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              console.error("Error refreshing session:", refreshError);
              setDebugInfo(prev => ({ ...prev, refreshError }));
            } else {
              console.log("Successfully refreshed session");
              
              // Check if we now have a session
              const { data: { session: refreshedSession } } = await supabase.auth.getSession();
              if (refreshedSession?.user) {
                console.log("Got user after refresh:", refreshedSession.user.id);
                setWaitingForAuth(false);
                return;
              }
            }
          } catch (refreshError) {
            console.error("Exception refreshing session:", refreshError);
            setDebugInfo(prev => ({ ...prev, refreshError }));
          }
          
          // We have a session ID but no user - wait a bit and retry
          if (verificationAttempt < 5) {
            console.log(`Auth retry attempt ${verificationAttempt + 1}/5`);
            setTimeout(() => {
              setVerificationAttempt(prev => prev + 1);
            }, 1500);
          } else {
            console.log("Max auth retry attempts reached");
            setError("Nie udało się zidentyfikować użytkownika. Spróbuj zalogować się ponownie.");
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setDebugInfo(prev => ({ ...prev, authError: error }));
        
        if (verificationAttempt < 5) {
          setTimeout(() => {
            setVerificationAttempt(prev => prev + 1);
          }, 1500);
        } else {
          setError("Wystąpił błąd podczas weryfikacji użytkownika.");
          setLoading(false);
        }
      }
    };
    
    checkAuthWithRetry();
  }, [user, location.search, verificationAttempt]);

  // Only run the payment verification after we have authentication
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
          setDebugInfo(prev => ({ ...prev, forceUpdateError: error }));
        } else {
          console.log('Successfully forced premium status update');
          return true;
        }
      } catch (err) {
        console.error('Exception in forced update:', err);
        setDebugInfo(prev => ({ ...prev, forcedUpdateException: err }));
      }
      return false;
    };

    const verifyPayment = async () => {
      try {
        if (successToastShown) {
          console.log('Payment already processed in this session, skipping verification');
          setLoading(false);
          setVerificationSuccess(true);
          return;
        }

        if (!user?.id) {
          console.error('No user ID available for payment verification');
          setError('Nie udało się zidentyfikować użytkownika. Spróbuj zalogować się ponownie.');
          setDebugInfo(prev => ({ ...prev, missingUserId: true }));
          setLoading(false);
          return;
        }

        const searchParams = new URLSearchParams(location.search);
        const sessionId = searchParams.get('session_id');

        if (!sessionId) {
          console.error('No session ID found in URL');
          setError('Brak identyfikatora sesji płatności');
          setLoading(false);
          return;
        }

        console.log('Verifying payment session:', { sessionId, userId: user.id });
        
        setDebugInfo(prev => ({ 
          ...prev, 
          verifyingPayment: true,
          sessionId,
          userId: user.id 
        }));

        const { data, error: verifyError } = await supabase.functions.invoke('verify-payment-session', {
          body: { 
            sessionId,
            userId: user.id
          }
        });

        if (verifyError) {
          console.error('Error invoking verify-payment-session function:', verifyError);
          setDebugInfo(prev => ({ ...prev, verifyError }));
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

        console.log('Payment verification successful, checking premium status');
        
        // Force update premium status first
        const forceUpdateSuccess = await forceUpdatePremiumStatus(user.id);
        console.log('Force update result:', forceUpdateSuccess);
        
        // Wait a bit for database to update
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check premium status
        let isPremiumStatus = await checkPremiumStatus(user.id, false);
        console.log('Premium status after verification and forced update:', isPremiumStatus);
        
        if (!isPremiumStatus) {
          console.log('First premium check failed, trying again after longer delay');
          await new Promise(resolve => setTimeout(resolve, 3000));
          isPremiumStatus = await checkPremiumStatus(user.id, false);
          console.log('Premium status after second check:', isPremiumStatus);
          
          if (!isPremiumStatus) {
            console.log('Second premium check failed, forcing premium status update again');
            await forceUpdatePremiumStatus(user.id);
            await new Promise(resolve => setTimeout(resolve, 2000));
            isPremiumStatus = await checkPremiumStatus(user.id, false);
            console.log('Premium status after forced update and third check:', isPremiumStatus);
          }
        }
        
        if (isPremiumStatus && !successToastShown) {
          console.log('Showing premium success toast');
          toast.success('Gratulacje! Twoje konto zostało zaktualizowane do wersji Premium.', {
            dismissible: true
          });
          sessionStorage.setItem('paymentProcessed', 'true');
          setVerificationSuccess(true);
        } else if (!isPremiumStatus) {
          console.warn('Payment verified but premium status not updated. Will retry shortly.');
          if (verificationAttempt < 3) {
            setVerificationAttempt(prev => prev + 1);
            setTimeout(() => {
              checkPremiumStatus(user.id, true);
            }, 3000);
          } else {
            console.log('Maximum verification attempts reached, assuming success');
            setVerificationSuccess(true);
            toast.success('Gratulacje! Twoja płatność została zarejestrowana. Jeśli status Premium nie jest widoczny od razu, odśwież stronę za kilka minut.', {
              dismissible: true
            });
            sessionStorage.setItem('paymentProcessed', 'true');
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error during payment verification process:', err);
        setDebugInfo(prev => ({ ...prev, verificationException: err }));
        setError('Wystąpił błąd podczas weryfikacji płatności');
        setLoading(false);
      }
    };

    // Only proceed with payment verification if we have a user
    if (user?.id) {
      verifyPayment();
    }
  }, [location, user, checkPremiumStatus, successToastShown, verificationAttempt, isPremium, waitingForAuth]);

  // Function to manually retry verification
  const handleRetryVerification = async () => {
    setError(null);
    setLoading(true);
    setWaitingForAuth(true);
    setVerificationAttempt(0);
    
    // Try to manually refresh auth
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("Error refreshing session on manual retry:", error);
      } else if (data.session) {
        console.log("Successfully refreshed session on manual retry");
      }
    } catch (e) {
      console.error("Exception refreshing auth on manual retry:", e);
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
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-t-copywrite-teal border-opacity-50 rounded-full animate-spin mb-4"></div>
              <p className="text-lg text-gray-600">
                {waitingForAuth ? 'Weryfikujemy Twoją sesję...' : 'Weryfikujemy Twoją płatność...'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {waitingForAuth ? 'Może to potrwać kilka sekund...' : 'Trwa przetwarzanie płatności...'}
              </p>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 text-red-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Coś poszło nie tak</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button onClick={handleRetryVerification} className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Spróbuj ponownie
                </Button>
                <Button onClick={() => navigate('/pricing')} variant="outline">
                  Wróć do cennika
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/login')}
                >
                  Przejdź do logowania
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 text-green-500">
                <CheckCircle className="w-full h-full" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Płatność zakończona sukcesem!</h2>
              <p className="text-gray-600 mb-6">
                Dziękujemy za wykupienie subskrypcji. Twoje konto zostało zaktualizowane do wersji Premium.
                Możesz teraz korzystać z wszystkich funkcji naszej aplikacji.
              </p>
              <Button 
                onClick={() => navigate('/projekty')}
                className="bg-copywrite-teal hover:bg-copywrite-teal-dark flex items-center gap-2"
              >
                Przejdź do projektów
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Success;
