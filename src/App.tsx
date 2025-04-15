
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/auth/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { AppLayout } from './components/layout/AppLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes } from './routes';
import { Toaster as SonnerToaster, toast } from 'sonner'; // Import toast directly
import React, { useState, useEffect } from 'react';
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
  const [supabaseConnected, setSupabaseConnected] = useState(true);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(0);

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

  // Verify Supabase connection on app start - only once
  useEffect(() => {
    // Only check connection once at startup to avoid infinite loops
    const checkConnection = async () => {
      // Skip if we've checked in the last 60 seconds
      const now = Date.now();
      if (now - lastCheckTime < 60000) return;
      
      if (isCheckingConnection) return;
      
      try {
        setIsCheckingConnection(true);
        setLastCheckTime(now);
        
        // First check if we're online at all
        if (!navigator.onLine) {
          setSupabaseConnected(false);
          return;
        }
        
        // Simple connection check - no CORS checks to avoid triggering errors
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        
        if (error) {
          console.log('[APP] Connection check error:', error.message);
          setSupabaseConnected(false);
        } else {
          console.log('[APP] Connection check successful');
          setSupabaseConnected(true);
        }
      } catch (error) {
        console.error('[APP] Error verifying Supabase connection:', error);
        setSupabaseConnected(false);
      } finally {
        setIsCheckingConnection(false);
      }
    };
    
    // Check once at startup
    checkConnection();
    
    // Set up event listeners for online/offline status
    const handleOnline = () => {
      setSupabaseConnected(true);
    };
    
    const handleOffline = () => {
      setSupabaseConnected(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isCheckingConnection, lastCheckTime]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppLayout>
            {/* Only show connection status alert if there's an issue and we're not online */}
            {!supabaseConnected && !navigator.onLine && (
              <ConnectionStatusAlert 
                onRetry={async () => {
                  // Simplified retry logic
                  if (Date.now() - lastCheckTime < 10000) {
                    toast.info('Proszę poczekaj chwilę przed ponowną próbą');
                    return;
                  }
                  
                  window.location.reload();
                }}
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
