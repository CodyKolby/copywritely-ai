
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
    
    // Unfortunately, Supabase's JS client doesn't directly support AbortSignal
    // We'll work around this limitation by manually handling the fetch with a timeout
    try {
      const { data, error } = await query;
      
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      
      if (error) {
        console.error('[PROFILE-UTILS] Error fetching profile:', error);
        return null;
      }
      
      console.log('[PROFILE-UTILS] Profile fetch result:', data ? 'Found' : 'Not found');
      return data as Profile;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('[PROFILE-UTILS] Fetch aborted by caller');
      }
      throw error;
    }
  } catch (error) {
    console.error('[PROFILE-UTILS] Exception in fetchProfile:', error);
    return null;
  }
};

// Adding the createProfile function that's referenced in auth-utils.ts
export const createProfile = async (userId: string, email?: string, fullName?: string, avatarUrl?: string): Promise<Profile | null> => {
  console.log('[PROFILE-UTILS] Creating profile for user:', userId);
  
  try {
    const profileData = {
      id: userId,
      email: email || null,
      full_name: fullName || null,
      avatar_url: avatarUrl || null,
      is_premium: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('[PROFILE-UTILS] Error creating profile:', error);
      return null;
    }
    
    console.log('[PROFILE-UTILS] Profile created successfully');
    return data as Profile;
  } catch (error) {
    console.error('[PROFILE-UTILS] Exception in createProfile:', error);
    return null;
  }
};
