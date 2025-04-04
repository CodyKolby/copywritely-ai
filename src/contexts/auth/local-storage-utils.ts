
/**
 * Validate premium status stored in localStorage
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
      localStorage.removeItem('premium_backup');
      localStorage.removeItem('premium_timestamp');
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('[LOCAL-STORAGE] Error validating premium status:', e);
    return false;
  }
};

/**
 * Store premium status in localStorage as backup
 */
export const storePremiumInLocalStorage = (isPremium: boolean) => {
  try {
    if (isPremium) {
      localStorage.setItem('premium_backup', 'true');
      localStorage.setItem('premium_timestamp', new Date().toISOString());
      console.log('[LOCAL-STORAGE] Premium status stored in localStorage');
    } else {
      localStorage.removeItem('premium_backup');
      localStorage.removeItem('premium_timestamp');
      console.log('[LOCAL-STORAGE] Premium status removed from localStorage');
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
 */
export const checkAllPremiumStorages = (): boolean => {
  try {
    // Check session storage first (fastest)
    if (sessionStorage.getItem('premium_session') === 'true') {
      return true;
    }
    
    // Then check localStorage
    return validateLocalStoragePremium();
  } catch (e) {
    console.error('[LOCAL-STORAGE] Error checking premium storages:', e);
    return false;
  }
};
