
import { supabase, validateSupabaseConnection, checkConnectionHealth } from '@/integrations/supabase/client';

// Re-export the Supabase client and util functions for easier imports
export { supabase, validateSupabaseConnection, checkConnectionHealth };

// Export a function to check connection health with retry logic
export const checkSupabaseConnectionWithRetry = async (maxRetries = 3): Promise<boolean> => {
  try {
    console.log('[SUPABASE-CHECK] Attempting connection check with retries...');
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`[SUPABASE-CHECK] Connection attempt ${attempt + 1}/${maxRetries}...`);
        
        // Try a direct fetch request first to check for CORS issues
        try {
          const corsCheckResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL || "https://jorbqjareswzdrsmepbv.supabase.co"}/rest/v1/profiles?select=count&limit=1`, {
            method: 'GET',
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmJxamFyZXN3emRyc21lcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NTcyNjMsImV4cCI6MjA1ODEzMzI2M30.WtGgnQKLVD2ZuOq4qNrIfcmFc98U3Q6YLrCCRG_mrH4",
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmJxamFyZXN3emRyc21lcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NTcyNjMsImV4cCI6MjA1ODEzMzI2M30.WtGgnQKLVD2ZuOq4qNrIfcmFc98U3Q6YLrCCRG_mrH4"}`,
              'X-Client-Info': 'supabase-js',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Expires': '0',
              'X-Timestamp': Date.now().toString()
            },
            mode: 'cors'
          });
          
          if (corsCheckResponse.ok) {
            console.log('[SUPABASE-CHECK] Direct fetch successful - no CORS issues');
            return true;
          }
        } catch (corsError) {
          console.warn('[SUPABASE-CHECK] Direct fetch failed - possible CORS issue:', corsError);
          // Continue to try with the SDK
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);
        
        if (error) {
          console.error(`[SUPABASE-CHECK] Connection error on attempt ${attempt + 1}:`, error);
          
          if (attempt < maxRetries - 1) {
            // Exponential backoff: 1s, 2s, 4s, etc.
            const backoffTime = Math.min(1000 * Math.pow(2, attempt), 8000);
            console.log(`[SUPABASE-CHECK] Waiting ${backoffTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            continue;
          }
          return false;
        }
        
        console.log('[SUPABASE-CHECK] Connection successful');
        return true;
      } catch (e) {
        console.error(`[SUPABASE-CHECK] Exception during connection check attempt ${attempt + 1}:`, e);
        
        if (attempt < maxRetries - 1) {
          const backoffTime = Math.min(1000 * Math.pow(2, attempt), 8000);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        } else {
          return false;
        }
      }
    }
    
    return false;
  } catch (e) {
    console.error('[SUPABASE-CHECK] Exception during retry logic:', e);
    return false;
  }
};

// Function to help diagnose connection issues with CORS detection
export const diagnoseConnectionIssues = async (): Promise<{
  isOnline: boolean;
  canReachSupabaseUrl: boolean;
  canMakeApiCall: boolean;
  corsIssue: boolean;
  message: string;
}> => {
  const result = {
    isOnline: navigator.onLine,
    canReachSupabaseUrl: false,
    canMakeApiCall: false,
    corsIssue: false,
    message: ''
  };
  
  if (!result.isOnline) {
    result.message = 'Urządzenie nie jest połączone z internetem';
    return result;
  }
  
  // Check if we can reach the Supabase URL with timeout handling
  try {
    console.log('[SUPABASE-DIAGNOSE] Testing for CORS issues...');
    
    try {
      // Try with OPTIONS request first to check CORS preflight
      const corsController = new AbortController();
      const corsTimeoutId = setTimeout(() => corsController.abort(), 5000);
      
      const corsResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL || "https://jorbqjareswzdrsmepbv.supabase.co"}/rest/v1/`, {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmJxamFyZXN3emRyc21lcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NTcyNjMsImV4cCI6MjA1ODEzMzI2M30.WtGgnQKLVD2ZuOq4qNrIfcmFc98U3Q6YLrCCRG_mrH4"
        },
        mode: 'cors',
        signal: corsController.signal
      });
      
      clearTimeout(corsTimeoutId);
      
      if (!corsResponse.ok) {
        console.warn('[SUPABASE-DIAGNOSE] CORS preflight check failed');
        result.corsIssue = true;
      } else {
        console.log('[SUPABASE-DIAGNOSE] CORS preflight check succeeded');
      }
    } catch (corsError) {
      console.error('[SUPABASE-DIAGNOSE] CORS preflight check error:', corsError);
      
      if (corsError.toString().includes('CORS') || 
          corsError.message?.includes('CORS')) {
        result.corsIssue = true;
      }
    }
    
    // Now try a basic ping
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const pingResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL || "https://jorbqjareswzdrsmepbv.supabase.co"}/ping`, { 
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'X-Timestamp': Date.now().toString()
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      result.canReachSupabaseUrl = pingResponse.ok;
      
      if (!pingResponse.ok && pingResponse.status === 0) {
        console.warn('[SUPABASE-DIAGNOSE] Ping failed with status 0 - likely CORS issue');
        result.corsIssue = true;
      }
    } catch (e) {
      clearTimeout(timeoutId);
      console.error('[SUPABASE-DIAGNOSE] Error pinging Supabase URL:', e);
      
      if (e.toString().includes('CORS') || 
          e.message?.includes('CORS')) {
        result.corsIssue = true;
      }
    }
  } catch (e) {
    console.error('[SUPABASE-DIAGNOSE] Error setting up ping request:', e);
    
    if (e.toString().includes('CORS') || 
        e.message?.includes('CORS')) {
      result.corsIssue = true;
    }
  }
  
  // Try to make a simple API call
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .abortSignal(controller.signal);
      
      clearTimeout(timeoutId);
      result.canMakeApiCall = !error;
      
      if (error && (error.message?.includes('CORS') || 
                   error.toString().includes('CORS'))) {
        result.corsIssue = true;
      }
    } catch (e) {
      clearTimeout(timeoutId);
      console.error('[SUPABASE-DIAGNOSE] Error making API call:', e);
      
      if (e.toString().includes('CORS') || 
          e.message?.includes('CORS')) {
        result.corsIssue = true;
      }
    }
  } catch (e) {
    console.error('[SUPABASE-DIAGNOSE] Error setting up API call:', e);
  }
  
  // Set appropriate message
  if (result.corsIssue) {
    result.message = 'Problem z CORS - sprawdź ustawienia dozwolonych źródeł w Supabase';
  } else if (!result.canReachSupabaseUrl) {
    result.message = 'Nie można połączyć się z serwerem Supabase';
  } else if (!result.canMakeApiCall) {
    result.message = 'Połączenie z URL działa, ale nie można wykonać zapytania API';
  } else {
    result.message = 'Wszystkie testy połączenia przeszły pomyślnie';
  }
  
  return result;
};
