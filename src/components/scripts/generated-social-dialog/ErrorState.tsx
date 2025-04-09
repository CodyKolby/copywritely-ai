
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  error: Error | string | null;
  onRetry: () => void;
}

const ErrorState = ({ error, onRetry }: ErrorStateProps) => {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-8">
      <div className="bg-red-100 p-3 rounded-full mb-4">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        Wystąpił błąd podczas generowania posta
      </h3>
      <p className="text-gray-600 text-center mb-6">
        {errorMessage || "Nie udało się wygenerować posta. Spróbuj ponownie."}
      </p>
      <Button onClick={onRetry}>Spróbuj ponownie</Button>
    </div>
  );
};

export default ErrorState;
