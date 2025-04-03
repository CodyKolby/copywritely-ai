
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { validateLocalStoragePremium } from '@/contexts/auth/local-storage-utils';

interface UseNavbarReturn {
  scrolled: boolean;
  localPremium: boolean;
  subscriptionModalOpen: boolean;
  setSubscriptionModalOpen: (open: boolean) => void;
  navItems: Array<{ path: string, label: string }>;
}

export const useNavbar = (): UseNavbarReturn => {
  const [scrolled, setScrolled] = useState(false);
  const [localPremium, setLocalPremium] = useState(false);
  const [premiumChecked, setPremiumChecked] = useState(false);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const { user, isPremium, profile, checkPremiumStatus } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Check localStorage for premium status backup
  useEffect(() => {
    const validateLocalStorage = () => {
      try {
        const localStoragePremium = validateLocalStoragePremium();
        if (localStoragePremium) {
          console.log('[NAVBAR] Using backup premium status from localStorage');
          setLocalPremium(true);
          return true;
        }
        return false;
      } catch (e) {
        console.error('[NAVBAR] Error checking localStorage premium:', e);
        return false;
      }
    };
    
    if (!premiumChecked) {
      const hasLocalPremium = validateLocalStorage();
      setPremiumChecked(true);
      
      // If a user is logged in but we don't have isPremium from context,
      // but we have localStorage premium, verify with database
      if (user?.id && !isPremium && hasLocalPremium) {
        checkPremiumStatus(user.id);
      }
    }
  }, [user, isPremium, premiumChecked, checkPremiumStatus]);

  // When isPremium changes, update localPremium
  useEffect(() => {
    if (isPremium) {
      setLocalPremium(true);
    }
  }, [isPremium]);

  useEffect(() => {
    console.log('Navbar premium status:', {
      isPremium,
      profileIsPremium: profile?.is_premium,
      subscriptionId: profile?.subscription_id,
      subscriptionStatus: profile?.subscription_status,
      localPremium
    });
  }, [isPremium, profile, localPremium]);

  const navItems = [
    { path: '/', label: 'Główna' },
    { path: '/script-generator', label: 'Twórz skrypty' },
    { path: '/pricing', label: 'Plany' },
    { path: '/about', label: 'O nas' },
  ];

  return {
    scrolled,
    localPremium,
    subscriptionModalOpen,
    setSubscriptionModalOpen,
    navItems
  };
};
