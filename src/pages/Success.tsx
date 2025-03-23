
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
  const location = useLocation();
  const navigate = useNavigate();
  const { user, checkPremiumStatus } = useAuth();

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Pobierz session_id z query params
        const searchParams = new URLSearchParams(location.search);
        const sessionId = searchParams.get('session_id');

        if (!sessionId) {
          setError('Brak identyfikatora sesji płatności');
          setLoading(false);
          return;
        }

        // Weryfikacja sesji i aktualizacja statusu premium
        if (user?.id) {
          const { data, error: verifyError } = await supabase.functions.invoke('verify-payment-session', {
            body: { 
              sessionId,
              userId: user.id
            }
          });

          if (verifyError) {
            console.error('Błąd podczas weryfikacji płatności:', verifyError);
            setError('Wystąpił błąd podczas weryfikacji płatności');
            setLoading(false);
            return;
          }

          if (!data?.success) {
            setError(data?.message || 'Wystąpił błąd podczas weryfikacji płatności');
            setLoading(false);
            return;
          }

          // Odświeżamy status premium użytkownika
          await checkPremiumStatus(user.id);
          toast.success('Gratulacje! Twoje konto zostało zaktualizowane do wersji Premium.');
        }

        setLoading(false);
      } catch (err) {
        console.error('Błąd podczas weryfikacji płatności:', err);
        setError('Wystąpił błąd podczas weryfikacji płatności');
        setLoading(false);
      }
    };

    checkSession();
  }, [location, user, checkPremiumStatus]);

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
