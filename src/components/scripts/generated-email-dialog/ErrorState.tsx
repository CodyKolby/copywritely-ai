
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

const ErrorState = ({ error, onRetry }: ErrorStateProps) => {
  return (
    <div className="p-6 flex flex-col items-center justify-center space-y-4 text-center">
      <AlertTriangle className="h-12 w-12 text-red-500" />
      <h3 className="text-xl font-semibold text-red-600">Wystąpił błąd</h3>
      <p className="text-gray-600">{error}</p>
      <Button 
        onClick={onRetry}
        className="mt-4 bg-copywrite-teal hover:bg-copywrite-teal-dark text-white"
      >
        Spróbuj ponownie
      </Button>
    </div>
  );
};

export default ErrorState;
