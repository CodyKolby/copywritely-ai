import { checkAllPremiumStorages } from '@/contexts/auth/local-storage-utils';

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
