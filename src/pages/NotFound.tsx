
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
      "with search params:",
      location.search
    );
  }, [location.pathname, location.search]);

  // Sprawdzamy, czy użytkownik przyszedł ze Stripe (adres zawiera pricing)
  const isFromPricing = location.pathname.includes("pricing");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center bg-white p-10 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-4xl font-bold mb-4 text-copywrite-teal">404</h1>
        <p className="text-xl text-gray-600 mb-4">Strona nie została znaleziona</p>
        
        <div className="text-gray-500 mb-6 p-3 bg-gray-50 rounded-lg text-sm">
          <p>URL: {location.pathname}{location.search}</p>
        </div>
        
        {isFromPricing ? (
          <div className="space-y-4">
            <p className="text-amber-600">
              Wygląda na to, że nastąpił problem podczas powrotu ze strony płatności.
            </p>
            <div className="flex flex-col gap-3 mt-4">
              <Button className="bg-copywrite-teal hover:bg-copywrite-teal-dark w-full">
                <Link to="/pricing" className="flex items-center gap-2 w-full justify-center">
                  <ArrowLeft size={18} />
                  Wróć do strony cennika
                </Link>
              </Button>
              <Button variant="outline" className="w-full">
                <Link to="/" className="flex items-center gap-2 w-full justify-center">
                  <Home size={18} />
                  Strona główna
                </Link>
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
