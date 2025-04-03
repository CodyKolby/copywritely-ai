
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
  debugInfo?: Record<string, any>;
}

export const ErrorState = ({ error, onRetry, debugInfo }: ErrorStateProps) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  
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
      
      {debugInfo && (
        <div className="mb-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
                <Info className="h-3 w-3" />
                Szczegóły techniczne
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 max-h-80 overflow-auto text-xs text-left">
              <div className="space-y-2">
                <h4 className="font-semibold">Informacje diagnostyczne:</h4>
                <pre className="bg-gray-100 p-2 rounded text-left overflow-auto max-h-60">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <Button 
          onClick={onRetry} 
          className="flex items-center gap-2 bg-copywrite-teal hover:bg-copywrite-teal-dark"
        >
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
