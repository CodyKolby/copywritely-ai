
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { checkAllPremiumStorages, updateAllPremiumStorages, clearPremiumFromLocalStorage } from '@/contexts/auth/local-storage-utils';
import { checkPremiumStatus, forcePremiumStatusUpdate } from '@/contexts/auth/premium-utils';
import { supabase } from '@/integrations/supabase/client';

export const usePremiumVerification = () => {
  const { isPremium, user } = useAuth();
  const [localPremiumStatus, setLocalPremiumStatus] = useState<boolean | null>(null);
  const [isCheckingPremium, setIsCheckingPremium] = useState(false);
  const premiumCheckedRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  // Set up mounted ref
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Check storage for premium status
  useEffect(() => {
    const storagePremium = checkAllPremiumStorages();
    if (storagePremium) {
      console.log('[PREMIUM-VERIFICATION] Premium status found in storage');
      setLocalPremiumStatus(true);
    }
  }, []);

  // Verify premium status when user changes
  useEffect(() => {
    if (user?.id && !premiumCheckedRef.current) {
      verifyPremiumStatus();
    }
  }, [user]);

  // Sync localPremiumStatus with isPremium when it changes
  useEffect(() => {
    if (isPremium) {
      console.log('[PREMIUM-VERIFICATION] Setting local premium from context');
      setLocalPremiumStatus(true);
      updateAllPremiumStorages(true);
    }
  }, [isPremium]);

  const verifyPremiumStatus = async () => {
    if (!user?.id) return false;
    
    setIsCheckingPremium(true);
    premiumCheckedRef.current = true;
    
    try {
      // First check profiles table directly
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_premium, subscription_status, subscription_expiry')
        .eq('id', user.id)
        .single();
        
      if (!error && profile) {
        // Check if subscription has expired
        const isExpired = profile.subscription_expiry ? 
          new Date(profile.subscription_expiry) < new Date() : false;
          
        if (isExpired && profile.is_premium) {
          console.log('[PREMIUM-VERIFICATION] Subscription has expired based on date');
          
          // Update local storage and state
          setLocalPremiumStatus(false);
          clearPremiumFromLocalStorage();
          
          // Also update database if needed
          await supabase
            .from('profiles')
            .update({
              is_premium: false,
              subscription_status: 'expired',
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
            
          setIsCheckingPremium(false);
          return false;
        }
        
        if (profile.is_premium) {
          console.log('[PREMIUM-VERIFICATION] Found premium status in database');
          if (isMountedRef.current) {
            setLocalPremiumStatus(true);
            updateAllPremiumStorages(true);
          }
          setIsCheckingPremium(false);
          return true;
        }
      }
      
      // If database check didn't confirm premium, use the check function
      const status = await checkPremiumStatus(user.id, false);
      console.log('[PREMIUM-VERIFICATION] Premium status after check:', status);
      
      if (isMountedRef.current) {
        setLocalPremiumStatus(status);
        if (status) {
          updateAllPremiumStorages(true);
        } else {
          clearPremiumFromLocalStorage();
        }
      }
      
      setIsCheckingPremium(false);
      return status;
    } catch (e) {
      console.error('[PREMIUM-VERIFICATION] Error checking premium status:', e);
      if (isMountedRef.current) {
        setIsCheckingPremium(false);
      }
      return false;
    }
  };

  const validatePremiumStatus = async () => {
    if (!user?.id) return false;
    
    // First check storage immediately
    const storagePremium = checkAllPremiumStorages();
    
    // Then check with database directly for fastest response
    setIsCheckingPremium(true);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_premium, subscription_expiry, subscription_status')
        .eq('id', user.id)
        .single();
        
      if (!error && profile) {
        // Check if subscription has expired
        const isExpired = profile.subscription_expiry ? 
          new Date(profile.subscription_expiry) < new Date() : false;
          
        if (isExpired && profile.is_premium) {
          console.log('[PREMIUM-VERIFICATION] Subscription has expired based on date');
          
          // Update local storage and state
          updateAllPremiumStorages(false);
          clearPremiumFromLocalStorage();
          
          // Also update database if needed
          await supabase
            .from('profiles')
            .update({
              is_premium: false,
              subscription_status: 'expired',
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
            
          setIsCheckingPremium(false);
          return false;
        }
        
        if (profile.is_premium) {
          console.log('[PREMIUM-VERIFICATION] Premium confirmed from database');
          updateAllPremiumStorages(true);
          setIsCheckingPremium(false);
          return true;
        }
      }
      
      // Reset storage premium if database says not premium
      if (storagePremium && (!error && !profile?.is_premium)) {
        clearPremiumFromLocalStorage();
      }
      
      // If not found in database, check with server function
      const serverPremium = await checkPremiumStatus(user.id, false);
      if (serverPremium) {
        updateAllPremiumStorages(true);
      } else {
        clearPremiumFromLocalStorage();
      }
      setIsCheckingPremium(false);
      return serverPremium;
    } catch (e) {
      console.error('[PREMIUM-VERIFICATION] Error checking premium:', e);
      setIsCheckingPremium(false);
      
      // Fallback to context state if available
      return isPremium || localPremiumStatus || false;
    }
  };

  const forceUpdatePremium = async () => {
    if (!user?.id) return false;
    
    setIsCheckingPremium(true);
    const forceResult = await forcePremiumStatusUpdate(user.id);
    setIsCheckingPremium(false);
    
    if (forceResult && isMountedRef.current) {
      setLocalPremiumStatus(true);
      updateAllPremiumStorages(true);
    } else if (!forceResult) {
      clearPremiumFromLocalStorage();
    }
    
    return forceResult;
  };

  return {
    isPremium: isPremium || !!localPremiumStatus,
    isCheckingPremium,
    verifyPremiumStatus,
    validatePremiumStatus,
    forceUpdatePremium
  };
};
