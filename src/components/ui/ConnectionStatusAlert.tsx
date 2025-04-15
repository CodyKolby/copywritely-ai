
import React, { useEffect, useState } from 'react';
import { AlertCircle, WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { checkConnectionHealth } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type ConnectionStatusAlertProps = {
  onRetry?: () => void;
  className?: string;
};

export const ConnectionStatusAlert: React.FC<ConnectionStatusAlertProps> = ({ 
  onRetry,
  className
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [supabaseConnected, setSupabaseConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [visible, setVisible] = useState(false);

  // Check connection status
  const checkStatus = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const status = await checkConnectionHealth();
      setIsOnline(status.online);
      setSupabaseConnected(status.supabaseConnected);
      setVisible(!status.online || !status.supabaseConnected);
    } catch (e) {
      console.error('[CONNECTION-ALERT] Error checking connection:', e);
      setVisible(true);
      setSupabaseConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkStatus();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setVisible(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    checkStatus();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
          <AlertDescription>
            {!isOnline 
              ? "Sprawdź swoje połączenie z internetem i spróbuj ponownie." 
              : "Wystąpił problem z połączeniem do serwera. Spróbuj ponownie za chwilę."}
          </AlertDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
          disabled={isChecking}
          className="ml-2 whitespace-nowrap"
        >
          {isChecking ? "Sprawdzanie..." : "Spróbuj ponownie"}
        </Button>
      </div>
    </Alert>
  );
};
