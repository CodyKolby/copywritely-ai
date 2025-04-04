
import { updateAllPremiumStorages } from '@/contexts/auth/local-storage-utils';

/**
 * Update localStorage premium backup after server validation
 * This should only be used after server-side verification confirms premium status
 */
export const updateLocalStoragePremium = (isPremium: boolean) => {
  try {
    // Use the centralized function to update all storage as a backup mechanism
    updateAllPremiumStorages(isPremium);
    console.log('[STRIPE-LOCAL] Updated premium status in storage as backup');
  } catch (e) {
    console.error('[STRIPE-LOCAL] Error updating premium in storage:', e);
  }
};
