
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  error: string | null;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 text-red-500">
        <AlertTriangle size={80} />
      </div>
      <h2 className="text-2xl font-bold mb-4">Wystąpił błąd</h2>
      <p className="text-gray-600 mb-6 text-center">
        {error || "Nie udało się przetworzyć płatności. Prosimy spróbować ponownie później."}
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <a href="/pricing">Wróć do planów</a>
        </Button>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Spróbuj ponownie
          </Button>
        )}
      </div>
    </div>
  );
};
