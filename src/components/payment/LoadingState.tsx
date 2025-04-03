
import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoadingStateProps {
  isWaitingForAuth: boolean;
  onManualRetry?: () => void;
  waitTime: number;
}

export const LoadingState = ({ isWaitingForAuth, onManualRetry, waitTime }: LoadingStateProps) => {
  const [progress, setProgress] = useState(0);
  
  // Simulate progress for visual feedback
  useEffect(() => {
    const maxProgress = 95; // Cap at 95% until completion
    
    // Use a non-linear progress curve to start fast and slow down
    const calculateProgress = (seconds: number) => {
      if (seconds < 2) return Math.min(30, seconds * 15); // Fast start
      if (seconds < 5) return Math.min(50, 30 + (seconds - 2) * 6); // Slower
      if (seconds < 10) return Math.min(70, 50 + (seconds - 5) * 4); // Even slower
      if (seconds < 20) return Math.min(85, 70 + (seconds - 10) * 1.5); // Very slow
      return Math.min(maxProgress, 85 + (seconds - 20) * 0.25); // Extremely slow
    };
    
    // Update progress based on wait time
    setProgress(calculateProgress(waitTime));
    
  }, [waitTime]);
  
  // Determine message based on wait time and state
  const getMessage = () => {
    if (isWaitingForAuth) {
      return 'Weryfikujemy Twoją tożsamość...';
    }
    
    if (waitTime > 25) {
      return 'Płatność została przyjęta!';
    }
    
    if (waitTime > 20) {
      return 'Proces trwa dłużej niż zwykle...';
    }
    
    if (waitTime > 10) {
      return 'Potwierdzanie statusu płatności...';
    }
    
    if (waitTime > 5) {
      return 'Aktualizowanie Twojego konta...';
    }
    
    return 'Weryfikujemy Twoją płatność...';
  };
  
  // Determine subtext based on wait time
  const getSubtext = () => {
    if (isWaitingForAuth) {
      return 'Łączymy dane płatności z Twoim kontem...';
    }
    
    if (waitTime > 25) {
      return 'Za chwilę zostaniesz przekierowany...';
    }
    
    if (waitTime > 15) {
      return 'To może potrwać chwilę dłużej niż zwykle...';
    }
    
    return 'Prosimy o cierpliwość...';
  };
  
  // Auto-refresh suggestion after a certain time
  const showAutoRefreshSuggestion = waitTime > 30;
  
  return (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 border-4 border-t-copywrite-teal border-opacity-50 rounded-full animate-spin mb-4"></div>
      <p className="text-lg text-gray-600 font-medium">
        {getMessage()}
      </p>
      <p className="text-sm text-gray-500 mt-2 mb-4">
        {getSubtext()}
      </p>
      
      <div className="w-full max-w-xs mb-2">
        <Progress value={progress} className="h-2" />
        <div className="mt-1 text-xs text-gray-400 text-right">
          {Math.round(progress)}%
        </div>
      </div>
      
      {waitTime > 15 && (
        <p className="text-xs text-gray-500 mt-3 mb-3 max-w-xs text-center">
          Weryfikacja może potrwać do 1 minuty. Jeśli proces trwa zbyt długo, możesz spróbować odświeżyć stronę.
        </p>
      )}
      
      {waitTime > 20 && (
        <p className="text-xs text-green-600 mt-1 mb-3 max-w-xs text-center font-medium">
          Płatność została przyjęta przez Stripe. Trwa aktualizacja Twojego konta.
        </p>
      )}
      
      {showAutoRefreshSuggestion && (
        <div className="bg-amber-50 p-3 rounded-md border border-amber-200 mt-2 mb-2 max-w-xs">
          <p className="text-xs text-amber-700">
            Wygląda na to, że proces trwa wyjątkowo długo. Za chwilę nastąpi automatyczne odświeżenie strony.
          </p>
        </div>
      )}
      
      {waitTime > 20 && onManualRetry && (
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2 flex items-center gap-1"
          onClick={onManualRetry}
        >
          <RefreshCw className="h-3 w-3" />
          Spróbuj ponownie
        </Button>
      )}
      
      {/* Auto refresh after 45 seconds */}
      {waitTime > 45 && (
        <div className="mt-4">
          <p className="text-xs text-gray-600">Odświeżanie strony za 5 sekund...</p>
          {setTimeout(() => window.location.reload(), 5000)}
        </div>
      )}
    </div>
  );
};
