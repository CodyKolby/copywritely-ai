
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/auth/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { AppLayout } from './components/layout/AppLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes } from './routes';
import { Toaster as SonnerToaster } from 'sonner';
import React, { useState, useEffect } from 'react';
import { supabase, validateSupabaseConnection } from './integrations/supabase/client';
import { ConnectionStatusAlert } from './components/ui/ConnectionStatusAlert';

// Configure longer default timeouts for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      staleTime: 60000,
      refetchOnWindowFocus: false,
      timeout: 30000
    },
    mutations: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15000)
    }
  }
});

function App() {
  const [supabaseConnected, setSupabaseConnected] = useState(true);

  // Verify Supabase connection on app start
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connected = await validateSupabaseConnection();
        setSupabaseConnected(connected);
        
        console.log('[APP] Supabase connection verified:', connected ? 'successfully' : 'failed');
        
        if (!connected) {
          // If initial connection fails, try again after 3 seconds
          setTimeout(async () => {
            const retryResult = await validateSupabaseConnection();
            setSupabaseConnected(retryResult);
            console.log('[APP] Supabase connection retry:', retryResult ? 'success' : 'failed');
          }, 3000);
        }
      } catch (error) {
        console.error('[APP] Error verifying Supabase connection:', error);
        setSupabaseConnected(false);
      }
    };
    
    checkConnection();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppLayout>
            {/* Connection status alert */}
            <ConnectionStatusAlert 
              onRetry={async () => {
                const connected = await validateSupabaseConnection();
                setSupabaseConnected(connected);
              }}
            />
            
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
