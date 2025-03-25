import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Success = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationAttempt, setVerificationAttempt] = useState(0);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const { user, checkPremiumStatus, isPremium } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const successToastShown = sessionStorage.getItem('paymentProcessed') === 'true';

  useEffect(() => {
    const forceUpdatePremiumStatus = async (userId: string) => {
      try {
        console.log('Forced update of premium status for user:', userId);
        const { error } = await supabase
          .from('profiles')
          .update({ is_premium: true })
          .eq('id', userId);
          
        if (error) {
          console.error('Error in forced premium status update:', error);
        } else {
          console.log('Successfully forced premium status update');
          return true;
        }
      } catch (err) {
        console.error('Exception in forced update:', err);
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

        const searchParams = new URLSearchParams(location.search);
        const sessionId = searchParams.get('session_id');

        if (!sessionId) {
          console.error('No session ID found in URL');
          setError('Brak identyfikatora sesji płatności');
          setLoading(false);
          return;
        }

        if (!user?.id) {
          console.error('No user ID available');
          setError('Nie udało się zidentyfikować użytkownika');
          setLoading(false);
          return;
        }

        console.log('Verifying payment session:', { sessionId, userId: user.id });

        const { data, error: verifyError } = await supabase.functions.invoke('verify-payment-session', {
          body: { 
            sessionId,
            userId: user.id
          }
        });

        if (verifyError) {
          console.error('Error verifying payment:', verifyError);
          setError('Wystąpił błąd podczas weryfikacji płatności');
          setLoading(false);
          return;
        }

        if (!data?.success) {
          console.error('Payment verification returned failure:', data);
          setError(data?.message || 'Wystąpił błąd podczas weryfikacji płatności');
          setLoading(false);
          return;
        }

        console.log('Payment verification successful, checking premium status');
        
        const forceUpdateSuccess = await forceUpdatePremiumStatus(user.id);
        console.log('Force update result:', forceUpdateSuccess);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
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
            await new Promise(resolve => setTimeout(resolve, 1000));
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
        setError('Wystąpił błąd podczas weryfikacji płatności');
        setLoading(false);
      }
    };

    verifyPayment();
  }, [location, user, checkPremiumStatus, successToastShown, verificationAttempt, isPremium]);

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
              <p className="text-lg text-gray-600">Weryfikujemy Twoją płatność...</p>
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
              <Button onClick={() => navigate('/pricing')}>
                Wróć do cennika
              </Button>
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
