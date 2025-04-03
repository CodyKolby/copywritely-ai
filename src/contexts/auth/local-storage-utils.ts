
/**
 * Validates if localStorage premium backup is valid
 */
export const validateLocalStoragePremium = (): boolean => {
  try {
    const premiumBackup = localStorage.getItem('premium_backup') === 'true';
    const premiumTimestamp = localStorage.getItem('premium_timestamp');
    
    if (premiumBackup && premiumTimestamp) {
      const timestamp = new Date(premiumTimestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
      
      // Only trust localStorage backup if it's less than 24 hours old
      if (hoursDiff < 24) {
        console.log('[LOCAL-STORAGE] Using backup premium status');
        return true;
      } else {
        console.log('[LOCAL-STORAGE] Premium backup expired');
        localStorage.removeItem('premium_backup');
        localStorage.removeItem('premium_timestamp');
      }
    }
    return false;
  } catch (e) {
    console.error('[LOCAL-STORAGE] Error validating premium:', e);
    return false;
  }
};

/**
 * Stores premium status in localStorage
 */
export const storePremiumInLocalStorage = (isPremium: boolean): void => {
  try {
    if (isPremium) {
      localStorage.setItem('premium_backup', 'true');
      localStorage.setItem('premium_timestamp', new Date().toISOString());
    } else {
      localStorage.removeItem('premium_backup');
      localStorage.removeItem('premium_timestamp');
    }
  } catch (e) {
    console.error('[LOCAL-STORAGE] Error storing premium status:', e);
  }
};

/**
 * Clears premium status from localStorage
 */
export const clearPremiumFromLocalStorage = (): void => {
  try {
    localStorage.removeItem('premium_backup');
    localStorage.removeItem('premium_timestamp');
  } catch (e) {
    console.error('[LOCAL-STORAGE] Error clearing premium status:', e);
  }
};
