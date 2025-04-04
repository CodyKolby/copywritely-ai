
import { updateAllPremiumStorages } from '@/contexts/auth/local-storage-utils';

/**
 * Update localStorage premium backup
 */
export const updateLocalStoragePremium = (isPremium: boolean) => {
  try {
    // Use the centralized function to update all storage
    updateAllPremiumStorages(isPremium);
    console.log('[STRIPE-LOCAL] Updated premium status in storage');
  } catch (e) {
    console.error('[STRIPE-LOCAL] Error updating premium in storage:', e);
  }
};
