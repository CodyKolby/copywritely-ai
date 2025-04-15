
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables from .env file
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://jorbqjareswzdrsmepbv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmJxamFyZXN3emRyc21lcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NTcyNjMsImV4cCI6MjA1ODEzMzI2M30.WtGgnQKLVD2ZuOq4qNrIfcmFc98U3Q6YLrCCRG_mrH4";

// Log initialization parameters to help with debugging
console.log('[SUPABASE] Initializing client with:', { url: SUPABASE_URL, keyLength: SUPABASE_PUBLISHABLE_KEY?.length || 0 });

// Create a singleton instance with optimized configuration for better reliability
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage,
    storageKey: 'sb-jorbqjareswzdrsmepbv-auth-token',
    detectSessionInUrl: true,
    flowType: 'implicit'
  },
  global: {
    headers: { 'x-application-name': 'scriptcreator' },
    // Increase timeouts to prevent quick failures
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        signal: options?.signal || (AbortSignal && AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined)
      });
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    timeout: 30000 // 30 seconds for realtime connections
  }
});

// Add connection validation function with retry logic
export const validateSupabaseConnection = async (maxRetries = 3): Promise<boolean> => {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      console.log(`[SUPABASE] Validating connection to ${SUPABASE_URL} (attempt ${attempts + 1}/${maxRetries})`);
      const startTime = Date.now();
      
      // Use a simple query to check connectivity
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .timeout(10000); // 10 second timeout for this query
      
      const duration = Date.now() - startTime;
      
      if (error) {
        console.error(`[SUPABASE] Connection failed in ${duration}ms (attempt ${attempts + 1}/${maxRetries}):`, error);
        attempts++;
        
        if (attempts < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s, etc.
          const backoff = Math.min(1000 * Math.pow(2, attempts), 8000);
          console.log(`[SUPABASE] Retrying in ${backoff}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
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
        const backoff = Math.min(1000 * Math.pow(2, attempts), 8000);
        console.log(`[SUPABASE] Retrying in ${backoff}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
      } else {
        return false;
      }
    }
  }
  
  return false;
};

// Perform a reduced number of initial connection checks to avoid overwhelming logs
setTimeout(() => {
  validateSupabaseConnection(2)
    .then(isConnected => console.log(`[SUPABASE] Initial connection check: ${isConnected ? 'SUCCESS' : 'FAILED'}`))
    .catch(err => console.error('[SUPABASE] Initial connection check error:', err));
}, 1000);

// Add a connection health check function for components to use
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
    
    // Then check Supabase connection
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .timeout(5000);
      
    const duration = Date.now() - startTime;
    
    if (error) {
      console.error(`[CONNECTION-CHECK] Supabase connection failed in ${duration}ms:`, error);
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
  } catch (e) {
    console.error('[CONNECTION-CHECK] Exception during connection check:', e);
    return {
      online: navigator.onLine,
      supabaseConnected: false,
      message: 'Błąd podczas sprawdzania połączenia'
    };
  }
};
