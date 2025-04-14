
import { supabase } from '@/integrations/supabase/client';
import { Profile } from './types';

/**
 * Fetches user profile from database
 */
export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  try {
    console.log(`[PROFILE-UTILS] Fetching profile for user: ${userId}`);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('[PROFILE-UTILS] Error fetching profile:', error);
      
      // Get user data from current session to use in profile creation
      const { data: sessionData } = await supabase.auth.getSession();
      const userData = sessionData?.session?.user;
      
      if (userData) {
        console.log('[PROFILE-UTILS] User data from session for profile creation:', userData);
      } else {
        console.error('[PROFILE-UTILS] No user data available in current session');
      }
      
      // Attempt to create profile if none exists
      return createProfile(userId);
    }
    
    console.log('[PROFILE-UTILS] Profile fetched successfully:', data);
    return data as Profile;
  } catch (error) {
    console.error('[PROFILE-UTILS] Exception fetching profile:', error);
    return null;
  }
};

/**
 * Creates a new profile for a user
 */
export const createProfile = async (userId: string): Promise<Profile | null> => {
  try {
    console.log(`[PROFILE-UTILS] Creating profile for user: ${userId}`);
    
    // Get current session for user data
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      console.error('[PROFILE-UTILS] No user session available for profile creation');
      return null;
    }
    
    console.log('[PROFILE-UTILS] User data retrieved for profile creation:', user);
    
    // Try to access auth user metadata
    try {
      // This block is removed as we can't access the auth.users table directly
      // and it was causing the TypeScript error
      console.log('[PROFILE-UTILS] Using session data for profile creation');
    } catch (e) {
      console.log('[PROFILE-UTILS] Expected error accessing auth data:', e);
    }
    
    // Prepare profile data with best available information
    const email = user?.email;
    const userMetadata = user?.user_metadata;
    
    console.log('[PROFILE-UTILS] Current user session data:', {
      email,
      metadata: userMetadata
    });
    
    // Create profile with manual data from session if available
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email || null,
        full_name: userMetadata?.full_name || userMetadata?.name || null,
        avatar_url: userMetadata?.avatar_url || null,
        is_premium: false,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) {
      console.error('[PROFILE-UTILS] Error creating profile:', error);
      return null;
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
