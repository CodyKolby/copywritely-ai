
import { supabase } from '@/integrations/supabase/client';
import { updateAllPremiumStorages } from './local-storage-utils';
import { toast } from 'sonner';

/**
 * Check premium status of a user using the check-subscription-status edge function
 */
export const checkPremiumStatus = async (userId: string, showToast = false): Promise<boolean> => {
  try {
    console.log(`[PREMIUM] Checking premium status for user ${userId}`);
    
    // Try to call the edge function
    const { data, error } = await supabase.functions.invoke('check-subscription-status', {
      body: { userId }
    });
    
    if (error) {
      console.error('[PREMIUM] Error checking premium status:', error);
      return await checkPremiumStatusFallback(userId, showToast);
    }
    
    console.log(`[PREMIUM] Status response: ${JSON.stringify(data)}`);
    
    if (data?.isPremium) {
      // Update storage to avoid unnecessary API calls
      updateAllPremiumStorages(true);
      
      if (showToast) {
        toast.success('Twoje konto ma status Premium!', {
          id: 'premium-status',
          dismissible: true
        });
      }
      
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
          // Auto-update profile to reflect expiration
          try {
            await supabase
              .from('profiles')
              .update({
                is_premium: false,
                subscription_status: 'expired',
                updated_at: new Date().toISOString()
              })
              .eq('id', userId);
            
            return false;
          } catch (err) {
            console.error('[PREMIUM] Error updating expired status:', err);
            // Even though it's expired, we'll still return true if we can't update
            // This is better than potentially denying premium access incorrectly
            return true;
          }
        }
      }
      
      // Update storage
      updateAllPremiumStorages(true);
      
      if (showToast) {
        toast.success('Znaleziono status Premium w Twoim profilu!', {
          id: 'premium-status-fallback',
          dismissible: true
        });
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[PREMIUM] Exception in premium status fallback:', error);
    return false;
  }
};

/**
 * Force update premium status (used after payment verification)
 */
export const forcePremiumStatusUpdate = async (userId: string, sessionId?: string): Promise<boolean> => {
  try {
    console.log(`[PREMIUM] Force updating premium status for user: ${userId}`);
    
    if (sessionId) {
      // Try verify-payment-session first
      try {
        const { data, error } = await supabase.functions.invoke('verify-payment-session', {
          body: {
            userId,
            sessionId
          }
        });
        
        if (error) {
          console.error('[PREMIUM] Error in verify-payment-session:', error);
        } else {
          console.log('[PREMIUM] verify-payment-session result:', data);
          
          if (data?.success) {
            updateAllPremiumStorages(true);
            return true;
          }
        }
      } catch (verifyError) {
        console.error('[PREMIUM] Exception in verify-payment-session:', verifyError);
      }
    }
    
    // Direct profile update as fallback
    try {
      console.log('[PREMIUM] Performing direct profile update');
      
      // Set expiry to 30 days from now
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .update({
          is_premium: true,
          subscription_status: 'active',
          subscription_expiry: expiryDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();
      
      if (error) {
        console.error('[PREMIUM] Error updating profile:', error);
        return false;
      }
      
      console.log('[PREMIUM] Profile updated successfully:', profile);
      updateAllPremiumStorages(true);
      return true;
    } catch (error) {
      console.error('[PREMIUM] Error in direct profile update:', error);
      return false;
    }
  } catch (error) {
    console.error('[PREMIUM] Exception in forcePremiumStatusUpdate:', error);
    return false;
  }
};
