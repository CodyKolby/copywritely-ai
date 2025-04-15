
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { updateAllPremiumStorages, clearPremiumFromLocalStorage } from '../local-storage-utils';
import { checkPremiumStatus, checkPremiumStatusFallback } from '../premium-verification';

export const usePremiumVerification = () => {
  const [isPremium, setIsPremium] = useState(false);
  const verificationInProgress = useRef(false);

  const handleUserAuthenticated = useCallback(async (userId: string) => {
    if (verificationInProgress.current) {
      console.log('[PREMIUM] Verification already in progress, skipping duplicate call');
      return;
    }
    
    verificationInProgress.current = true;
    
    try {
      console.log(`[PREMIUM] Checking premium status for authenticated user: ${userId}`);
      
      try {
        const serverPremiumStatus = await checkPremiumStatus(userId);
        
        if (serverPremiumStatus) {
          setIsPremium(true);
          updateAllPremiumStorages(true);
          return;
        }
      } catch (error) {
        console.error('[PREMIUM] Error checking premium status with edge function:', error);
      }
      
      // Fallback to direct DB check
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_premium, subscription_id, subscription_status, subscription_expiry')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('[PREMIUM] Error getting profile:', profileError);
      } else if (profile?.is_premium) {
        console.log('[PREMIUM] User has premium status from DB check');
        setIsPremium(true);
        updateAllPremiumStorages(true);
      } else {
        console.log('[PREMIUM] User does not have premium status');
        setIsPremium(false);
        clearPremiumFromLocalStorage();
      }
    } catch (error) {
      console.error('[PREMIUM] Error in handleUserAuthenticated:', error);
      
      try {
        const fallbackResult = await checkPremiumStatusFallback(userId, false);
        setIsPremium(fallbackResult);
        
        if (fallbackResult) {
          updateAllPremiumStorages(true);
        }
      } catch (fallbackError) {
        console.error('[PREMIUM] Error in fallback premium check:', fallbackError);
        clearPremiumFromLocalStorage();
      }
    } finally {
      verificationInProgress.current = false;
    }
  }, []);

  const checkUserPremiumStatus = useCallback(async (userId: string, showToast = false) => {
    if (verificationInProgress.current) {
      console.log('[PREMIUM] Verification already in progress, skipping duplicate call');
      return isPremium;
    }
    
    verificationInProgress.current = true;
    
    try {
      console.log('[PREMIUM] Checking premium status for user:', userId);
      
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
    } finally {
      verificationInProgress.current = false;
    }
  }, [isPremium]);

  return {
    isPremium,
    setIsPremium,
    handleUserAuthenticated,
    checkUserPremiumStatus
  };
};
