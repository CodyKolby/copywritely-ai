
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
      "with search params:",
      location.search,
      "referrer:",
      document.referrer
    );
    
    // Sprawdź, czy była flaga przekierowania ze Stripe
    const wasRedirectingToStripe = sessionStorage.getItem('redirectingToStripe') === 'true';
    
    // Sprawdź, czy w adresie URL znajduje się parametr od Stripe
    const hasStripeParam = location.search.includes('session_id') || 
                          location.search.includes('canceled');
    
    // Jeśli jest parametr Stripe lub flaga przekierowania, automatycznie przekieruj
    if (hasStripeParam || wasRedirectingToStripe) {
      // Wyczyść flagę przekierowania po użyciu
      sessionStorage.removeItem('redirectingToStripe');
      
      if (location.search.includes('session_id')) {
        // Inform the user we're redirecting without showing multiple toasts
        if (sessionStorage.getItem('paymentProcessed') !== 'true') {
          toast.info('Przekierowujemy do strony potwierdzenia...');
        }
        navigate(`/success${location.search}`);
      } else if (location.search.includes('canceled')) {
        toast.info('Przekierowujemy do strony cennika...');
        navigate('/pricing?canceled=true');
      } else if (wasRedirectingToStripe) {
        // Jeśli tylko flaga była ustawiona, ale nie ma parametrów w URL, przekieruj do cennika
        toast.info('Przekierowujemy do strony cennika...');
        navigate('/pricing?canceled=true');
      }
    }
  }, [location.pathname, location.search, navigate]);

  // Sprawdzamy, czy użytkownik przyszedł ze Stripe (adres zawiera parametry stripe lub referrer)
  const isFromPayment = location.search.includes('session_id') || 
                        location.search.includes('canceled') ||
                        document.referrer.includes('stripe.com') ||
                        sessionStorage.getItem('redirectingToStripe') === 'true';

  // Obsługa przycisku odświeżenia
  const handleRefresh = () => {
    window.location.reload();
  };
  
  // Funkcja do powrotu na stronę cennika
  const handleBackToPricing = () => {
    navigate('/pricing');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center bg-white p-10 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-4xl font-bold mb-4 text-copywrite-teal">404</h1>
        <p className="text-xl text-gray-600 mb-4">Strona nie została znaleziona</p>
        
        <div className="text-gray-500 mb-6 p-3 bg-gray-50 rounded-lg text-sm">
          <p>URL: {location.pathname}{location.search}</p>
          {document.referrer && (
            <p className="mt-1">Poprzednia strona: {document.referrer}</p>
          )}
        </div>
        
        {isFromPayment ? (
          <div className="space-y-4">
            <p className="text-amber-600">
              Wygląda na to, że nastąpił problem podczas powrotu ze strony płatności.
            </p>
            <div className="flex flex-col gap-3 mt-4">
              <Button 
                className="bg-copywrite-teal hover:bg-copywrite-teal-dark w-full"
                onClick={handleBackToPricing}
              >
                <div className="flex items-center gap-2 w-full justify-center">
                  <ArrowLeft size={18} />
                  Wróć do strony cennika
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleRefresh}
              >
                <div className="flex items-center gap-2 w-full justify-center">
                  <RefreshCw size={18} />
                  Odśwież stronę
                </div>
              </Button>
            </div>
          </div>
        ) : (
          <Button className="bg-copywrite-teal hover:bg-copywrite-teal-dark">
            <Link to="/" className="flex items-center gap-2">
              <Home size={18} />
              Powrót do strony głównej
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default NotFound;
