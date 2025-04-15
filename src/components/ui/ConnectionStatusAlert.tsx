
import React from 'react';
import { AlertCircle, WifiOff, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';

type ConnectionStatusAlertProps = {
  onRetry?: () => void;
  isChecking?: boolean;
  className?: string;
  showOnlineStatus?: boolean;
};

export const ConnectionStatusAlert: React.FC<ConnectionStatusAlertProps> = React.memo(({ 
  onRetry,
  isChecking = false,
  className,
  showOnlineStatus = false
}) => {
  // Only check navigator.onLine once during render
  const isOnline = navigator.onLine;
  
  // Only show alert for offline state to reduce noise
  if (isOnline && !showOnlineStatus) {
    return null;
  }
  
  return (
    <Alert 
      variant={isOnline ? "default" : "destructive"}
      className={cn("mb-4", className)}
    >
      <div className="flex items-start">
        <div className="mr-2">
          {isOnline ? 
            <AlertCircle className="h-5 w-5" /> :
            <WifiOff className="h-5 w-5" />
          }
        </div>
        <div className="flex-1">
          <AlertTitle>
            {isOnline ? 'Status połączenia' : 'Brak połączenia z internetem'}
          </AlertTitle>
          <AlertDescription>
            {isOnline ? 
              'Połączenie z internetem jest aktywne.' :
              'Sprawdź swoje połączenie z internetem i spróbuj ponownie.'
            }
          </AlertDescription>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              disabled={isChecking}
              className="mt-2"
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
          )}
        </div>
      </div>
    </Alert>
  );
});

ConnectionStatusAlert.displayName = 'ConnectionStatusAlert';
