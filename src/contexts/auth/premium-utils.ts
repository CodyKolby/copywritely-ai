
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Checks premium status via Edge Function
 */
export const checkPremiumStatus = async (userId: string, showToast = false): Promise<boolean> => {
  try {
    console.log(`[PREMIUM-UTILS] Checking subscription status for user: ${userId}`);
    
    const { data, error } = await supabase.functions.invoke('check-subscription-status', {
      body: { userId }
    });
    
    if (error) {
      console.error('[PREMIUM-UTILS] Error checking subscription status:', error);
      
      // If edge function fails, try fallback
      return checkPremiumStatusFallback(userId, showToast);
    }
    
    console.log('[PREMIUM-UTILS] Subscription status response:', data);
    
    if (showToast) {
      if (data?.isPremium) {
        toast.success('Twoje konto ma status Premium!', {
          dismissible: true
        });
      } else {
        toast.info('Twoje konto nie ma statusu Premium.', {
          dismissible: true
        });
      }
    }
    
    return data?.isPremium || false;
  } catch (error) {
    console.error('[PREMIUM-UTILS] Exception checking premium status:', error);
    return checkPremiumStatusFallback(userId, showToast);
  }
};

/**
 * Fallback when edge function fails
 */
export const checkPremiumStatusFallback = async (userId: string, showToast = false): Promise<boolean> => {
  try {
    console.log(`[PREMIUM-UTILS] Using fallback premium check for user: ${userId}`);
    
    // Check profile directly
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium, subscription_status, subscription_expiry')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('[PREMIUM-UTILS] Error in fallback profile check:', profileError);
      return false;
    }
    
    const isPremium = profile?.is_premium || false;
    
    console.log('[PREMIUM-UTILS] Fallback premium status:', isPremium);
    
    if (showToast) {
      if (isPremium) {
        toast.success('Twoje konto ma status Premium!', {
          dismissible: true
        });
      } else {
        toast.info('Twoje konto nie ma statusu Premium.', {
          dismissible: true
        });
      }
    }
    
    return isPremium;
  } catch (error) {
    console.error('[PREMIUM-UTILS] Exception in fallback premium check:', error);
    return false;
  }
};
