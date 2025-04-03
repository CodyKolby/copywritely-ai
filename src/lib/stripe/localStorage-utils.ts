
/**
 * Update localStorage premium backup
 */
export const updateLocalStoragePremium = (isPremium: boolean) => {
  try {
    if (isPremium) {
      localStorage.setItem('premium_backup', 'true');
      localStorage.setItem('premium_timestamp', new Date().toISOString());
      console.log('[STRIPE-LOCAL] Updated localStorage premium backup');
    } else {
      localStorage.removeItem('premium_backup');
      localStorage.removeItem('premium_timestamp');
      console.log('[STRIPE-LOCAL] Removed localStorage premium backup');
    }
  } catch (e) {
    console.error('[STRIPE-LOCAL] Error updating localStorage premium:', e);
  }
};
