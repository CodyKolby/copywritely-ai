
import React from 'react';
import { AlertCircle, WifiOff, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';

type ConnectionStatusAlertProps = {
  onRetry?: () => void;
  isChecking?: boolean;
  className?: string;
};

export const ConnectionStatusAlert: React.FC<ConnectionStatusAlertProps> = ({ 
  onRetry,
  isChecking = false,
  className
}) => {
  const isOnline = navigator.onLine;
  
  return (
    <Alert 
      variant="destructive" 
      className={cn("mb-4", className)}
    >
      <div className="flex items-start">
        <div className="mr-2">
          {!isOnline ? (
            <WifiOff className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1">
          <AlertTitle>
            {!isOnline 
              ? "Brak połączenia z internetem" 
              : "Problem z połączeniem do serwera"}
          </AlertTitle>
          <AlertDescription className="mt-2">
            {!isOnline 
              ? "Sprawdź swoje połączenie z internetem i spróbuj ponownie." 
              : "Występuje problem z połączeniem do serwera Supabase. Upewnij się, że domena jest skonfigurowana w ustawieniach Supabase."}
            
            <div className="mt-3 text-sm">
              <strong>Możliwe rozwiązania:</strong>
              <ul className="list-disc pl-5 mt-1">
                <li>Dodaj domenę aplikacji do dozwolonych źródeł w ustawieniach CORS w Supabase</li>
                <li>Odśwież stronę</li>
                <li>Sprawdź połączenie internetowe</li>
                <li>Wyczyść pamięć podręczną przeglądarki</li>
              </ul>
            </div>
          </AlertDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={isChecking}
          className="ml-2 whitespace-nowrap"
        >
          {isChecking ? (
            <>
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              Sprawdzanie...
            </>
          ) : (
            "Spróbuj ponownie"
          )}
        </Button>
      </div>
    </Alert>
  );
};
