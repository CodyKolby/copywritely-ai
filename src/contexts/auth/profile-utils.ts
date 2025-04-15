
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from './types';

export const fetchProfile = async (userId: string, signal?: AbortSignal): Promise<Profile | null> => {
  console.log('[PROFILE-UTILS] Fetching profile for user:', userId);
  
  try {
    // We'll check for abort before making the request
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    
    // Create a promise that will reject when the signal aborts
    let abortPromise: Promise<never> | null = null;
    if (signal) {
      abortPromise = new Promise((_, reject) => {
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      });
    }
    
    // Basic fetch with no retries to avoid loops
    try {
      // Start the query
      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      // If we have an abort signal, create a race between the query and the abort
      let result;
      if (signal && abortPromise) {
        result = await Promise.race([
          queryPromise,
          abortPromise
        ]);
      } else {
        result = await queryPromise;
      }
      
      // Check for errors from Supabase
      if (result.error) {
        console.error(`[PROFILE-UTILS] Error fetching profile:`, result.error);
        return null;
      }
      
      console.log('[PROFILE-UTILS] Profile fetch result:', result.data ? 'Found' : 'Not found');
      return result.data as Profile;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('[PROFILE-UTILS] Fetch aborted by caller');
        throw error;
      } else {
        console.error(`[PROFILE-UTILS] Exception in fetchProfile:`, error);
        throw error;
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('[PROFILE-UTILS] Fetch aborted by caller');
    } else {
      console.error('[PROFILE-UTILS] Exception in fetchProfile:', error);
    }
    throw error;
  }
};

// Adding the createProfile function that's referenced in auth-utils.ts
export const createProfile = async (
  userId: string, 
  email?: string, 
  fullName?: string, 
  avatarUrl?: string
): Promise<Profile | null> => {
  console.log('[PROFILE-UTILS] Creating profile for user:', userId);
  
  try {
    // Simple upsert with no retries
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
      console.error('[PROFILE-UTILS] Exception in profile creation:', error);
      return null;
    }
    
    return null;
  } catch (error) {
    console.error('[PROFILE-UTILS] Exception in createProfile:', error);
    return null;
  }
};
