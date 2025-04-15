import { supabase } from '@/integrations/supabase/client';
import { Profile } from './types';

/**
 * Fetches user profile from database
 */
export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  if (!userId) {
    console.error('[PROFILE-UTILS] No user ID provided for profile fetch');
    return null;
  }

  try {
    console.log(`[PROFILE-UTILS] Fetching profile for user: ${userId}`);
    
    // First, try to find an existing profile with standard query
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
      
    if (error) {
      console.error('[PROFILE-UTILS] Error fetching profile:', error);
    } else if (data) {
      console.log('[PROFILE-UTILS] Profile fetched successfully:', data);
      return data as Profile;
    } else {
      console.warn('[PROFILE-UTILS] No profile found for user ID:', userId);
    }
    
    // If we get here, either no profile found or error occurred
    // Explicitly try again with a simplified query to avoid possible 406 errors
    try {
      console.log('[PROFILE-UTILS] Trying simplified query');
      const { data: simpleData, error: simpleError } = await supabase
        .from('profiles')
        .select('id, email, full_name, is_premium, avatar_url, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();
        
      if (simpleError) {
        console.error('[PROFILE-UTILS] Error with simplified query:', simpleError);
      } else if (simpleData) {
        console.log('[PROFILE-UTILS] Profile fetched with simplified query:', simpleData);
        return simpleData as Profile;
      } else {
        console.warn('[PROFILE-UTILS] No profile found with simplified query');
      }
    } catch (simpleQueryError) {
      console.error('[PROFILE-UTILS] Exception in simplified query:', simpleQueryError);
    }
    
    // If no profile or error, try to create one
    return await createProfile(userId);
  } catch (error) {
    console.error('[PROFILE-UTILS] Exception fetching profile:', error);
    // Try to create profile as a fallback
    return createProfile(userId);
  }
};

/**
 * Creates a new profile for a user
 */
export const createProfile = async (userId: string): Promise<Profile | null> => {
  if (!userId) {
    console.error('[PROFILE-UTILS] No user ID provided for profile creation');
    return null;
  }

  try {
    console.log(`[PROFILE-UTILS] Creating profile for user: ${userId}`);
    
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
        } else if (minimalData) {
          console.log('[PROFILE-UTILS] Minimal profile created:', minimalData);
          return minimalData as Profile;
        }
      } catch (minimalCreateError) {
        console.error('[PROFILE-UTILS] Exception creating minimal profile:', minimalCreateError);
      }
      
      return null;
    }
    
    console.log('[PROFILE-UTILS] User data retrieved for profile creation:', user);
    
    // Extract useful data from user object
    const email = user.email;
    const userMetadata = user.user_metadata || {};
    
    console.log('[PROFILE-UTILS] Current user metadata:', userMetadata);
    
    // Generate a default name from email if no name is available in metadata
    const defaultName = email ? email.split('@')[0] : `User-${userId.substring(0, 8)}`;
    const fullName = userMetadata.full_name || userMetadata.name || defaultName;
    
    console.log('[PROFILE-UTILS] Using name for profile:', fullName);
    
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
      console.error('[PROFILE-UTILS] Error creating profile:', error);
      
      // Try a direct insert as a last attempt
      try {
        const { data: insertData, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: email || null,
            full_name: fullName,
            is_premium: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id, email, full_name, is_premium')
          .maybeSingle();
        
        if (insertError) {
          console.error('[PROFILE-UTILS] Error inserting profile:', insertError);
          return null;
        }
        
        console.log('[PROFILE-UTILS] Profile inserted successfully:', insertData);
        return insertData as Profile;
      } catch (insertErr) {
        console.error('[PROFILE-UTILS] Exception inserting profile:', insertErr);
        return null;
      }
    }
    
    console.log('[PROFILE-UTILS] Profile created successfully:', data);
    return data as Profile;
  } catch (error) {
    console.error('[PROFILE-UTILS] Exception creating profile:', error);
    return null;
  }
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
