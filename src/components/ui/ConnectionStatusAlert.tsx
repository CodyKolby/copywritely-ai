
import React, { useEffect, useState, useCallback } from 'react';
import { AlertCircle, WifiOff, RefreshCw, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { checkConnectionHealth, diagnoseConnectionIssues } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  const [retryCount, setRetryCount] = useState(0);
  const [diagnosticInfo, setDiagnosticInfo] = useState<{
    canReachSupabaseUrl?: boolean;
    canMakeApiCall?: boolean;
    message?: string;
  } | null>(null);

  // Check connection status with better error handling
  const checkStatus = useCallback(async () => {
    if (checkInProgress) return;
    
    setCheckInProgress(true);
    try {
      console.log('[CONNECTION-ALERT] Checking connection status');
      
      // First check basic connection
      const status = await checkConnectionHealth();
      setIsOnline(status.online);
      setSupabaseConnected(status.supabaseConnected);
      
      // If there are issues, run more detailed diagnostics
      if (!status.online || !status.supabaseConnected) {
        console.log('[CONNECTION-ALERT] Connection issues detected, running detailed diagnostics');
        const diagnostics = await diagnoseConnectionIssues();
        setDiagnosticInfo({
          canReachSupabaseUrl: diagnostics.canReachSupabaseUrl,
          canMakeApiCall: diagnostics.canMakeApiCall,
          message: diagnostics.message
        });
      } else {
        setDiagnosticInfo(null);
      }
      
      setVisible(!status.online || !status.supabaseConnected);
      setLastCheckTimestamp(Date.now());
      
      console.log('[CONNECTION-ALERT] Connection check result:', {
        online: status.online,
        supabaseConnected: status.supabaseConnected,
        message: status.message
      });
      
      // If connection is restored after previously being down, show a success toast
      if (visible && status.online && status.supabaseConnected) {
        toast.success('Połączenie przywrócone', {
          description: 'Aplikacja powinna teraz działać poprawnie'
        });
      }
      
      return status;
    } catch (e) {
      console.error('[CONNECTION-ALERT] Error checking connection:', e);
      setVisible(true);
      setSupabaseConnected(false);
      setDiagnosticInfo({
        message: 'Wystąpił błąd podczas sprawdzania połączenia'
      });
      return null;
    } finally {
      setCheckInProgress(false);
    }
  }, [checkInProgress, visible]);

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
    
    // Set up periodic check 
    const intervalId = setInterval(() => {
      // If we're visible (have an error), check more frequently
      const checkInterval = visible ? 15000 : 30000;
      if (Date.now() - lastCheckTimestamp > checkInterval && !checkInProgress) { 
        checkStatus();
      }
    }, 15000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [visible, lastCheckTimestamp, checkInProgress, checkStatus]);

  // Hide if everything is connected
  if (!visible) {
    return null;
  }

  // Handle user retry
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
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
              : diagnosticInfo?.message || "Wystąpił problem z połączeniem do serwera."}
            
            {diagnosticInfo && (
              <div className="mt-2 text-sm">
                <ul className="list-none space-y-1">
                  <li className="flex items-center">
                    <span className={cn("w-4 h-4 inline-block mr-2", 
                      isOnline ? "text-green-500" : "text-red-500")}>
                      {isOnline ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    </span>
                    Połączenie z internetem
                  </li>
                  <li className="flex items-center">
                    <span className={cn("w-4 h-4 inline-block mr-2", 
                      diagnosticInfo.canReachSupabaseUrl ? "text-green-500" : "text-red-500")}>
                      {diagnosticInfo.canReachSupabaseUrl ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    </span>
                    Dostęp do serwera Supabase
                  </li>
                  <li className="flex items-center">
                    <span className={cn("w-4 h-4 inline-block mr-2", 
                      diagnosticInfo.canMakeApiCall ? "text-green-500" : "text-red-500")}>
                      {diagnosticInfo.canMakeApiCall ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    </span>
                    Możliwość wykonania zapytania API
                  </li>
                </ul>
              </div>
            )}
            
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
