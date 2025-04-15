
import React, { useEffect, useState } from 'react';
import { AlertCircle, WifiOff, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { checkConnectionHealth } from '@/integrations/supabase/client';
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [supabaseConnected, setSupabaseConnected] = useState(true);
  const [visible, setVisible] = useState(false);
  const [checkInProgress, setCheckInProgress] = useState(false);
  const [lastCheckTimestamp, setLastCheckTimestamp] = useState(0);

  // Check connection status
  const checkStatus = async () => {
    if (checkInProgress) return;
    
    setCheckInProgress(true);
    try {
      console.log('[CONNECTION-ALERT] Checking connection status');
      const status = await checkConnectionHealth();
      setIsOnline(status.online);
      setSupabaseConnected(status.supabaseConnected);
      setVisible(!status.online || !status.supabaseConnected);
      setLastCheckTimestamp(Date.now());
      
      console.log('[CONNECTION-ALERT] Connection check result:', {
        online: status.online,
        supabaseConnected: status.supabaseConnected,
        message: status.message
      });
    } catch (e) {
      console.error('[CONNECTION-ALERT] Error checking connection:', e);
      setVisible(true);
      setSupabaseConnected(false);
    } finally {
      setCheckInProgress(false);
    }
  };

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Only trigger a fresh check if it's been more than 5 seconds since the last one
      if (Date.now() - lastCheckTimestamp > 5000) {
        checkStatus();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setVisible(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    checkStatus();
    
    // Set up periodic check (every 15 seconds)
    const intervalId = setInterval(() => {
      if (!visible && !checkInProgress) { 
        // Only do periodic checks if we think we're connected and not already checking
        checkStatus();
      }
    }, 15000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [visible, lastCheckTimestamp, checkInProgress]);

  // Hide if everything is connected
  if (!visible) {
    return null;
  }

  const handleRetry = () => {
    checkStatus();
    if (onRetry) {
      onRetry();
    }
  };

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
              : "Wystąpił problem z połączeniem do serwera. Spróbujemy ponownie automatycznie, lub możesz kliknąć przycisk poniżej."}
            
            <div className="mt-3 text-sm">
              <strong>Możliwe rozwiązania:</strong>
              <ul className="list-disc pl-5 mt-1">
                <li>Odśwież stronę</li>
                <li>Sprawdź połączenie internetowe</li>
                <li>Wyczyść pamięć podręczną przeglądarki</li>
                <li>Spróbuj ponownie później</li>
              </ul>
            </div>
          </AlertDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
          disabled={isChecking || checkInProgress}
          className="ml-2 whitespace-nowrap"
        >
          {isChecking || checkInProgress ? (
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
