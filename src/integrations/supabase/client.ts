
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables from .env file
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://jorbqjareswzdrsmepbv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmJxamFyZXN3emRyc21lcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NTcyNjMsImV4cCI6MjA1ODEzMzI2M30.WtGgnQKLVD2ZuOq4qNrIfcmFc98U3Q6YLrCCRG_mrH4";

// Log initialization parameters to help with debugging
console.log('[SUPABASE] Initializing client with:', { url: SUPABASE_URL, keyLength: SUPABASE_PUBLISHABLE_KEY?.length || 0 });

// Custom fetch function with CORS handling and timeout logic
const enhancedFetch = (url: RequestInfo | URL, options?: RequestInit) => {
  // Create a new controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
  
  // Combine the signal from options with our timeout signal
  const originalSignal = options?.signal;
  if (originalSignal) {
    originalSignal.addEventListener('abort', () => controller.abort());
  }
  
  // Set up new options with our signal and CORS mode
  const fetchOptions: RequestInit = {
    ...options,
    signal: controller.signal,
    mode: 'cors' as RequestMode,
    credentials: 'include' as RequestCredentials
  };
  
  // Add custom cache-busting headers to avoid cached responses
  const headers = new Headers(options?.headers || {});
  headers.append('Cache-Control', 'no-cache, no-store, must-revalidate');
  headers.append('Pragma', 'no-cache');
  headers.append('Expires', '0');
  
  fetchOptions.headers = headers;
  
  // The fetch promise with improved error handling
  const fetchPromise = fetch(url, fetchOptions)
    .catch(error => {
      if (error.name === 'AbortError') {
        console.warn(`[SUPABASE-FETCH] Request to ${url.toString()} aborted due to timeout or manual abort`);
        throw new Error(`Request timed out or was aborted: ${url.toString()}`);
      }
      
      // For network errors, provide more diagnostic information
      if (error.message === 'Failed to fetch') {
        console.error(`[SUPABASE-FETCH] Network error with ${url.toString()}: ${navigator.onLine ? 'CORS issue or connection failed' : 'Device is offline'}`);
        throw new Error(`Network error: ${navigator.onLine ? 'CORS issue or connection failed' : 'Device is offline'}`);
      }
      
      throw error;
    })
    .finally(() => clearTimeout(timeoutId));
  
  return fetchPromise;
};

// Create a singleton instance with improved settings
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage,
    detectSessionInUrl: true
  },
  global: {
    headers: { 
      'x-application-name': 'scriptcreator',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    fetch: enhancedFetch
  },
  // Increased timeouts for all operations
  realtime: {
    timeout: 10000
  }
});

// Add connection validation function with improved retry logic and CORS handling
export const validateSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log(`[SUPABASE] Validating connection to ${SUPABASE_URL}`);
    const startTime = Date.now();
    
    // Direct API test with explicit 'no-cors' mode as fallback
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'OPTIONS',
        headers: {
          'apikey': SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          'Cache-Control': 'no-cache'
        },
        mode: 'cors' as RequestMode
      });
      
      if (response.ok) {
        const duration = Date.now() - startTime;
        console.log(`[SUPABASE] Direct API connection validated successfully in ${duration}ms`);
        return true;
      }
    } catch (directError) {
      console.warn('[SUPABASE] Direct API test failed:', directError);
    }
    
    return false;
  } catch (e) {
    console.error(`[SUPABASE] Connection validation exception:`, e);
    return false;
  }
};

// Check connection health with improved CORS handling and diagnostics
export const checkConnectionHealth = async (): Promise<{
  online: boolean;
  supabaseConnected: boolean;
  corsIssue: boolean;
  message?: string;
}> => {
  try {
    // First check if user is online at all
    if (!navigator.onLine) {
      return {
        online: false,
        supabaseConnected: false,
        corsIssue: false,
        message: 'Brak połączenia z internetem'
      };
    }
    
    // Check for CORS issues with a simple OPTIONS request
    try {
      const corsTestResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'OPTIONS',
        headers: {
          'apikey': SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors' as RequestMode
      });
      
      if (corsTestResponse.ok) {
        return {
          online: true,
          supabaseConnected: true,
          corsIssue: false
        };
      } else {
        return {
          online: true,
          supabaseConnected: false,
          corsIssue: true,
          message: 'Problem z CORS - sprawdź konfigurację Supabase'
        };
      }
    } catch (corsError) {
      return {
        online: true,
        supabaseConnected: false,
        corsIssue: true,
        message: 'Problem z CORS - sprawdź konfigurację Supabase'
      };
    }
  } catch (e) {
    console.error('[CONNECTION-CHECK] Exception during connection check:', e);
    return {
      online: navigator.onLine,
      supabaseConnected: false,
      corsIssue: e.message?.includes('CORS') || e.toString().includes('CORS'),
      message: e.message?.includes('CORS') || e.toString().includes('CORS')
        ? 'Problem z CORS - sprawdź konfigurację Supabase'
        : 'Błąd podczas sprawdzania połączenia'
    };
  }
};

// Run a one-time connection test on load
setTimeout(() => {
  validateSupabaseConnection()
    .then(isConnected => {
      console.log(`[SUPABASE] Initial connection test: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
    })
    .catch(err => console.error('[SUPABASE] Initial connection test error:', err));
}, 2000); // Delay by 2 seconds to avoid initial load pressure
