
import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';

interface LoadingStateProps {
  isWaitingForAuth: boolean;
}

export const LoadingState = ({ isWaitingForAuth }: LoadingStateProps) => {
  const [progress, setProgress] = useState(0);
  const [waitTime, setWaitTime] = useState(0);
  
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
      
      setWaitTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(progressInterval);
  }, []);
  
  return (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 border-4 border-t-copywrite-teal border-opacity-50 rounded-full animate-spin mb-4"></div>
      <p className="text-lg text-gray-600">
        {isWaitingForAuth ? 'Weryfikujemy Twoją sesję...' : 'Weryfikujemy Twoją płatność...'}
      </p>
      <p className="text-sm text-gray-500 mt-2 mb-4">
        {isWaitingForAuth 
          ? 'Potwierdzamy Twoją tożsamość...' 
          : 'Trwa przetwarzanie płatności...'}
      </p>
      
      <div className="w-full max-w-xs mb-2">
        <Progress value={progress} className="h-2" />
      </div>
      
      <p className="text-xs text-gray-400">
        {waitTime > 10 
          ? 'Weryfikacja może potrwać dłużej niż zwykle...' 
          : 'Może to potrwać kilka sekund...'}
      </p>
      
      {waitTime > 15 && (
        <p className="text-xs text-amber-500 mt-4">
          Trwa to dłużej niż zwykle. Odświeżenie strony może przyspieszyć weryfikację.
        </p>
      )}
    </div>
  );
};
