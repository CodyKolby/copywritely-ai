
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/auth/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { AppLayout } from './components/layout/AppLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes } from './routes';
import { Toaster as SonnerToaster, toast } from 'sonner'; // Import toast directly here
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
  const [corsIssueDetected, setCorsIssueDetected] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(0);

  // Verify Supabase connection on app start - with reduced frequency
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
        
        try {
          // Simple preflight check - just once
          const corsResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL || "https://jorbqjareswzdrsmepbv.supabase.co"}/rest/v1/`, {
            method: 'OPTIONS',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmJxamFyZXN3emRyc21lcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NTcyNjMsImV4cCI6MjA1ODEzMzI2M30.WtGgnQKLVD2ZuOq4qNrIfcmFc98U3Q6YLrCCRG_mrH4"
            },
            mode: 'cors'
          });
          
          if (!corsResponse.ok) {
            setCorsIssueDetected(true);
            setSupabaseConnected(false);
          } else {
            setCorsIssueDetected(false);
            setSupabaseConnected(true);
          }
        } catch (error) {
          console.error('[APP] Error during CORS check:', error);
          setCorsIssueDetected(true);
          setSupabaseConnected(false);
        }
      } catch (error) {
        console.error('[APP] Error verifying Supabase connection:', error);
        setSupabaseConnected(false);
      } finally {
        setIsCheckingConnection(false);
      }
    };
    
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
    
    // Do NOT set periodic check to avoid spamming
    
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
            {/* Only show connection status alert if there's an issue */}
            {(!supabaseConnected || corsIssueDetected) && (
              <ConnectionStatusAlert 
                onRetry={async () => {
                  if (Date.now() - lastCheckTime < 10000) {
                    toast.info('Proszę poczekaj chwilę przed ponowną próbą');
                    return;
                  }
                  
                  try {
                    setIsCheckingConnection(true);
                    
                    // Simple check
                    const corsResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL || "https://jorbqjareswzdrsmepbv.supabase.co"}/rest/v1/`, {
                      method: 'OPTIONS',
                      headers: {
                        'Content-Type': 'application/json',
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmJxamFyZXN3emRyc21lcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NTcyNjMsImV4cCI6MjA1ODEzMzI2M30.WtGgnQKLVD2ZuOq4qNrIfcmFc98U3Q6YLrCCRG_mrH4"
                      },
                      mode: 'cors'
                    });
                    
                    if (corsResponse.ok) {
                      setCorsIssueDetected(false);
                      setSupabaseConnected(true);
                      setLastCheckTime(Date.now());
                    } else {
                      setCorsIssueDetected(true);
                      setSupabaseConnected(false);
                      setLastCheckTime(Date.now());
                    }
                  } finally {
                    setIsCheckingConnection(false);
                  }
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
