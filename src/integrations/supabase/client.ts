
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
    mode: 'cors' as RequestMode, // Explicitly typed as RequestMode
    credentials: 'include' as RequestCredentials // Include credentials if needed
  };
  
  // Add custom cache-busting headers to avoid cached responses
  const headers = new Headers(options?.headers || {});
  headers.append('Cache-Control', 'no-cache, no-store, must-revalidate');
  headers.append('Pragma', 'no-cache');
  headers.append('Expires', '0');
  headers.append('X-Timestamp', Date.now().toString());
  headers.append('X-Random', Math.random().toString());
  
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
export const validateSupabaseConnection = async (maxRetries = 3): Promise<boolean> => {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      console.log(`[SUPABASE] Validating connection to ${SUPABASE_URL} (attempt ${attempts + 1}/${maxRetries})`);
      const startTime = Date.now();
      
      // First try to use the Rest API with our custom fetch
      try {
        // Direct API test with explicit 'no-cors' mode as fallback
        const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=count&limit=1`, {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
            'Cache-Control': 'no-cache',
            'X-Client-Info': 'supabase-js',
            'X-Timestamp': Date.now().toString(),
            'X-Random': Math.random().toString()
          },
          mode: 'cors'
        });
        
        if (response.ok) {
          const duration = Date.now() - startTime;
          console.log(`[SUPABASE] Direct API connection validated successfully in ${duration}ms`);
          return true;
        }
      } catch (directError) {
        console.warn('[SUPABASE] Direct API test failed:', directError);
        // Continue to use the SDK method if direct test fails
      }
      
      // Use the SDK method as fallback
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      const duration = Date.now() - startTime;
      
      if (error) {
        console.error(`[SUPABASE] Connection failed in ${duration}ms (attempt ${attempts + 1}/${maxRetries}):`, error);
        attempts++;
        
        if (attempts < maxRetries) {
          // Exponential backoff between retries
          const backoffTime = Math.min(1000 * Math.pow(2, attempts), 5000);
          console.log(`[SUPABASE] Retrying in ${backoffTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          continue;
        }
        return false;
      }
      
      console.log(`[SUPABASE] SDK connection validated successfully in ${duration}ms`);
      return true;
    } catch (e) {
      console.error(`[SUPABASE] Connection validation exception (attempt ${attempts + 1}/${maxRetries}):`, e);
      attempts++;
      
      if (attempts < maxRetries) {
        // Exponential backoff
        const backoffTime = Math.min(1000 * Math.pow(2, attempts), 5000);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      } else {
        return false;
      }
    }
  }
  
  return false;
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
    
    // Check for CORS issues first with a simple OPTIONS request
    try {
      console.log('[CONNECTION-CHECK] Testing CORS with preflight check');
      
      const corsTestResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'OPTIONS',
        headers: {
          'apikey': SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      
      if (!corsTestResponse.ok) {
        console.warn('[CONNECTION-CHECK] CORS preflight check failed with status:', corsTestResponse.status);
        return {
          online: true,
          supabaseConnected: false,
          corsIssue: true,
          message: 'Problem z CORS - sprawdź konfigurację Supabase'
        };
      }
      
      console.log('[CONNECTION-CHECK] CORS preflight check succeeded');
    } catch (corsError) {
      console.warn('[CONNECTION-CHECK] CORS check failed with error:', corsError);
      // Continue with other checks - this might be a CORS issue or another network issue
    }
    
    // Try a regular query with short timeout
    try {
      const queryController = new AbortController();
      const queryTimeoutId = setTimeout(() => queryController.abort(), 8000);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .abortSignal(queryController.signal);
        
      clearTimeout(queryTimeoutId);
      
      if (error) {
        console.error('[CONNECTION-CHECK] Supabase query failed:', error);
        return {
          online: true,
          supabaseConnected: false,
          corsIssue: error.message?.includes('CORS') || false,
          message: error.message?.includes('CORS') 
            ? 'Problem z CORS - sprawdź konfigurację Supabase'
            : 'Problem z połączeniem do bazy danych'
        };
      }
      
      return {
        online: true,
        supabaseConnected: true,
        corsIssue: false
      };
    } catch (queryError) {
      if (queryError.name === 'AbortError') {
        console.error('[CONNECTION-CHECK] Supabase query timed out');
        return {
          online: true,
          supabaseConnected: false,
          corsIssue: false,
          message: 'Zbyt długi czas odpowiedzi serwera'
        };
      }
      
      const isCorsError = queryError.message?.includes('CORS') || 
                         queryError.toString().includes('CORS');
      
      console.error('[CONNECTION-CHECK] Exception during Supabase query:', queryError);
      return {
        online: true,
        supabaseConnected: false,
        corsIssue: isCorsError,
        message: isCorsError 
          ? 'Problem z CORS - sprawdź konfigurację Supabase' 
          : 'Błąd podczas sprawdzania połączenia z bazą danych'
      };
    }
  } catch (e) {
    console.error('[CONNECTION-CHECK] Exception during connection check:', e);
    const isCorsError = e.message?.includes('CORS') || e.toString().includes('CORS');
    
    return {
      online: navigator.onLine,
      supabaseConnected: false,
      corsIssue: isCorsError,
      message: isCorsError 
        ? 'Problem z CORS - sprawdź konfigurację Supabase'
        : 'Błąd podczas sprawdzania połączenia'
    };
  }
};

// Run a connection test on module load with CORS diagnostics
setTimeout(() => {
  validateSupabaseConnection(1)
    .then(isConnected => {
      console.log(`[SUPABASE] Initial connection test: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
      if (!isConnected) {
        console.warn('[SUPABASE] Connection failed, app functionality may be limited');
        // Adding network diagnostic info to help with debugging
        console.log('[SUPABASE] Network diagnostics:', { 
          online: navigator.onLine,
          connectionType: (navigator as any).connection ? (navigator as any).connection.effectiveType : 'unknown'
        });
        
        // Run detailed diagnostics
        checkConnectionHealth()
          .then(status => {
            console.log('[SUPABASE] Connection health check:', status);
          })
          .catch(err => console.error('[SUPABASE] Health check error:', err));
      }
    })
    .catch(err => console.error('[SUPABASE] Initial connection test error:', err));
}, 1000);
