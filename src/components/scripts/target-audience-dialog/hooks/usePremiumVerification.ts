
import { useState, useEffect } from 'react';
import { checkAllPremiumStorages, updateAllPremiumStorages } from '@/contexts/auth/local-storage-utils';
import { forcePremiumStatusUpdate, checkPremiumStatus } from '@/contexts/auth/premium-utils';

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
      
      // Then check remote status
      const premiumStatus = await checkPremiumStatus(userId);
      setVerifiedPremium(premiumStatus);
      
      // Update local storage
      updateAllPremiumStorages(premiumStatus);
      
      return premiumStatus;
    } catch (error) {
      console.error('Error verifying premium status:', error);
      return initialPremium;
    } finally {
      setIsCheckingPremium(false);
    }
  };

  // Force premium status update
  const refreshPremiumStatus = async () => {
    if (!userId) return false;
    
    try {
      setIsCheckingPremium(true);
      const updatedStatus = await forcePremiumStatusUpdate(userId);
      setVerifiedPremium(updatedStatus);
      return updatedStatus;
    } catch (error) {
      console.error('Error forcing premium status update:', error);
      return initialPremium;
    } finally {
      setIsCheckingPremium(false);
    }
  };

  return {
    verifiedPremium,
    isCheckingPremium,
    validatePremiumStatus: () => verifyPremiumStatus(userId || ''),
    refreshPremiumStatus
  };
};
