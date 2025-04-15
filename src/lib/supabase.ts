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

// Function to help diagnose connection issues
export const diagnoseConnectionIssues = async (): Promise<{
  isOnline: boolean;
  canReachSupabaseUrl: boolean;
  canMakeApiCall: boolean;
  message: string;
}> => {
  const result = {
    isOnline: navigator.onLine,
    canReachSupabaseUrl: false,
    canMakeApiCall: false,
    message: ''
  };
  
  if (!result.isOnline) {
    result.message = 'Urządzenie nie jest połączone z internetem';
    return result;
  }
  
  // Check if we can reach the Supabase URL
  try {
    const pingResponse = await fetch('https://jorbqjareswzdrsmepbv.supabase.co/ping', { 
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
    });
    
    result.canReachSupabaseUrl = pingResponse.ok;
  } catch (e) {
    console.error('[SUPABASE-DIAGNOSE] Error pinging Supabase URL:', e);
  }
  
  // Try to make a simple API call
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    result.canMakeApiCall = !error;
  } catch (e) {
    console.error('[SUPABASE-DIAGNOSE] Error making API call:', e);
  }
  
  // Set appropriate message
  if (!result.canReachSupabaseUrl) {
    result.message = 'Nie można połączyć się z serwerem Supabase';
  } else if (!result.canMakeApiCall) {
    result.message = 'Połączenie z URL działa, ale nie można wykonać zapytania API';
  } else {
    result.message = 'Wszystkie testy połączenia przeszły pomyślnie';
  }
  
  return result;
};
