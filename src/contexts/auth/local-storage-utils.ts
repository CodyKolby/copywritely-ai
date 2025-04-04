
/**
 * Validate premium status stored in localStorage
 * This is only used as a backup when server validation is not available
 */
export const validateLocalStoragePremium = (): boolean => {
  try {
    const premiumBackup = localStorage.getItem('premium_backup');
    const premiumTimestamp = localStorage.getItem('premium_timestamp');
    
    if (premiumBackup !== 'true' || !premiumTimestamp) {
      return false;
    }
    
    // Check if the timestamp is valid and not too old (30 days max)
    const timestamp = new Date(premiumTimestamp);
    const now = new Date();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    
    if (isNaN(timestamp.getTime()) || (now.getTime() - timestamp.getTime() > thirtyDaysMs)) {
      // Clear invalid data
      clearPremiumFromLocalStorage();
      return false;
    }
    
    // This is a backup only - log that we're using it
    console.log('[LOCAL-STORAGE] Using premium backup from localStorage - this should only happen during initial load');
    return true;
  } catch (e) {
    console.error('[LOCAL-STORAGE] Error validating premium status:', e);
    return false;
  }
};

/**
 * Store premium status in localStorage as backup
 * This should only be used after server verification confirms premium status
 */
export const storePremiumInLocalStorage = (isPremium: boolean) => {
  try {
    if (isPremium) {
      localStorage.setItem('premium_backup', 'true');
      localStorage.setItem('premium_timestamp', new Date().toISOString());
      console.log('[LOCAL-STORAGE] Premium status stored in localStorage as backup');
    } else {
      clearPremiumFromLocalStorage();
    }
  } catch (e) {
    console.error('[LOCAL-STORAGE] Error storing premium status:', e);
  }
};

/**
 * Clear premium status from localStorage
 */
export const clearPremiumFromLocalStorage = () => {
  try {
    localStorage.removeItem('premium_backup');
    localStorage.removeItem('premium_timestamp');
    sessionStorage.removeItem('premium_session');
    console.log('[LOCAL-STORAGE] Premium status cleared from storage');
  } catch (e) {
    console.error('[LOCAL-STORAGE] Error clearing premium status:', e);
  }
};

/**
 * Update the premium status in localStorage and create a session flag
 * This is a backup mechanism only - premium status should be validated from server
 */
export const updateAllPremiumStorages = (isPremium: boolean) => {
  storePremiumInLocalStorage(isPremium);
  
  // Also set a session storage flag for the current browsing session
  try {
    if (isPremium) {
      sessionStorage.setItem('premium_session', 'true');
    } else {
      sessionStorage.removeItem('premium_session');
    }
  } catch (e) {
    console.error('[LOCAL-STORAGE] Error updating session storage:', e);
  }
};

/**
 * Check all storage locations for premium status
 * This is only a fallback and should not be the primary source of truth
 */
export const checkAllPremiumStorages = (): boolean => {
  try {
    // Check session storage first (fastest)
    if (sessionStorage.getItem('premium_session') === 'true') {
      console.log('[LOCAL-STORAGE] Using premium status from sessionStorage (backup)');
      return true;
    }
    
    // Then check localStorage
    return validateLocalStoragePremium();
  } catch (e) {
    console.error('[LOCAL-STORAGE] Error checking premium storages:', e);
    return false;
  }
};
