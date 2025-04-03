
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const ErrorState = ({ error, onRetry }: ErrorStateProps) => {
  const navigate = useNavigate();
  
  return (
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
        <Button onClick={onRetry} className="flex items-center gap-2">
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
  );
};
