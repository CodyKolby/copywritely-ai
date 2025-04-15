
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from './types';

export const fetchProfile = async (userId: string, signal?: AbortSignal): Promise<Profile | null> => {
  console.log('[PROFILE-UTILS] Fetching profile for user:', userId);
  
  try {
    const query = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    // Add abort signal if provided
    if (signal) {
      query.abortSignal(signal);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[PROFILE-UTILS] Error fetching profile:', error);
      return null;
    }
    
    console.log('[PROFILE-UTILS] Profile fetch result:', data ? 'Found' : 'Not found');
    return data as Profile;
  } catch (error) {
    console.error('[PROFILE-UTILS] Exception in fetchProfile:', error);
    return null;
  }
};
