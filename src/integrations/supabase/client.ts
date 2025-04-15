
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables from .env file
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://jorbqjareswzdrsmepbv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmJxamFyZXN3emRyc21lcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NTcyNjMsImV4cCI6MjA1ODEzMzI2M30.WtGgnQKLVD2ZuOq4qNrIfcmFc98U3Q6YLrCCRG_mrH4";

// Log initialization parameters to help with debugging
console.log('[SUPABASE] Initializing client with:', { url: SUPABASE_URL, keyLength: SUPABASE_PUBLISHABLE_KEY?.length || 0 });

// Create a singleton instance with simple settings - reduced complexity
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage,
    detectSessionInUrl: true
  },
  global: {
    headers: { 
      'x-application-name': 'scriptcreator'
    }
  },
  realtime: {
    timeout: 10000
  }
});

// Simplified connection validation function
export const validateSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log(`[SUPABASE] Validating connection to ${SUPABASE_URL}`);
    const startTime = Date.now();
    
    // Basic connection test with standard fetch
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      mode: 'cors'
    });
    
    const duration = Date.now() - startTime;
    console.log(`[SUPABASE] Connection test completed in ${duration}ms with status: ${response.status}`);
    
    // Any response means the server is reachable, even if it's a 401
    return true;
  } catch (e) {
    console.error(`[SUPABASE] Connection validation exception:`, e);
    return false;
  }
};

// Simplified health check
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
    const isConnected = await validateSupabaseConnection();
    return {
      online: true,
      supabaseConnected: isConnected,
      corsIssue: false
    };
  } catch (e) {
    return {
      online: true,
      supabaseConnected: false,
      corsIssue: e.toString().includes('CORS'),
      message: 'Błąd podczas sprawdzania połączenia'
    };
  }
};
