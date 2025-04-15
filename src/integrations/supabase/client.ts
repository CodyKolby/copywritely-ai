
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables from .env file
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://jorbqjareswzdrsmepbv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmJxamFyZXN3emRyc21lcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NTcyNjMsImV4cCI6MjA1ODEzMzI2M30.WtGgnQKLVD2ZuOq4qNrIfcmFc98U3Q6YLrCCRG_mrH4";

// Log initialization parameters to help with debugging
console.log('[SUPABASE] Initializing client with:', { url: SUPABASE_URL, keyLength: SUPABASE_PUBLISHABLE_KEY?.length || 0 });

// Improved fetch function with better timeout and retry handling
const enhancedFetch = (url: RequestInfo | URL, options?: RequestInit) => {
  // Create a new controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // Increased timeout to 12 seconds
  
  // Combine the signal from options with our timeout signal
  const originalSignal = options?.signal;
  if (originalSignal) {
    originalSignal.addEventListener('abort', () => controller.abort());
  }
  
  // Use our controller's signal
  const fetchOptions = {
    ...options,
    signal: controller.signal
  };
  
  // The fetch promise with improved error handling
  const fetchPromise = fetch(url, fetchOptions)
    .catch(error => {
      if (error.name === 'AbortError') {
        console.warn(`[SUPABASE-FETCH] Request to ${url.toString()} aborted due to timeout or manual abort`);
        // Throw a more informative abort error
        throw new Error(`Request timed out or was aborted: ${url.toString()}`);
      }
      // For network errors, provide more diagnostic information
      if (error.message === 'Failed to fetch') {
        console.error(`[SUPABASE-FETCH] Network error with ${url.toString()}: ${navigator.onLine ? 'Online but connection failed' : 'Device is offline'}`);
        throw new Error(`Network error: ${navigator.onLine ? 'Connection failed' : 'Device is offline'}`);
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
    headers: { 'x-application-name': 'scriptcreator' },
    fetch: enhancedFetch
  },
  // Reduced realtime timeout
  realtime: {
    timeout: 8000 // Increased from 5 seconds to 8 seconds for realtime connections
  }
});

// Add connection validation function with improved retry logic
export const validateSupabaseConnection = async (maxRetries = 2): Promise<boolean> => {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      console.log(`[SUPABASE] Validating connection to ${SUPABASE_URL} (attempt ${attempts + 1}/${maxRetries})`);
      const startTime = Date.now();
      
      // Use a simple query to check connectivity
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
          const backoffTime = Math.min(1000 * Math.pow(2, attempts), 4000);
          console.log(`[SUPABASE] Retrying in ${backoffTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          continue;
        }
        return false;
      }
      
      console.log(`[SUPABASE] Connection validated successfully in ${duration}ms`);
      return true;
    } catch (e) {
      console.error(`[SUPABASE] Connection validation exception (attempt ${attempts + 1}/${maxRetries}):`, e);
      attempts++;
      
      if (attempts < maxRetries) {
        // Exponential backoff
        const backoffTime = Math.min(1000 * Math.pow(2, attempts), 4000);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      } else {
        return false;
      }
    }
  }
  
  return false;
};

// Check connection health - improved with timeouts and error handling
export const checkConnectionHealth = async (): Promise<{
  online: boolean;
  supabaseConnected: boolean;
  message?: string;
}> => {
  try {
    // First check if user is online at all
    if (!navigator.onLine) {
      return {
        online: false,
        supabaseConnected: false,
        message: 'Brak połączenia z internetem'
      };
    }
    
    // Try a ping to the Supabase host first to see if it's reachable
    try {
      const pingController = new AbortController();
      const pingTimeoutId = setTimeout(() => pingController.abort(), 5000);
      
      const response = await fetch(`${SUPABASE_URL}/ping`, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
        signal: pingController.signal
      });
      
      clearTimeout(pingTimeoutId);
      
      if (!response.ok) {
        console.warn('[CONNECTION-CHECK] Ping to Supabase failed with status:', response.status);
      } else {
        console.log('[CONNECTION-CHECK] Ping to Supabase succeeded');
      }
    } catch (pingError) {
      console.warn('[CONNECTION-CHECK] Ping to Supabase failed:', pingError);
      // Continue anyway - the ping might fail but the API might still work
    }
    
    // Then try a simple query with short timeout
    try {
      const queryController = new AbortController();
      const queryTimeoutId = setTimeout(() => queryController.abort(), 6000); // Increased to 6 seconds
      
      const { error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
        
      clearTimeout(queryTimeoutId);
      
      if (error) {
        console.error('[CONNECTION-CHECK] Supabase query failed:', error);
        return {
          online: true,
          supabaseConnected: false,
          message: 'Problem z połączeniem do bazy danych'
        };
      }
      
      return {
        online: true,
        supabaseConnected: true
      };
    } catch (queryError) {
      if (queryError.name === 'AbortError') {
        console.error('[CONNECTION-CHECK] Supabase query timed out');
        return {
          online: true,
          supabaseConnected: false,
          message: 'Zbyt długi czas odpowiedzi serwera'
        };
      }
      
      console.error('[CONNECTION-CHECK] Exception during Supabase query:', queryError);
      return {
        online: true,
        supabaseConnected: false,
        message: 'Błąd podczas sprawdzania połączenia z bazą danych'
      };
    }
  } catch (e) {
    console.error('[CONNECTION-CHECK] Exception during connection check:', e);
    return {
      online: navigator.onLine,
      supabaseConnected: false,
      message: 'Błąd podczas sprawdzania połączenia'
    };
  }
};

// Run a connection test on module load with improved error handling
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
      }
    })
    .catch(err => console.error('[SUPABASE] Initial connection test error:', err));
}, 1000); // Slight delay to ensure other modules are loaded
