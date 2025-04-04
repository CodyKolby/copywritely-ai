
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { updateAllPremiumStorages } from './local-storage-utils';

/**
 * Checks premium status via Edge Function
 */
export const checkPremiumStatus = async (userId: string, showToast = false): Promise<boolean> => {
  try {
    console.log(`[PREMIUM-VERIFY] Checking subscription status for user: ${userId}`);
    
    // Check profile directly for faster response
    const profileResult = await checkProfilePremiumStatus(userId);
    if (profileResult) {
      console.log('[PREMIUM-VERIFY] User has premium status according to profile');
      
      // Update storage and return immediately
      updateAllPremiumStorages(true);
      
      if (showToast) {
        toast.success('Twoje konto ma status Premium!', {
          dismissible: true
        });
      }
      
      return true;
    }
    
    // If profile check didn't confirm premium, try the edge function
    const { data, error } = await supabase.functions.invoke('check-subscription-status', {
      body: { userId }
    });
    
    if (error) {
      console.error('[PREMIUM-VERIFY] Error checking subscription status:', error);
      
      // If edge function fails, try fallback
      return checkPremiumStatusFallback(userId, showToast);
    }
    
    console.log('[PREMIUM-VERIFY] Subscription status response:', data);
    
    if (data?.isPremium) {
      // Update all storage locations
      updateAllPremiumStorages(true);
      
      if (showToast) {
        toast.success('Twoje konto ma status Premium!', {
          dismissible: true
        });
      }
    } else if (showToast) {
      toast.info('Twoje konto nie ma statusu Premium.', {
        dismissible: true
      });
    }
    
    return data?.isPremium || false;
  } catch (error) {
    console.error('[PREMIUM-VERIFY] Exception checking premium status:', error);
    return checkPremiumStatusFallback(userId, showToast);
  }
};

/**
 * Check profile directly for premium status
 */
export const checkProfilePremiumStatus = async (userId: string): Promise<boolean> => {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium, subscription_status, subscription_expiry')
      .eq('id', userId)
      .single();
        
    if (!profileError && profile?.is_premium) {
      return true;
    }
    
    return false;
  } catch (profileError) {
    console.error('[PREMIUM-VERIFY] Error checking profile directly:', profileError);
    return false;
  }
};

/**
 * Fallback when edge function fails
 */
export const checkPremiumStatusFallback = async (userId: string, showToast = false): Promise<boolean> => {
  try {
    console.log(`[PREMIUM-VERIFY] Using fallback premium check for user: ${userId}`);
    
    // Check profile directly
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium, subscription_status, subscription_expiry')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('[PREMIUM-VERIFY] Error in fallback profile check:', profileError);
      
      // Check payment logs as last resort
      return checkPaymentLogsForPremium(userId, showToast);
    }
    
    const isPremium = profile?.is_premium || false;
    
    console.log('[PREMIUM-VERIFY] Fallback premium status from profile:', isPremium);
    
    if (isPremium) {
      // Update all storage locations
      updateAllPremiumStorages(true);
      
      if (showToast) {
        toast.success('Twoje konto ma status Premium!', {
          dismissible: true
        });
      }
    } else {
      // Check payment logs as last resort
      return checkPaymentLogsForPremium(userId, showToast);
    }
    
    return isPremium;
  } catch (error) {
    console.error('[PREMIUM-VERIFY] Exception in fallback premium check:', error);
    return false;
  }
};
