
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/auth/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { AppLayout } from './components/layout/AppLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes } from './routes';
import { Toaster as SonnerToaster, toast } from 'sonner'; // Import toast directly here
import React, { useState, useEffect } from 'react';
import { supabase, validateSupabaseConnection, checkConnectionHealth } from './integrations/supabase/client';
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

  // Verify Supabase connection on app start
  useEffect(() => {
    const checkConnection = async () => {
      if (isCheckingConnection) return;
      
      try {
        setIsCheckingConnection(true);
        
        // First check if we're online at all
        if (!navigator.onLine) {
          console.log('[APP] Device is offline, waiting for online event');
          setSupabaseConnected(false);
          return;
        }
        
        const startTime = Date.now();
        const connected = await validateSupabaseConnection();
        const duration = Date.now() - startTime;
        
        setSupabaseConnected(connected);
        console.log(`[APP] Supabase connection verified in ${duration}ms:`, connected ? 'successfully' : 'failed');
        
        if (!connected) {
          // Check if it's specifically a CORS issue
          const status = await checkConnectionHealth();
          setCorsIssueDetected(status.corsIssue);
          
          if (status.corsIssue) {
            console.warn('[APP] CORS issue detected, recommend adding domain to Supabase allowed origins');
            
            // Display CORS error message
            const currentDomain = window.location.origin;
            toast.error('Wykryto problem z CORS', {
              description: `Dodaj domenę ${currentDomain} do dozwolonych źródeł w ustawieniach Supabase`,
              duration: 10000
            });
          }
          
          // If initial connection fails, try again after 3 seconds
          setTimeout(async () => {
            try {
              const retryResult = await validateSupabaseConnection();
              setSupabaseConnected(retryResult);
              console.log('[APP] Supabase connection retry:', retryResult ? 'success' : 'failed');
              
              if (!retryResult) {
                const retryStatus = await checkConnectionHealth();
                setCorsIssueDetected(retryStatus.corsIssue);
              }
            } catch (retryError) {
              console.error('[APP] Error during connection retry:', retryError);
            }
          }, 3000);
        }
      } catch (error) {
        console.error('[APP] Error verifying Supabase connection:', error);
        setSupabaseConnected(false);
        
        // Check if it's a CORS error
        if (error.toString().includes('CORS') || 
            error.message?.includes('CORS')) {
          setCorsIssueDetected(true);
        }
      } finally {
        setIsCheckingConnection(false);
      }
    };
    
    checkConnection();
    
    // Set up event listeners for online/offline status
    const handleOnline = () => {
      console.log('[APP] Device went online, checking Supabase connection');
      checkConnection();
    };
    
    const handleOffline = () => {
      console.log('[APP] Device went offline');
      setSupabaseConnected(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Periodically check connection status
    const intervalId = setInterval(checkConnection, 30000); // Check every 30 seconds
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isCheckingConnection]);

  // Remove the require statement - Use the imported toast directly

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppLayout>
            {/* Connection status alert with CORS information */}
            <ConnectionStatusAlert 
              onRetry={async () => {
                try {
                  setIsCheckingConnection(true);
                  const connected = await validateSupabaseConnection();
                  setSupabaseConnected(connected);
                  
                  if (!connected) {
                    const status = await checkConnectionHealth();
                    setCorsIssueDetected(status.corsIssue);
                  } else {
                    setCorsIssueDetected(false);
                  }
                  
                  console.log('[APP] Connection retry result:', connected);
                } finally {
                  setIsCheckingConnection(false);
                }
              }}
              isChecking={isCheckingConnection}
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
