
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface LoadingStateProps {
  isWaitingForAuth: boolean;
  waitTime?: number;
  onManualRetry?: () => void;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  isWaitingForAuth, 
  waitTime = 0,
  onManualRetry
}) => {
  const showRetryButton = waitTime > 5 && !isWaitingForAuth;
  
  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 text-blue-500">
        <Loader2 size={80} className="animate-spin" />
      </div>
      <h2 className="text-2xl font-bold mb-4">Przetwarzanie płatności</h2>
      <p className="text-gray-600 mb-4 text-center">
        {isWaitingForAuth
          ? "Weryfikacja danych użytkownika..."
          : "Trwa weryfikacja twojej płatności. To może potrwać chwilę."}
      </p>
      {showRetryButton && onManualRetry && (
        <Button onClick={onManualRetry} variant="outline" className="mt-4">
          Spróbuj ponownie
        </Button>
      )}
    </div>
  );
};
