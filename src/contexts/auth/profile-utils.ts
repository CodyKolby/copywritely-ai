
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
      
      // If profile not found, try to create it
      if (!result.data) {
        console.log('[PROFILE-UTILS] Profile not found, attempting to create it');
        return await createProfile(userId);
      }
      
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

// Function to create a profile, either locally or via edge function
export const createProfile = async (
  userId: string, 
  email?: string, 
  fullName?: string, 
  avatarUrl?: string
): Promise<Profile | null> => {
  console.log('[PROFILE-UTILS] Creating profile for user:', userId);
  
  try {
    // Try edge function first
    try {
      console.log('[PROFILE-UTILS] Trying to create profile with edge function');
      
      const response = await fetch('https://jorbqjareswzdrsmepbv.functions.supabase.co/create-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('[PROFILE-UTILS] Edge function profile creation successful:', result);
        return result.profile as Profile;
      } else {
        console.error('[PROFILE-UTILS] Edge function profile creation failed:', await response.text());
      }
    } catch (edgeFnError) {
      console.error('[PROFILE-UTILS] Error calling create-profile edge function:', edgeFnError);
    }
    
    // Fall back to direct creation
    console.log('[PROFILE-UTILS] Falling back to direct profile creation');
    
    // Try to get user data if not provided
    if (!email || !fullName) {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (user?.user) {
          email = email || user.user.email;
          fullName = fullName || user.user.user_metadata?.full_name || user.user.user_metadata?.name;
          avatarUrl = avatarUrl || user.user.user_metadata?.avatar_url;
        }
      } catch (userError) {
        console.error('[PROFILE-UTILS] Error getting user data:', userError);
      }
    }
    
    // If still no name, derive from email
    if (email && !fullName) {
      fullName = email.split('@')[0];
    }
    
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
        .single();
      
      if (error) {
        console.error('[PROFILE-UTILS] Error creating profile:', error);
        return null;
      }
      
      console.log('[PROFILE-UTILS] Profile created successfully:', data);
      return data as Profile;
    } catch (error) {
      console.error('[PROFILE-UTILS] Exception in profile creation:', error);
      return null;
    }
  } catch (error) {
    console.error('[PROFILE-UTILS] Exception in createProfile:', error);
    return null;
  }
};
