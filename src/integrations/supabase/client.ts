
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables from .env file
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://jorbqjareswzdrsmepbv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmJxamFyZXN3emRyc21lcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NTcyNjMsImV4cCI6MjA1ODEzMzI2M30.WtGgnQKLVD2ZuOq4qNrIfcmFc98U3Q6YLrCCRG_mrH4";

// Log initialization parameters to help with debugging
console.log('[SUPABASE] Initializing client with:', { url: SUPABASE_URL, keyLength: SUPABASE_PUBLISHABLE_KEY?.length || 0 });

// Create a singleton instance with simple settings - no custom headers to avoid CORS issues
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage,
    detectSessionInUrl: true
  },
  realtime: {
    timeout: 10000
  }
});

// Cache to prevent redundant connection tests
let connectionTestCache = {
  isConnected: null as boolean | null,
  lastTested: 0
};

// Optimized connection validation function with caching
export const validateSupabaseConnection = async (): Promise<boolean> => {
  // Use cache if we tested within the last minute
  const now = Date.now();
  if (connectionTestCache.isConnected !== null && now - connectionTestCache.lastTested < 60000) {
    console.log(`[SUPABASE] Using cached connection status: ${connectionTestCache.isConnected}`);
    return connectionTestCache.isConnected;
  }
  
  try {
    console.log(`[SUPABASE] Validating connection to ${SUPABASE_URL}`);
    const startTime = Date.now();
    
    // Use a simplified check that shouldn't trigger CORS issues
    const { data, error } = await supabase.auth.getSession();
    
    const duration = Date.now() - startTime;
    const isConnected = !error;
    
    console.log(`[SUPABASE] Connection test completed in ${duration}ms with result: ${isConnected}`);
    
    // Update cache
    connectionTestCache.isConnected = isConnected;
    connectionTestCache.lastTested = now;
    
    return isConnected;
  } catch (e) {
    console.error(`[SUPABASE] Connection validation exception:`, e);
    
    // Update cache
    connectionTestCache.isConnected = false;
    connectionTestCache.lastTested = now;
    
    return false;
  }
};

// Simplified health check with caching
export const checkConnectionHealth = async (): Promise<{
  online: boolean;
  supabaseConnected: boolean;
  corsIssue: boolean;
  message?: string;
}> => {
  if (!navigator.onLine) {
    return {
      online: false,
      supabaseConnected: false,
      corsIssue: false,
      message: 'Brak połączenia z internetem'
    };
  }
  
  try {
    // Use cached connection status if available
    const now = Date.now();
    if (connectionTestCache.isConnected !== null && now - connectionTestCache.lastTested < 60000) {
      return {
        online: true,
        supabaseConnected: connectionTestCache.isConnected,
        corsIssue: false
      };
    }
    
    const isConnected = await validateSupabaseConnection();
    
    return {
      online: true,
      supabaseConnected: isConnected,
      corsIssue: false
    };
  } catch (e) {
    const errorStr = e.toString();
    return {
      online: true,
      supabaseConnected: false,
      corsIssue: errorStr.includes('CORS'),
      message: 'Błąd podczas sprawdzania połączenia'
    };
  }
};
