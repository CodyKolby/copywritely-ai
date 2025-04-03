
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
    
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);
      
    if (error) {
      console.error('[PROFILE-UPDATE] Error updating profile:', error);
      return false;
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
    const { data, error } = await supabase
      .from('profiles')
      .select('is_premium, subscription_id, subscription_status, subscription_expiry')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('[PROFILE-UPDATE] Error getting profile data:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('[PROFILE-UPDATE] Exception getting profile data:', error);
    return null;
  }
};
