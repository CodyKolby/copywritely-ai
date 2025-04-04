import { supabase } from '@/integrations/supabase/client';
import { updateAllPremiumStorages } from './local-storage-utils';
import { toast } from 'sonner';

/**
 * Check payment logs as a last resort
 */
export const checkPaymentLogsForPremium = async (userId: string, showToast = false): Promise<boolean> => {
  try {
    console.log(`[PREMIUM-DB] Checking payment logs for user: ${userId}`);
    
    const { data: paymentLogs, error } = await supabase
      .from('payment_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(1);
      
    if (error) {
      console.error('[PREMIUM-DB] Error checking payment logs:', error);
      return false;
    }
    
    const hasPremium = paymentLogs && paymentLogs.length > 0;
    
    if (hasPremium) {
      console.log('[PREMIUM-DB] Payment logs indicate premium status');
      
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
    console.error('[PREMIUM-DB] Error checking payment logs:', error);
    return false;
  }
};

/**
 * Verify premium status with database and update storage if needed (background operation)
 */
export const verifyWithDatabaseInBackground = async (userId: string) => {
  try {
    // Check profile directly
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium, subscription_status, subscription_expiry')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('[PREMIUM-DB] Error in database verification:', profileError);
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
        await updateProfilePremiumStatus(userId, true);
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
    console.error('[PREMIUM-DB] Error in database verification:', error);
  }
};

/**
 * Update profile based on payment logs
 */
export const updateProfileFromPaymentLogs = async (userId: string) => {
  try {
    console.log(`[PREMIUM-DB] Updating profile from payment logs for user: ${userId}`);
    
    await updateProfilePremiumStatus(userId, true);
    console.log('[PREMIUM-DB] Profile updated from payment logs');
  } catch (error) {
    console.error('[PREMIUM-DB] Error updating profile from payment logs:', error);
  }
};

/**
 * Update premium status in the profiles table
 * This is renamed from updatePremiumStatus to updateProfilePremiumStatus to avoid conflict
 */
export const updateProfilePremiumStatus = async (userId: string, isPremium: boolean) => {
  try {
    await supabase
      .from('profiles')
      .update({ 
        is_premium: isPremium,
        subscription_status: isPremium ? 'active' : 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    return true;
  } catch (error) {
    console.error('[PREMIUM-DB] Error updating premium status:', error);
    return false;
  }
};

/**
 * Force premium status check and update all contexts
 */
export const forcePremiumStatusUpdate = async (userId: string): Promise<boolean> => {
  try {
    console.log(`[PREMIUM-DB] Force updating premium status for user: ${userId}`);
    
    // Try to update profile first
    const success = await updateProfilePremiumStatus(userId, true);
    
    if (!success) {
      console.error('[PREMIUM-DB] Error updating profile');
      
      // Even if profile update fails, update storage
      updateAllPremiumStorages(true);
      return true;
    }
    
    // Update local storage regardless
    updateAllPremiumStorages(true);
    
    return true;
  } catch (error) {
    console.error('[PREMIUM-DB] Exception in force premium update:', error);
    // Even if there's an error, try to update storage
    updateAllPremiumStorages(true);
    return true;
  }
};
