
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
    const interval = setInterval(() => {
      setProgress(prev => {
        // Cap at 90% until completion to indicate it's still working
        if (prev < 90) {
          return prev + 1;
        }
        return prev;
      });
      
      setWaitTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
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
      
      {waitTime > 20 && (
        <p className="text-xs text-amber-500 mt-4">
          Trwa to dłużej niż zwykle. Jeśli problem będzie się powtarzał, spróbuj odświeżyć stronę.
        </p>
      )}
    </div>
  );
};
