
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables from .env file
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://jorbqjareswzdrsmepbv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmJxamFyZXN3emRyc21lcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NTcyNjMsImV4cCI6MjA1ODEzMzI2M30.WtGgnQKLVD2ZuOq4qNrIfcmFc98U3Q6YLrCCRG_mrH4";

// Log initialization parameters to help with debugging
console.log('[SUPABASE] Initializing client with:', { url: SUPABASE_URL, keyLength: SUPABASE_PUBLISHABLE_KEY?.length || 0 });

// Create a singleton instance with explicit auth configuration
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage,
    storageKey: 'sb-jorbqjareswzdrsmepbv-auth-token',
    detectSessionInUrl: true,
    flowType: 'implicit'
  }
});

// Add connection validation function
export const validateSupabaseConnection = async () => {
  try {
    console.log('[SUPABASE] Validating connection to:', SUPABASE_URL);
    const startTime = Date.now();
    
    // Use a simple query to check connectivity
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    const duration = Date.now() - startTime;
    
    if (error) {
      console.error(`[SUPABASE] Connection failed in ${duration}ms:`, error);
      return false;
    }
    
    console.log(`[SUPABASE] Connection validated successfully in ${duration}ms`);
    return true;
  } catch (e) {
    console.error('[SUPABASE] Connection validation exception:', e);
    return false;
  }
};

// Log initialization to help with debugging
console.log('[SUPABASE] Client initialized with URL:', SUPABASE_URL);

// Validate connection on app start
setTimeout(() => {
  validateSupabaseConnection()
    .then(isConnected => console.log(`[SUPABASE] Initial connection check: ${isConnected ? 'SUCCESS' : 'FAILED'}`))
    .catch(err => console.error('[SUPABASE] Initial connection check error:', err));
}, 1000);
