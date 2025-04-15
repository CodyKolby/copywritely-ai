
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
    
    // Add retry logic for profile fetch with CORS handling
    let retries = 2;
    let lastError: any = null;
    
    while (retries >= 0) {
      try {
        // Try direct fetch first to check for CORS issues
        if (retries === 2) {
          try {
            const corsCheckResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL || "https://jorbqjareswzdrsmepbv.supabase.co"}/rest/v1/profiles?id=eq.${userId}&limit=1`, {
              method: 'GET',
              headers: {
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmJxamFyZXN3emRyc21lcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NTcyNjMsImV4cCI6MjA1ODEzMzI2M30.WtGgnQKLVD2ZuOq4qNrIfcmFc98U3Q6YLrCCRG_mrH4",
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmJxamFyZXN3emRyc21lcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NTcyNjMsImV4cCI6MjA1ODEzMzI2M30.WtGgnQKLVD2ZuOq4qNrIfcmFc98U3Q6YLrCCRG_mrH4"}`,
                'X-Client-Info': 'supabase-js',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              mode: 'cors'
            });

            if (corsCheckResponse.ok) {
              const profileData = await corsCheckResponse.json();
              if (profileData && profileData.length > 0) {
                console.log('[PROFILE-UTILS] Profile fetched through direct API (no CORS issues)');
                return profileData[0] as Profile;
              }
            }
          } catch (corsError) {
            console.warn('[PROFILE-UTILS] Direct fetch failed - possible CORS issue:', corsError);
          }
        }
        
        // Start the query using SDK
        const queryPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        // If we have an abort signal, create a race between the query and the abort
        let result;
        if (signal) {
          const raceResult = await Promise.race([
            queryPromise,
            abortPromise
          ]);
          result = raceResult;
        } else {
          result = await queryPromise;
        }
        
        // Check for errors from Supabase
        if (result.error) {
          console.error(`[PROFILE-UTILS] Error fetching profile (attempt ${2-retries}/2):`, result.error);
          lastError = result.error;
          retries--;
          
          if (retries >= 0) {
            // Add backoff delay
            await new Promise(resolve => setTimeout(resolve, 1000 * (2 - retries)));
            continue;
          }
          return null;
        }
        
        console.log('[PROFILE-UTILS] Profile fetch result:', result.data ? 'Found' : 'Not found');
        return result.data as Profile;
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('[PROFILE-UTILS] Fetch aborted by caller');
          throw error;
        } else {
          console.error(`[PROFILE-UTILS] Exception in fetchProfile (attempt ${2-retries}/2):`, error);
          lastError = error;
          retries--;
          
          if (retries >= 0) {
            // Add backoff delay
            await new Promise(resolve => setTimeout(resolve, 1000 * (2 - retries)));
            continue;
          }
          throw error;
        }
      }
    }
    
    console.error('[PROFILE-UTILS] All fetch attempts failed, last error:', lastError);
    return null;
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
        
        // Try direct fetch first to check for CORS issues
        if (tries === 1) {
          try {
            const corsCheckResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL || "https://jorbqjareswzdrsmepbv.supabase.co"}/rest/v1/profiles`, {
              method: 'POST',
              headers: {
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmJxamFyZXN3emRyc21lcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NTcyNjMsImV4cCI6MjA1ODEzMzI2M30.WtGgnQKLVD2ZuOq4qNrIfcmFc98U3Q6YLrCCRG_mrH4",
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmJxamFyZXN3emRyc21lcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NTcyNjMsImV4cCI6MjA1ODEzMzI2M30.WtGgnQKLVD2ZuOq4qNrIfcmFc98U3Q6YLrCCRG_mrH4"}`,
                'X-Client-Info': 'supabase-js',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              },
              body: JSON.stringify(profileData),
              mode: 'cors'
            });

            if (corsCheckResponse.ok) {
              const responseData = await corsCheckResponse.json();
              if (responseData && responseData.length > 0) {
                console.log('[PROFILE-UTILS] Profile created through direct API (no CORS issues)');
                return responseData[0] as Profile;
              }
            }
          } catch (corsError) {
            console.warn('[PROFILE-UTILS] Direct profile creation failed - possible CORS issue:', corsError);
          }
        }
        
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
