
/**
 * Store premium status in localStorage
 */
export const updateLocalStoragePremium = (isPremium: boolean): void => {
  if (isPremium) {
    const timestamp = new Date().getTime();
    localStorage.setItem('premium_status', 'true');
    localStorage.setItem('premium_timestamp', timestamp.toString());
    console.log('Updated local storage premium status to:', isPremium);
  } else {
    localStorage.removeItem('premium_status');
    localStorage.removeItem('premium_timestamp');
    console.log('Cleared local storage premium status');
  }
};

/**
 * Check premium status from localStorage
 */
export const checkLocalStoragePremium = (): boolean => {
  const premiumStatus = localStorage.getItem('premium_status');
  
  if (premiumStatus === 'true') {
    // Verify timestamp - consider valid for up to 24 hours
    const timestamp = localStorage.getItem('premium_timestamp');
    if (timestamp) {
      const premiumTime = parseInt(timestamp, 10);
      const now = new Date().getTime();
      const hoursDiff = (now - premiumTime) / (1000 * 60 * 60);
      
      // If premium status is less than 24 hours old, consider it valid
      if (hoursDiff < 24) {
        console.log('Valid premium status found in localStorage');
        return true;
      } else {
        console.log('Premium status expired in localStorage');
        // Clean up expired status
        localStorage.removeItem('premium_status');
        localStorage.removeItem('premium_timestamp');
      }
    }
  }
  
  return false;
};
