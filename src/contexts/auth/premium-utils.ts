
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { updateAllPremiumStorages, checkAllPremiumStorages } from './local-storage-utils';

/**
 * Checks premium status via Edge Function
 */
export const checkPremiumStatus = async (userId: string, showToast = false): Promise<boolean> => {
  try {
    console.log(`[PREMIUM-UTILS] Checking subscription status for user: ${userId}`);
    
    // First check if we have premium status in storage
    if (checkAllPremiumStorages()) {
      console.log('[PREMIUM-UTILS] Found premium status in storage, verifying with database');
      
      // Verify with database in background but return true immediately
      // to avoid blocking the UI while waiting for the request
      verifyWithDatabaseAndUpdate(userId);
      
      if (showToast) {
        toast.success('Twoje konto ma status Premium!', {
          dismissible: true
        });
      }
      
      return true;
    }
    
    // If not in storage, check with edge function
    const { data, error } = await supabase.functions.invoke('check-subscription-status', {
      body: { userId }
    });
    
    if (error) {
      console.error('[PREMIUM-UTILS] Error checking subscription status:', error);
      
      // If edge function fails, try fallback
      return checkPremiumStatusFallback(userId, showToast);
    }
    
    console.log('[PREMIUM-UTILS] Subscription status response:', data);
    
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
    console.error('[PREMIUM-UTILS] Exception checking premium status:', error);
    return checkPremiumStatusFallback(userId, showToast);
  }
};

/**
 * Verify premium status with database and update storage if needed
 * This is a background operation that doesn't block the UI
 */
const verifyWithDatabaseAndUpdate = async (userId: string) => {
  try {
    // Check profile directly
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium, subscription_status, subscription_expiry')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('[PREMIUM-UTILS] Error in database verification:', profileError);
      return;
    }
    
    if (profile?.is_premium) {
      // If database confirms premium, update storage again to refresh timestamp
      updateAllPremiumStorages(true);
    } else {
      // If database says not premium but storage says premium, check with edge function
      // This handles the case where subscription expired but storage hasn't updated
      const { data } = await supabase.functions.invoke('check-subscription-status', {
        body: { userId }
      });
      
      if (data?.isPremium) {
        // Edge function says premium, so update database and storage
        await supabase
          .from('profiles')
          .update({ 
            is_premium: true,
            subscription_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        updateAllPremiumStorages(true);
      } else {
        // Neither database nor edge function says premium, so clear storage
        updateAllPremiumStorages(false);
      }
    }
  } catch (error) {
    console.error('[PREMIUM-UTILS] Error in database verification:', error);
  }
};

/**
 * Fallback when edge function fails
 */
export const checkPremiumStatusFallback = async (userId: string, showToast = false): Promise<boolean> => {
  try {
    console.log(`[PREMIUM-UTILS] Using fallback premium check for user: ${userId}`);
    
    // Check storage first
    if (checkAllPremiumStorages()) {
      console.log('[PREMIUM-UTILS] Found premium status in storage');
      
      if (showToast) {
        toast.success('Twoje konto ma status Premium!', {
          dismissible: true
        });
      }
      
      return true;
    }
    
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
    
    if (isPremium) {
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
    
    return isPremium;
  } catch (error) {
    console.error('[PREMIUM-UTILS] Exception in fallback premium check:', error);
    return false;
  }
};

/**
 * Force premium status check and update all contexts
 */
export const forcePremiumStatusUpdate = async (userId: string): Promise<boolean> => {
  try {
    console.log(`[PREMIUM-UTILS] Force updating premium status for user: ${userId}`);
    
    // Try to update all storage locations immediately
    updateAllPremiumStorages(true);
    
    // Also update database
    await supabase
      .from('profiles')
      .update({ 
        is_premium: true,
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    return true;
  } catch (error) {
    console.error('[PREMIUM-UTILS] Exception in force premium update:', error);
    return false;
  }
};
