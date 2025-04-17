
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { updateLocalStoragePremium } from './localStorage-utils';

/**
 * Verify a Stripe key by checking the Stripe API connection
 */
export const verifyStripeKey = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-stripe-key');
    
    if (error) {
      console.error('Error verifying Stripe key:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Exception verifying Stripe key:', error);
    throw error;
  }
};

/**
 * Check premium status for a user
 */
export const checkPremiumStatus = async (userId: string, showToast = false): Promise<boolean> => {
  try {
    console.log(`Checking premium status for user: ${userId}`);
    
    const { data, error } = await supabase.functions.invoke('check-subscription-status', {
      body: { userId }
    });
    
    if (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
    
    console.log('Premium status response:', data);
    
    if (data?.isPremium === true) {
      // Update localStorage
      updateLocalStoragePremium(true);
      
      if (showToast) {
        toast.success('Twoje konto ma status Premium!');
      }
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Exception checking premium status:', error);
    return false;
  }
};

/**
 * Force update premium status for a user
 */
export const forceUpdatePremiumStatus = async (userId: string, sessionId?: string): Promise<boolean> => {
  try {
    console.log(`Force updating premium status for user: ${userId}`);
    
    // Try verifying payment session if we have a sessionId
    if (sessionId) {
      try {
        const { data, error } = await supabase.functions.invoke('verify-payment-session', {
          body: {
            userId,
            sessionId
          }
        });
        
        if (!error && data?.success) {
          console.log('Payment session verified successfully:', data);
          updateLocalStoragePremium(true);
          return true;
        }
      } catch (e) {
        console.error('Error verifying payment session:', e);
      }
    }
    
    // Fall back to direct subscription check
    return await checkPremiumStatus(userId, false);
  } catch (error) {
    console.error('Exception in force update premium status:', error);
    return false;
  }
};
