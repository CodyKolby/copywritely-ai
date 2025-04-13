
import { useState, useEffect } from 'react';
import { checkAllPremiumStorages } from '@/contexts/auth/local-storage-utils';

export const usePremiumVerification = (userId: string | undefined, initialPremium: boolean) => {
  const [verifiedPremium, setVerifiedPremium] = useState<boolean | null>(null);
  const [isCheckingPremium, setIsCheckingPremium] = useState(false);

  // Verify premium status on mount and when userId changes
  useEffect(() => {
    if (userId) {
      verifyPremiumStatus(userId);
    }
  }, [userId]);

  const verifyPremiumStatus = async (userId: string) => {
    try {
      setIsCheckingPremium(true);
      
      // Check local storage first
      const storagePremium = checkAllPremiumStorages();
      
      if (storagePremium !== null) {
        setVerifiedPremium(storagePremium);
        return storagePremium;
      }
      
      return initialPremium;
    } catch (error) {
      console.error('Error verifying premium status:', error);
      return initialPremium;
    } finally {
      setIsCheckingPremium(false);
    }
  };

  return {
    verifiedPremium,
    isCheckingPremium,
    validatePremiumStatus: () => verifyPremiumStatus(userId || '')
  };
};
