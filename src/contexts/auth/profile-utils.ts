
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
    
    // Get current session for user data - use explicit headers to prevent 406 errors
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      console.error('[PROFILE-UTILS] No user session available for profile creation');
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
      .select('id, email, full_name, avatar_url, is_premium') // Explicitly select only needed fields
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
