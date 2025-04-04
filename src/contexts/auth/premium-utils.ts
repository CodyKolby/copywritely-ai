
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { updateAllPremiumStorages, checkAllPremiumStorages } from './local-storage-utils';

/**
 * Checks premium status via Edge Function
 */
export const checkPremiumStatus = async (userId: string, showToast = false): Promise<boolean> => {
  try {
    console.log(`[PREMIUM-UTILS] Checking subscription status for user: ${userId}`);
    
    // First check profile directly for faster response
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_premium, subscription_status, subscription_expiry')
        .eq('id', userId)
        .single();
        
      if (!profileError && profile?.is_premium) {
        console.log('[PREMIUM-UTILS] User has premium status according to profile');
        
        // Update storage and return immediately
        updateAllPremiumStorages(true);
        
        if (showToast) {
          toast.success('Twoje konto ma status Premium!', {
            dismissible: true
          });
        }
        
        return true;
      }
    } catch (profileError) {
      console.error('[PREMIUM-UTILS] Error checking profile directly:', profileError);
    }
    
    // If profile check didn't confirm premium, try the edge function
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
 * Fallback when edge function fails
 */
export const checkPremiumStatusFallback = async (userId: string, showToast = false): Promise<boolean> => {
  try {
    console.log(`[PREMIUM-UTILS] Using fallback premium check for user: ${userId}`);
    
    // Check storage first in case we already have a valid premium status
    if (checkAllPremiumStorages()) {
      console.log('[PREMIUM-UTILS] Found premium status in storage');
      
      // Verify with database in background
      verifyWithDatabaseInBackground(userId);
      
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
      
      // Check payment logs as last resort
      return checkPaymentLogsForPremium(userId, showToast);
    }
    
    const isPremium = profile?.is_premium || false;
    
    console.log('[PREMIUM-UTILS] Fallback premium status from profile:', isPremium);
    
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
    console.error('[PREMIUM-UTILS] Exception in fallback premium check:', error);
    return false;
  }
};

/**
 * Check payment logs as a last resort
 */
const checkPaymentLogsForPremium = async (userId: string, showToast = false): Promise<boolean> => {
  try {
    console.log(`[PREMIUM-UTILS] Checking payment logs for user: ${userId}`);
    
    const { data: paymentLogs, error } = await supabase
      .from('payment_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(1);
      
    if (error) {
      console.error('[PREMIUM-UTILS] Error checking payment logs:', error);
      return false;
    }
    
    const hasPremium = paymentLogs && paymentLogs.length > 0;
    
    if (hasPremium) {
      console.log('[PREMIUM-UTILS] Payment logs indicate premium status');
      
      // Update profile in background
      updateProfileFromPaymentLogs(userId);
      
      // Update storage
      updateAllPremiumStorages(true);
      
      if (showToast) {
        toast.success('Znaleziono płatność! Twoje konto ma status Premium!', {
          dismissible: true
        });
      }
    }
    
    return hasPremium;
  } catch (error) {
    console.error('[PREMIUM-UTILS] Error checking payment logs:', error);
    return false;
  }
};

/**
 * Verify premium status with database and update storage if needed (background operation)
 */
const verifyWithDatabaseInBackground = async (userId: string) => {
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
        // Final check - payment logs
        const { data: paymentLogs } = await supabase
          .from('payment_logs')
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false })
          .limit(1);
          
        if (paymentLogs && paymentLogs.length > 0) {
          // Found payment logs, update profile
          updateProfileFromPaymentLogs(userId);
          updateAllPremiumStorages(true);
        } else {
          // Neither database nor edge function says premium, so clear storage
          updateAllPremiumStorages(false);
        }
      }
    }
  } catch (error) {
    console.error('[PREMIUM-UTILS] Error in database verification:', error);
  }
};

/**
 * Update profile based on payment logs
 */
const updateProfileFromPaymentLogs = async (userId: string) => {
  try {
    console.log(`[PREMIUM-UTILS] Updating profile from payment logs for user: ${userId}`);
    
    await supabase
      .from('profiles')
      .update({ 
        is_premium: true,
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    console.log('[PREMIUM-UTILS] Profile updated from payment logs');
  } catch (error) {
    console.error('[PREMIUM-UTILS] Error updating profile from payment logs:', error);
  }
};

/**
 * Force premium status check and update all contexts
 */
export const forcePremiumStatusUpdate = async (userId: string): Promise<boolean> => {
  try {
    console.log(`[PREMIUM-UTILS] Force updating premium status for user: ${userId}`);
    
    // Try to update profile first
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        is_premium: true,
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (updateError) {
      console.error('[PREMIUM-UTILS] Error updating profile:', updateError);
      
      // Even if profile update fails, update storage
      updateAllPremiumStorages(true);
      return true;
    }
    
    // Update local storage regardless
    updateAllPremiumStorages(true);
    
    return true;
  } catch (error) {
    console.error('[PREMIUM-UTILS] Exception in force premium update:', error);
    // Even if there's an error, try to update storage
    updateAllPremiumStorages(true);
    return true;
  }
};
