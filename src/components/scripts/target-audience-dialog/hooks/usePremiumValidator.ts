
import { checkAllPremiumStorages } from '@/contexts/auth/local-storage-utils';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to validate user's premium status
 */
export const usePremiumValidator = (
  userId: string | undefined, 
  isPremium: boolean,
  verifiedPremium: boolean | null
) => {
  // Function to validate premium status
  const validatePremiumStatus = async () => {
    if (!userId) return false;
    
    // Check database directly for subscription status - this is the source of truth
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_premium, subscription_status, subscription_expiry')
        .eq('id', userId)
        .single();
        
      if (!error && profile) {
        // Check if subscription has expired
        const isExpired = profile.subscription_expiry ? 
          new Date(profile.subscription_expiry) < new Date() : false;
        
        // If is_premium is false, subscription is canceled or expired, user is not premium
        if (!profile.is_premium || profile.subscription_status === 'canceled' || isExpired) {
          console.log('[PREMIUM-VALIDATOR] User does not have valid premium status');
          return false;
        }
        
        if (profile.is_premium) {
          console.log('[PREMIUM-VALIDATOR] Premium confirmed from database');
          return true;
        }
      }
    } catch (e) {
      console.error('[PREMIUM-VALIDATOR] Error checking premium from database:', e);
    }
    
    // If database check fails, fallback to context state
    return isPremium;
  };

  return { validatePremiumStatus };
};
