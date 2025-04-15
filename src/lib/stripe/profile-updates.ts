
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Update profile with premium status
 */
export const updateProfilePremiumStatus = async (
  userId: string, 
  isPremium: boolean = true, 
  subscriptionId?: string,
  subscriptionStatus = 'active',
  subscriptionExpiry?: string
): Promise<boolean> => {
  try {
    console.log(`[PROFILE-UPDATE] Updating profile premium status for user: ${userId}`);
    console.log(`[PROFILE-UPDATE] isPremium: ${isPremium}, subscriptionId: ${subscriptionId}, status: ${subscriptionStatus}`);
    
    // First check if the profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id, is_premium, subscription_id, subscription_status, subscription_expiry')
      .eq('id', userId)
      .maybeSingle();
      
    if (checkError) {
      console.error('[PROFILE-UPDATE] Error checking if profile exists:', checkError);
    }
    
    // Log the current state of the profile
    if (existingProfile) {
      console.log('[PROFILE-UPDATE] Existing profile state:', existingProfile);
    } else {
      console.log('[PROFILE-UPDATE] Profile does not exist, will create it');
    }
    
    // If profile doesn't exist, create it first
    if (!existingProfile) {
      console.log('[PROFILE-UPDATE] Profile does not exist, creating it first');
      
      try {
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_premium: isPremium
          });
          
        if (createError) {
          console.error('[PROFILE-UPDATE] Error creating profile:', createError);
          // Continue anyway, as upsert might still work
        } else {
          console.log('[PROFILE-UPDATE] Profile created successfully');
        }
      } catch (createErr) {
        console.error('[PROFILE-UPDATE] Exception creating profile:', createErr);
        // Continue anyway
      }
    }
    
    // Set expiry to 30 days from now if not provided
    if (!subscriptionExpiry && isPremium) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      subscriptionExpiry = expiryDate.toISOString();
    }
    
    const updateData: Record<string, any> = { 
      is_premium: isPremium,
      subscription_status: isPremium ? subscriptionStatus : 'inactive',
      updated_at: new Date().toISOString()
    };
    
    if (subscriptionId) {
      updateData.subscription_id = subscriptionId;
    }
    
    if (subscriptionExpiry) {
      updateData.subscription_expiry = subscriptionExpiry;
    }
    
    console.log('[PROFILE-UPDATE] Updating profile with:', updateData);
    
    // Try upsert instead of update to handle cases where profile might not exist
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        ...updateData
      });
      
    if (error) {
      console.error('[PROFILE-UPDATE] Error updating profile:', error);
      return false;
    }
    
    // Verify that the update was successful by fetching the profile again
    const { data: verifiedProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('id, is_premium, subscription_id, subscription_status, subscription_expiry')
      .eq('id', userId)
      .maybeSingle();
      
    if (verifyError) {
      console.error('[PROFILE-UPDATE] Error verifying profile update:', verifyError);
    } else {
      console.log('[PROFILE-UPDATE] Verified profile after update:', verifiedProfile);
    }
    
    console.log('[PROFILE-UPDATE] Profile updated successfully');
    return true;
  } catch (error) {
    console.error('[PROFILE-UPDATE] Exception updating profile:', error);
    return false;
  }
};

/**
 * Get latest profile data
 */
export const getProfileData = async (userId: string) => {
  try {
    console.log('[PROFILE-UPDATE] Getting profile data for user:', userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('is_premium, subscription_id, subscription_status, subscription_expiry')
      .eq('id', userId)
      .maybeSingle();
      
    if (error) {
      console.error('[PROFILE-UPDATE] Error getting profile data:', error);
      return null;
    }
    
    console.log('[PROFILE-UPDATE] Profile data retrieved:', data);
    return data;
  } catch (error) {
    console.error('[PROFILE-UPDATE] Exception getting profile data:', error);
    return null;
  }
};

/**
 * Create profile if it doesn't exist
 */
export const createProfileIfNotExists = async (userId: string): Promise<boolean> => {
  try {
    console.log('[PROFILE-UPDATE] Checking if profile exists for user:', userId);
    
    // Check if profile exists
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (error) {
      console.error('[PROFILE-UPDATE] Error checking profile existence:', error);
      return false;
    }
    
    if (data) {
      console.log('[PROFILE-UPDATE] Profile already exists');
      return true;
    }
    
    // Create profile if it doesn't exist
    console.log('[PROFILE-UPDATE] Creating new profile for user:', userId);
    
    const { error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        is_premium: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (createError) {
      console.error('[PROFILE-UPDATE] Error creating profile:', createError);
      return false;
    }
    
    console.log('[PROFILE-UPDATE] Profile created successfully');
    return true;
  } catch (error) {
    console.error('[PROFILE-UPDATE] Exception checking/creating profile:', error);
    return false;
  }
};
