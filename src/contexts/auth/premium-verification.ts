
import { supabase } from '@/integrations/supabase/client';
import { updateAllPremiumStorages } from './local-storage-utils';

/**
 * Check premium status of a user using the check-subscription-status edge function
 */
export const checkPremiumStatus = async (userId: string, showToast = false): Promise<boolean> => {
  try {
    console.log(`[PREMIUM] Checking premium status for user ${userId}`);
    
    // Call the edge function
    const { data, error } = await supabase.functions.invoke('check-subscription-status', {
      body: { userId }
    });
    
    if (error) {
      console.error('[PREMIUM] Error checking premium status:', error);
      return false;
    }
    
    console.log(`[PREMIUM] Status response: ${JSON.stringify(data)}`);
    
    if (data?.isPremium) {
      // Update storage to avoid unnecessary API calls
      updateAllPremiumStorages(true);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[PREMIUM] Exception checking premium status:', error);
    return await checkPremiumStatusFallback(userId, showToast);
  }
};

/**
 * Handle premium status fallback if the edge function fails
 */
export const checkPremiumStatusFallback = async (userId: string, showToast = false): Promise<boolean> => {
  try {
    // Direct database check
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium, subscription_status, subscription_expiry')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('[PREMIUM] Error checking profile in fallback:', profileError);
      return false;
    }
    
    if (profile?.is_premium) {
      console.log('[PREMIUM] User has premium status from database fallback');
      
      // Check if subscription has expired
      if (profile.subscription_expiry) {
        const expiryDate = new Date(profile.subscription_expiry);
        const now = new Date();
        
        if (expiryDate < now) {
          console.log('[PREMIUM] Subscription has expired');
          return false;
        }
      }
      
      // Update storage
      updateAllPremiumStorages(true);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[PREMIUM] Exception in premium status fallback:', error);
    return false;
  }
};
