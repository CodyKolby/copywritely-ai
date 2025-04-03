
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
  
  // Simulate progress for visual feedback - make it EVEN faster
  useEffect(() => {
    // Use a faster progress curve that reaches 100% sooner
    const calculateProgress = (seconds: number) => {
      if (seconds < 1) return Math.min(30, seconds * 30); // Much faster start
      if (seconds < 3) return Math.min(60, 30 + (seconds - 1) * 15); // Very fast ramp-up
      if (seconds < 6) return Math.min(90, 60 + (seconds - 3) * 10); // Faster toward the end
      return 100; // After 6 seconds, show 100%
    };
    
    setProgress(calculateProgress(waitTime));
  }, [waitTime]);
  
  // Auto-refresh after 10 seconds
  useEffect(() => {
    if (waitTime >= 10) {
      const countdown = setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      return () => clearTimeout(countdown);
    }
  }, [waitTime]);
  
  // Determine message based on wait time and state
  const getMessage = () => {
    if (isWaitingForAuth) {
      return 'Weryfikujemy Twoją tożsamość...';
    }
    
    if (waitTime > 7) {
      return 'Gotowe! Przygotowujemy Twoje konto...';
    }
    
    if (waitTime > 4) {
      return 'Weryfikacja płatności zakończona!';
    }
    
    return 'Weryfikujemy Twoją płatność...';
  };
  
  // Determine subtext based on wait time
  const getSubtext = () => {
    if (isWaitingForAuth) {
      return 'Łączymy dane płatności z Twoim kontem...';
    }
    
    if (waitTime > 7) {
      return 'Za moment zostaniesz przekierowany...';
    }
    
    if (waitTime > 4) {
      return 'Twoje konto otrzyma dostęp w ciągu kilku sekund.';
    }
    
    return 'Prosimy o cierpliwość...';
  };
  
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
      
      {waitTime > 4 && (
        <p className="text-xs text-green-600 mt-3 mb-3 max-w-xs text-center font-medium">
          Płatność została przyjęta. Za chwilę zakończymy proces.
        </p>
      )}
      
      {waitTime > 7 && onManualRetry && (
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2 flex items-center gap-1"
          onClick={onManualRetry}
        >
          <RefreshCw className="h-3 w-3" />
          Odśwież teraz
        </Button>
      )}
      
      {waitTime > 10 && (
        <div className="mt-4">
          <p className="text-xs text-gray-600">Odświeżanie strony za moment...</p>
        </div>
      )}
    </div>
  );
};
