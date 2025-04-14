
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
      
      // Get user data from auth to use in profile creation
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError) {
        console.error('[PROFILE-UTILS] Error fetching user data:', userError);
      } else {
        console.log('[PROFILE-UTILS] User data for profile creation:', userData);
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
    
    // Get user data from auth
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError) {
      console.error('[PROFILE-UTILS] Error fetching user data for profile creation:', userError);
    } else {
      console.log('[PROFILE-UTILS] User data retrieved for profile creation:', userData?.user);
    }
    
    // Get user from public auth.users view if available (might not be accessible)
    try {
      const { data: authUser, error: authUserError } = await supabase
        .from('users')
        .select('email, raw_user_meta_data')
        .eq('id', userId)
        .single();
        
      if (!authUserError && authUser) {
        console.log('[PROFILE-UTILS] Auth user data:', authUser);
      }
    } catch (e) {
      console.log('[PROFILE-UTILS] Cannot access auth users view, expected:', e);
    }
    
    // Get current session for additional user data
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
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
