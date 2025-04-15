
import { useState, useEffect, useRef } from 'react';
import { checkAllPremiumStorages } from '@/contexts/auth/local-storage-utils';

export const usePremiumVerification = (userId: string | undefined, initialPremium: boolean) => {
  const [verifiedPremium, setVerifiedPremium] = useState<boolean | null>(null);
  const [isCheckingPremium, setIsCheckingPremium] = useState(false);
  const checkInProgress = useRef(false);
  
  // Cache verification results to prevent excessive re-checks
  const lastVerification = useRef({
    userId: '',
    result: false,
    timestamp: 0
  });

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
    
    // Use cached result if we checked within the last 5 minutes for this user
    const now = Date.now();
    if (
      lastVerification.current.userId === userId && 
      now - lastVerification.current.timestamp < 300000 // 5 minutes
    ) {
      console.log('[PremiumVerification] Using cached premium status:', lastVerification.current.result);
      setVerifiedPremium(lastVerification.current.result);
      return lastVerification.current.result;
    }
    
    checkInProgress.current = true;
    setIsCheckingPremium(true);
    
    try {
      // Check local storage first
      const storagePremium = checkAllPremiumStorages();
      
      if (storagePremium !== null) {
        setVerifiedPremium(storagePremium);
        
        // Update cache
        lastVerification.current = {
          userId,
          result: storagePremium,
          timestamp: now
        };
        
        return storagePremium;
      }
      
      // Update cache
      lastVerification.current = {
        userId,
        result: initialPremium,
        timestamp: now
      };
      
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
