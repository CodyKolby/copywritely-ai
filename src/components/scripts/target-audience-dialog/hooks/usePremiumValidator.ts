
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
    
    // First check storage immediately
    const storagePremium = checkAllPremiumStorages();
    
    // Check database directly for subscription status and expiry
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
        
        if (isExpired || !profile.is_premium || profile.subscription_status === 'canceled') {
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
    
    // If database check fails, fallback to other premium indicators
    if (storagePremium) {
      return true;
    }
    
    // Otherwise use the verified status if available
    if (verifiedPremium !== null) {
      return verifiedPremium;
    }
    
    // Otherwise return the original premium status
    return isPremium;
  };

  return { validatePremiumStatus };
};
