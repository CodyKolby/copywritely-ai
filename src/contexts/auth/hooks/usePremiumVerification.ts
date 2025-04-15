
import { User } from '@supabase/supabase-js';
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Profile } from '../types';
import { checkPremiumStatus, checkPremiumStatusFallback } from '../premium-verification';
import { updateProfilePremiumStatus } from '../premium-database';
import { updateAllPremiumStorages, clearPremiumFromLocalStorage } from '../local-storage-utils';

export const usePremiumVerification = () => {
  const [isPremium, setIsPremium] = useState(false);

  const handleUserAuthenticated = useCallback(async (userId: string) => {
    try {
      const serverPremiumStatus = await checkPremiumStatus(userId);
      
      if (serverPremiumStatus) {
        setIsPremium(true);
        updateAllPremiumStorages(true);
        return;
      }
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_premium, subscription_id, subscription_status, subscription_expiry')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('[PREMIUM] Error getting profile:', profileError);
      } else if (profile?.is_premium) {
        setIsPremium(true);
        updateAllPremiumStorages(true);
      } else {
        setIsPremium(false);
        clearPremiumFromLocalStorage();
      }
    } catch (error) {
      console.error('[PREMIUM] Error in handleUserAuthenticated:', error);
      
      const fallbackResult = await checkPremiumStatusFallback(userId, false);
      setIsPremium(fallbackResult);
      
      if (fallbackResult) {
        updateAllPremiumStorages(true);
      }
    }
  }, []);

  const checkUserPremiumStatus = useCallback(async (userId: string, showToast = false) => {
    try {
      const serverPremiumStatus = await checkPremiumStatus(userId, showToast);
      setIsPremium(serverPremiumStatus);
      return serverPremiumStatus;
    } catch (error) {
      console.error('[PREMIUM] Error checking premium status:', error);
      const fallbackResult = await checkPremiumStatusFallback(userId, showToast);
      setIsPremium(fallbackResult);
      return fallbackResult;
    }
  }, []);

  return {
    isPremium,
    setIsPremium,
    handleUserAuthenticated,
    checkUserPremiumStatus
  };
};
