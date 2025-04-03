
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
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        // Gradually slow down progress as it gets higher
        if (prev < 30) return prev + 2;
        if (prev < 60) return prev + 1;
        if (prev < maxProgress) return prev + 0.5;
        return prev;
      });
    }, 1000);
    
    return () => clearInterval(progressInterval);
  }, []);
  
  // Determine message based on wait time and state
  const getMessage = () => {
    if (isWaitingForAuth) {
      return 'Weryfikujemy Twoją tożsamość...';
    }
    
    if (waitTime > 15) {
      return 'Oczekiwanie na odpowiedź od serwera płatności...';
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
      return 'Potwierdzamy Twoją tożsamość...';
    }
    
    if (waitTime > 15) {
      return 'To może potrwać chwilę dłużej niż zwykle...';
    }
    
    return 'Trwa przetwarzanie płatności...';
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 border-4 border-t-copywrite-teal border-opacity-50 rounded-full animate-spin mb-4"></div>
      <p className="text-lg text-gray-600">
        {getMessage()}
      </p>
      <p className="text-sm text-gray-500 mt-2 mb-4">
        {getSubtext()}
      </p>
      
      <div className="w-full max-w-xs mb-2">
        <Progress value={progress} className="h-2" />
      </div>
      
      <p className="text-xs text-gray-400">
        {waitTime > 10 
          ? 'Weryfikacja może potrwać dłużej niż zwykle...' 
          : 'Może to potrwać kilka sekund...'}
      </p>
      
      {waitTime > 15 && onManualRetry && (
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4 flex items-center gap-1"
          onClick={onManualRetry}
        >
          <RefreshCw className="h-3 w-3" />
          Ponów próbę weryfikacji
        </Button>
      )}
    </div>
  );
};
