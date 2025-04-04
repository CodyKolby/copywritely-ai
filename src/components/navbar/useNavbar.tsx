
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

  // Handle window scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Check for premium status whenever auth context changes
  // This is critical for premium features to work properly
  useEffect(() => {
    if (isPremium) {
      setLocalPremium(true);
    } else if (profile?.is_premium) {
      setLocalPremium(true);
    } else if (!premiumChecked) {
      // Only check localStorage once
      const localStoragePremium = validateLocalStoragePremium();
      if (localStoragePremium) {
        console.log('[NAVBAR] Using backup premium status from localStorage');
        setLocalPremium(true);
        
        // Verify with server if we have a user ID
        if (user?.id) {
          checkPremiumStatus(user.id);
        }
      }
      setPremiumChecked(true);
    }
  }, [user, isPremium, profile, premiumChecked, checkPremiumStatus]);

  // If user is logged in but we don't have premium status or profile yet,
  // verify with server
  useEffect(() => {
    if (user?.id && !isPremium && !profile?.is_premium && premiumChecked) {
      console.log('[NAVBAR] User logged in but no premium status, checking with server');
      checkPremiumStatus(user.id);
    }
  }, [user, isPremium, profile, premiumChecked, checkPremiumStatus]);

  // Log current premium status indicators
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
