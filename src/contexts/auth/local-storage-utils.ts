
// Check if this file exists and create it if needed. 
// If it exists, we'll modify the clearPremiumFromLocalStorage function.

export const updateLocalStoragePremium = (isPremium: boolean): void => {
  try {
    console.log(`[LOCAL-STORAGE] Setting premium status to ${isPremium}`);
    localStorage.setItem('premium_status', isPremium ? 'true' : 'false');
    localStorage.setItem('premium_timestamp', Date.now().toString());
  } catch (e) {
    console.error('[LOCAL-STORAGE] Error updating premium in localStorage:', e);
  }
};

export const updateAllPremiumStorages = (isPremium: boolean): void => {
  try {
    console.log(`[LOCAL-STORAGE] Updating all premium storages to ${isPremium}`);
    
    // Update localStorage
    updateLocalStoragePremium(isPremium);
    
    // Update sessionStorage
    sessionStorage.setItem('premium_status', isPremium ? 'true' : 'false');
    sessionStorage.setItem('premium_timestamp', Date.now().toString());
    
  } catch (e) {
    console.error('[LOCAL-STORAGE] Error updating all premium storages:', e);
  }
};

export const validateLocalStoragePremium = (): boolean => {
  try {
    const premiumStatus = localStorage.getItem('premium_status');
    const timestamp = localStorage.getItem('premium_timestamp');
    
    if (premiumStatus !== 'true') return false;
    
    if (timestamp) {
      const storageTime = parseInt(timestamp, 10);
      const now = Date.now();
      const hoursDiff = (now - storageTime) / (1000 * 60 * 60);
      
      // Valid for 12 hours only
      if (hoursDiff > 12) {
        console.log('[LOCAL-STORAGE] Premium status expired in localStorage');
        clearPremiumFromLocalStorage();
        return false;
      }
    }
    
    return premiumStatus === 'true';
  } catch (e) {
    console.error('[LOCAL-STORAGE] Error validating premium in localStorage:', e);
    return false;
  }
};

export const checkAllPremiumStorages = (): boolean => {
  try {
    // Check localStorage first
    const localPremium = validateLocalStoragePremium();
    if (localPremium) return true;
    
    // Then check sessionStorage
    const sessionPremium = sessionStorage.getItem('premium_status');
    if (sessionPremium === 'true') return true;
    
    return false;
  } catch (e) {
    console.error('[LOCAL-STORAGE] Error checking all premium storages:', e);
    return false;
  }
};

export const clearPremiumFromLocalStorage = (): void => {
  try {
    console.log('[LOCAL-STORAGE] Premium status cleared from storage');
    localStorage.removeItem('premium_status');
    localStorage.removeItem('premium_timestamp');
    sessionStorage.removeItem('premium_status');
    sessionStorage.removeItem('premium_timestamp');
  } catch (e) {
    console.error('[LOCAL-STORAGE] Error clearing premium from storages:', e);
  }
};
