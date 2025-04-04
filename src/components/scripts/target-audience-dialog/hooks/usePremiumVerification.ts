
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { checkPremiumStatus } from '@/contexts/auth/premium-utils';

export const usePremiumVerification = (userId: string | undefined, isPremium: boolean) => {
  const [verifiedPremium, setVerifiedPremium] = useState<boolean | null>(null);

  // Verify premium status when dialog opens
  useEffect(() => {
    if (userId) {
      // Verify premium status again to be sure
      const verifyPremium = async () => {
        try {
          // First check database directly for fastest response
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('is_premium')
            .eq('id', userId)
            .single();
            
          if (!error && profile?.is_premium) {
            console.log('[TARGET-AUDIENCE] Premium confirmed from database');
            setVerifiedPremium(true);
            return;
          }
          
          // If not confirmed from database, use the full check
          const result = await checkPremiumStatus(userId, false);
          setVerifiedPremium(result);
        } catch (e) {
          console.error('[TARGET-AUDIENCE] Error verifying premium:', e);
          // Fallback to prop
          setVerifiedPremium(isPremium);
        }
      };
      
      verifyPremium();
    }
  }, [userId, isPremium]);

  return { verifiedPremium };
};
