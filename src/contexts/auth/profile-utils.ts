import { supabase } from '@/integrations/supabase/client';
import { Profile } from './types';

// Helper function to add delay for retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetches user profile from database with retry logic
 */
export const fetchProfile = async (userId: string, maxAttempts = 3): Promise<Profile | null> => {
  if (!userId) {
    console.error('[PROFILE-UTILS] No user ID provided for profile fetch');
    return null;
  }

  let currentAttempt = 0;
  
  while (currentAttempt < maxAttempts) {
    try {
      currentAttempt++;
      const retryText = currentAttempt > 1 ? ` (attempt ${currentAttempt}/${maxAttempts})` : '';
      console.log(`[PROFILE-UTILS] Fetching profile for user: ${userId}${retryText}`);
      
      // First, try to find an existing profile with standard query
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) {
        console.error(`[PROFILE-UTILS] Error fetching profile${retryText}:`, error);
        
        // If we have more attempts, wait and try again
        if (currentAttempt < maxAttempts) {
          const backoffTime = 1000 * Math.pow(2, currentAttempt - 1); // Exponential backoff
          console.log(`[PROFILE-UTILS] Retrying in ${backoffTime}ms...`);
          await delay(backoffTime);
          continue;
        }
      } else if (data) {
        console.log('[PROFILE-UTILS] Profile fetched successfully:', data);
        return data as Profile;
      } else {
        console.warn('[PROFILE-UTILS] No profile found for user ID:', userId);
        
        // If we tried multiple times and still no profile, try to create one
        if (currentAttempt >= maxAttempts) {
          return await createProfile(userId);
        }
        
        // Otherwise continue with retries
        if (currentAttempt < maxAttempts) {
          const backoffTime = 1000 * Math.pow(2, currentAttempt - 1);
          console.log(`[PROFILE-UTILS] Retrying profile fetch in ${backoffTime}ms...`);
          await delay(backoffTime);
          continue;
        }
      }
    } catch (error) {
      console.error(`[PROFILE-UTILS] Exception fetching profile (attempt ${currentAttempt}/${maxAttempts}):`, error);
      
      // If more attempts are available, retry with backoff
      if (currentAttempt < maxAttempts) {
        const backoffTime = 1000 * Math.pow(2, currentAttempt - 1);
        console.log(`[PROFILE-UTILS] Retrying after error in ${backoffTime}ms...`);
        await delay(backoffTime);
        continue;
      }
      
      // Last attempt failed, try to create profile
      return createProfile(userId);
    }
  }
  
  // If we get here, all attempts failed
  console.log('[PROFILE-UTILS] All profile fetch attempts failed, trying to create profile');
  return createProfile(userId);
};

/**
 * Creates a new profile for a user with retry logic
 */
export const createProfile = async (userId: string, maxAttempts = 2): Promise<Profile | null> => {
  if (!userId) {
    console.error('[PROFILE-UTILS] No user ID provided for profile creation');
    return null;
  }

  let currentAttempt = 0;
  
  while (currentAttempt < maxAttempts) {
    try {
      currentAttempt++;
      const retryText = currentAttempt > 1 ? ` (attempt ${currentAttempt}/${maxAttempts})` : '';
      console.log(`[PROFILE-UTILS] Creating profile for user: ${userId}${retryText}`);
      
      // Get current session for user data
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      
      if (!user) {
        console.warn('[PROFILE-UTILS] No user session available for profile creation');
        
        // Try to create a minimal profile anyway since we have the ID
        try {
          console.log('[PROFILE-UTILS] Attempting minimal profile creation with ID only');
          const { data: minimalData, error: minimalError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              is_premium: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('id, is_premium')
            .maybeSingle();
            
          if (minimalError) {
            console.error('[PROFILE-UTILS] Error creating minimal profile:', minimalError);
            
            if (currentAttempt < maxAttempts) {
              await delay(1000 * currentAttempt);
              continue;
            }
          } else if (minimalData) {
            console.log('[PROFILE-UTILS] Minimal profile created:', minimalData);
            return minimalData as Profile;
          }
        } catch (minimalCreateError) {
          console.error('[PROFILE-UTILS] Exception creating minimal profile:', minimalCreateError);
          
          if (currentAttempt < maxAttempts) {
            await delay(1000 * currentAttempt);
            continue;
          }
        }
        
        return null;
      }
      
      // Extract useful data from user object
      const email = user.email;
      const userMetadata = user.user_metadata || {};
      
      // Generate a default name from email if no name is available in metadata
      const defaultName = email ? email.split('@')[0] : `User-${userId.substring(0, 8)}`;
      const fullName = userMetadata.full_name || userMetadata.name || defaultName;
      
      // Create profile with manual data from session if available
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email || null,
          full_name: fullName,
          avatar_url: userMetadata.avatar_url || null,
          is_premium: false,
          updated_at: new Date().toISOString()
        })
        .select('id, email, full_name, avatar_url, is_premium')
        .maybeSingle();
        
      if (error) {
        console.error(`[PROFILE-UTILS] Error creating profile${retryText}:`, error);
        
        if (currentAttempt < maxAttempts) {
          await delay(1000 * currentAttempt);
          continue;
        }
      } else if (data) {
        console.log('[PROFILE-UTILS] Profile created successfully:', data);
        return data as Profile;
      }
    } catch (error) {
      console.error(`[PROFILE-UTILS] Exception creating profile (attempt ${currentAttempt}/${maxAttempts}):`, error);
      
      if (currentAttempt < maxAttempts) {
        await delay(1000 * currentAttempt);
        continue;
      }
    }
  }
  
  // All attempts failed
  console.error('[PROFILE-UTILS] All attempts to create profile failed');
  return null;
};

/**
 * Updates premium status for a user profile
 */
export const updatePremiumStatus = async (userId: string, isPremium: boolean): Promise<boolean> => {
  if (!userId) {
    console.error('[PROFILE-UTILS] No user ID provided for premium status update');
    return false;
  }

  try {
    console.log(`[PROFILE-UTILS] Updating premium status to ${isPremium} for user: ${userId}`);
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_premium: isPremium,
        subscription_status: isPremium ? 'active' : 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (error) {
      console.error('[PROFILE-UTILS] Error updating premium status:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[PROFILE-UTILS] Exception updating premium status:', error);
    return false;
  }
};

/**
 * Force create profile if not exists
 */
export const ensureProfileExists = async (userId: string): Promise<boolean> => {
  if (!userId) {
    console.error('[PROFILE-UTILS] No user ID provided for profile check');
    return false;
  }
  
  try {
    console.log(`[PROFILE-UTILS] Ensuring profile exists for user: ${userId}`);
    
    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (checkError) {
      console.error('[PROFILE-UTILS] Error checking profile existence:', checkError);
    }
    
    if (existingProfile) {
      console.log('[PROFILE-UTILS] Profile already exists for user:', userId);
      return true;
    }
    
    // Create minimal profile
    console.log('[PROFILE-UTILS] Profile does not exist, creating minimal profile');
    const { error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        is_premium: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (createError) {
      console.error('[PROFILE-UTILS] Error creating minimal profile:', createError);
      return false;
    }
    
    console.log('[PROFILE-UTILS] Minimal profile created successfully');
    return true;
  } catch (error) {
    console.error('[PROFILE-UTILS] Exception ensuring profile exists:', error);
    return false;
  }
};
