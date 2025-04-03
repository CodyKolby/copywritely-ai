
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
      
      // Attempt to create profile if none exists
      return createProfile(userId);
    }
    
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
    
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        is_premium: false,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) {
      console.error('[PROFILE-UTILS] Error creating profile:', error);
      return null;
    }
    
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
