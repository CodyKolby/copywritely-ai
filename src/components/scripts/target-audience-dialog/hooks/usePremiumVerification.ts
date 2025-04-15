
import { useState, useEffect, useRef } from 'react';
import { checkAllPremiumStorages } from '@/contexts/auth/local-storage-utils';

export const usePremiumVerification = (userId: string | undefined, initialPremium: boolean) => {
  const [verifiedPremium, setVerifiedPremium] = useState<boolean | null>(null);
  const [isCheckingPremium, setIsCheckingPremium] = useState(false);
  const checkInProgress = useRef(false);

  // Verify premium status on mount and when userId changes
  useEffect(() => {
    if (userId && !checkInProgress.current) {
      verifyPremiumStatus(userId);
    }
  }, [userId]);

  const verifyPremiumStatus = async (userId: string) => {
    // Prevent concurrent verifications
    if (checkInProgress.current) {
      console.log('[PremiumVerification] Check already in progress, skipping duplicate call');
      return initialPremium;
    }
    
    checkInProgress.current = true;
    setIsCheckingPremium(true);
    
    try {
      // Check local storage first
      const storagePremium = checkAllPremiumStorages();
      
      if (storagePremium !== null) {
        setVerifiedPremium(storagePremium);
        return storagePremium;
      }
      
      return initialPremium;
    } catch (error) {
      console.error('[PremiumVerification] Error verifying premium status:', error);
      return initialPremium;
    } finally {
      setIsCheckingPremium(false);
      
      // Add small delay to prevent rapid rechecking
      setTimeout(() => {
        checkInProgress.current = false;
      }, 1000);
    }
  };

  return {
    verifiedPremium,
    isCheckingPremium,
    validatePremiumStatus: () => verifyPremiumStatus(userId || '')
  };
};
