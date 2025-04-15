
import { supabase } from '@/integrations/supabase/client';

// Re-export the Supabase client for easier imports
export { supabase };

// Export a function to check connection health
export const checkSupabaseConnection = async () => {
  try {
    console.log('[SUPABASE-CHECK] Attempting connection check...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('[SUPABASE-CHECK] Connection error:', error);
      return false;
    }
    
    console.log('[SUPABASE-CHECK] Connection successful');
    return true;
  } catch (e) {
    console.error('[SUPABASE-CHECK] Exception during connection check:', e);
    return false;
  }
};
