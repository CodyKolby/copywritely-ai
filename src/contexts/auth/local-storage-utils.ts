
/**
 * Update premium status in localStorage
 */
export const updateAllPremiumStorages = (isPremium: boolean) => {
  if (isPremium) {
    const timestamp = new Date().getTime();
    localStorage.setItem('premium_status', 'true');
    localStorage.setItem('premium_timestamp', timestamp.toString());
    sessionStorage.setItem('premium_status', 'true');
    console.log('[PREMIUM] Updated all storages with premium status');
  } else {
    clearPremiumFromLocalStorage();
  }
};

/**
 * Clear premium flags from localStorage
 */
export const clearPremiumFromLocalStorage = () => {
  localStorage.removeItem('premium_status');
  localStorage.removeItem('premium_timestamp');
  sessionStorage.removeItem('premium_status');
  console.log('[PREMIUM] Cleared premium status from all storages');
};

/**
 * Check if premium status is stored in any storage
 */
export const checkAllPremiumStorages = (): boolean => {
  // First check localStorage with timestamp validation
  const lsPremiumStatus = localStorage.getItem('premium_status');
  const lsTimestamp = localStorage.getItem('premium_timestamp');
  
  if (lsPremiumStatus === 'true' && lsTimestamp) {
    const premiumTime = parseInt(lsTimestamp, 10);
    const now = new Date().getTime();
    const hoursDiff = (now - premiumTime) / (1000 * 60 * 60);
    
    // If premium status is less than 24 hours old, consider it valid
    if (hoursDiff < 24) {
      console.log('[PREMIUM] Valid premium status found in localStorage');
      return true;
    }
  }
  
  // Then check sessionStorage as backup
  const ssPremiumStatus = sessionStorage.getItem('premium_status');
  if (ssPremiumStatus === 'true') {
    console.log('[PREMIUM] Premium status found in sessionStorage');
    return true;
  }
  
  return false;
};
