
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
    
    // Start the query
    const queryPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    // Either wait for the query or for an abort signal
    const { data, error } = await (abortPromise 
      ? Promise.race([queryPromise, abortPromise as Promise<never>])
      : queryPromise);
    
    // Check for errors from Supabase
    if (error) {
      console.error('[PROFILE-UTILS] Error fetching profile:', error);
      return null;
    }
    
    console.log('[PROFILE-UTILS] Profile fetch result:', data ? 'Found' : 'Not found');
    return data as Profile;
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
    // Try an upsert first with retry logic
    let tries = 0;
    const maxTries = 2;
    
    while (tries < maxTries) {
      tries++;
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
          console.error(`[PROFILE-UTILS] Error creating profile (attempt ${tries}/${maxTries}):`, error);
          
          if (tries < maxTries) {
            console.log('[PROFILE-UTILS] Retrying profile creation...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          return null;
        }
        
        console.log('[PROFILE-UTILS] Profile created successfully');
        return data as Profile;
      } catch (attemptError) {
        console.error(`[PROFILE-UTILS] Exception in profile creation (attempt ${tries}/${maxTries}):`, attemptError);
        
        if (tries < maxTries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        throw attemptError;
      }
    }
    
    return null;
  } catch (error) {
    console.error('[PROFILE-UTILS] Exception in createProfile:', error);
    return null;
  }
};
