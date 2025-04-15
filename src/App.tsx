
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/auth/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { AppLayout } from './components/layout/AppLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes } from './routes';
import { Toaster as SonnerToaster, toast } from 'sonner'; // Import toast directly
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './integrations/supabase/client';
import { ConnectionStatusAlert } from './components/ui/ConnectionStatusAlert';

// Configure React Query with better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      staleTime: 60000,
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15000)
    }
  }
});

function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(0);
  const offlineNotificationShown = useRef(false);

  // Check for auth callback parameters in URL
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const url = new URL(window.location.href);
        const hashParams = new URLSearchParams(url.hash.substring(1));
        const queryParams = new URLSearchParams(url.search);
        
        // Check for auth provider callbacks
        if ((hashParams.has('access_token') || queryParams.has('code'))) {
          console.log('[APP] Auth callback detected in URL');
        }
      } catch (err) {
        console.error('[APP] Error handling auth callback:', err);
      }
    };
    
    handleAuthCallback();
  }, []);

  // Setup network status listeners with debounce to avoid excessive state updates
  useEffect(() => {
    const handleOnline = () => {
      offlineNotificationShown.current = false;
      setIsOffline(false);
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      // Only show offline toast once per offline event
      if (!offlineNotificationShown.current) {
        offlineNotificationShown.current = true;
        toast.error('Brak połączenia z internetem', {
          description: 'Niektóre funkcje mogą być niedostępne'
        });
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    // Reload page on retry
    window.location.reload();
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppLayout>
            {/* Only show connection status alert when offline */}
            {isOffline && (
              <ConnectionStatusAlert 
                onRetry={handleRetry}
                isChecking={isCheckingConnection}
              />
            )}
            
            <Routes />
          </AppLayout>
          <Toaster />
          <SonnerToaster position="top-center" closeButton richColors />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
