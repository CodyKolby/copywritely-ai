
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables from .env file
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://jorbqjareswzdrsmepbv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmJxamFyZXN3emRyc21lcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NTcyNjMsImV4cCI6MjA1ODEzMzI2M30.WtGgnQKLVD2ZuOq4qNrIfcmFc98U3Q6YLrCCRG_mrH4";

// Log initialization parameters to help with debugging
console.log('[SUPABASE] Initializing client with:', { url: SUPABASE_URL, keyLength: SUPABASE_PUBLISHABLE_KEY?.length || 0 });

// Create a singleton instance with more aggressive timeout settings
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage,
    detectSessionInUrl: true
  },
  global: {
    headers: { 'x-application-name': 'scriptcreator' },
    // Custom fetch with shorter timeout to fail faster
    fetch: (url, options) => {
      // Create a new controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      // Combine the signal from options with our timeout signal
      if (options?.signal) {
        options.signal.addEventListener('abort', () => controller.abort());
      }
      
      // Use our controller's signal
      const fetchPromise = fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      // Clean up the timeout when the fetch completes
      fetchPromise.finally(() => clearTimeout(timeoutId));
      
      return fetchPromise;
    }
  },
  // Reduced realtime timeout
  realtime: {
    timeout: 5000 // 5 seconds for realtime connections
  }
});

// Add connection validation function with retry logic
export const validateSupabaseConnection = async (maxRetries = 2): Promise<boolean> => {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      console.log(`[SUPABASE] Validating connection to ${SUPABASE_URL} (attempt ${attempts + 1}/${maxRetries})`);
      const startTime = Date.now();
      
      // Use a simple query to check connectivity with shorter timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .abortSignal(controller.signal);
      
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      
      if (error) {
        console.error(`[SUPABASE] Connection failed in ${duration}ms (attempt ${attempts + 1}/${maxRetries}):`, error);
        attempts++;
        
        if (attempts < maxRetries) {
          // Short backoff: 1s between attempts
          console.log(`[SUPABASE] Retrying in 1000ms...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
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
        // Short backoff
        await new Promise(resolve => setTimeout(resolve, 1000));
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
    
    // Try a direct ping request to Supabase with a short timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        headers: { 'apikey': SUPABASE_PUBLISHABLE_KEY },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return {
          online: true,
          supabaseConnected: false,
          message: 'Serwer Supabase jest niedostępny'
        };
      }
    } catch (e) {
      console.warn('[CONNECTION-CHECK] Ping to Supabase failed:', e);
      // Continue anyway to try the query method
    }
    
    // Then try a simple query with short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const { error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .abortSignal(controller.signal);
      
    clearTimeout(timeoutId);
    
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
  } catch (e) {
    console.error('[CONNECTION-CHECK] Exception during connection check:', e);
    return {
      online: navigator.onLine,
      supabaseConnected: false,
      message: 'Błąd podczas sprawdzania połączenia'
    };
  }
};

// Run a short connection test on module load
setTimeout(() => {
  validateSupabaseConnection(1)
    .then(isConnected => {
      console.log(`[SUPABASE] Initial connection test: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
      if (!isConnected) {
        console.warn('[SUPABASE] Connection failed, app functionality may be limited');
      }
    })
    .catch(err => console.error('[SUPABASE] Initial connection test error:', err));
}, 500);
