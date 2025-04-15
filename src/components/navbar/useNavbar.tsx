
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { validateLocalStoragePremium, clearPremiumFromLocalStorage } from '@/contexts/auth/local-storage-utils';
import { supabase } from '@/integrations/supabase/client';

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
  useEffect(() => {
    async function verifyPremium() {
      if (isPremium) {
        setLocalPremium(true);
      } else if (profile?.is_premium) {
        // Verify expiry date
        if (profile.subscription_expiry) {
          const isExpired = new Date(profile.subscription_expiry) < new Date();
          if (isExpired) {
            console.log('[NAVBAR] Subscription expired according to expiry date');
            setLocalPremium(false);
            clearPremiumFromLocalStorage();
            
            // Update database to reflect expired status
            if (user?.id) {
              await supabase
                .from('profiles')
                .update({
                  is_premium: false,
                  subscription_status: 'expired',
                  updated_at: new Date().toISOString()
                })
                .eq('id', user.id);
            }
            return;
          }
        }
        
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
    }
    
    verifyPremium();
  }, [user, isPremium, profile, premiumChecked, checkPremiumStatus]);

  // If user is logged in but we don't have premium status or profile yet,
  // verify with server
  useEffect(() => {
    if (user?.id && !isPremium && !profile?.is_premium && premiumChecked) {
      console.log('[NAVBAR] User logged in but no premium status, checking with server');
      checkPremiumStatus(user.id);
    }
  }, [user, isPremium, profile, premiumChecked, checkPremiumStatus]);

  // Check subscription expiry periodically
  useEffect(() => {
    if (!user?.id || !profile?.subscription_expiry) return;
    
    const checkExpiry = async () => {
      if (profile.subscription_expiry) {
        const expiryDate = new Date(profile.subscription_expiry);
        const now = new Date();
        
        if (expiryDate < now && (profile.is_premium || localPremium)) {
          console.log('[NAVBAR] Subscription has expired, updating premium status');
          setLocalPremium(false);
          clearPremiumFromLocalStorage();
          
          if (user?.id) {
            await supabase
              .from('profiles')
              .update({
                is_premium: false,
                subscription_status: 'expired',
                updated_at: now.toISOString()
              })
              .eq('id', user.id);
            
            // Force refresh premium status from server
            checkPremiumStatus(user.id, false);
          }
        }
      }
    };
    
    // Check immediately and then every minute
    checkExpiry();
    const interval = setInterval(checkExpiry, 60000);
    return () => clearInterval(interval);
  }, [user, profile, localPremium, checkPremiumStatus]);

  // Log current premium status indicators
  useEffect(() => {
    console.log('Navbar premium status:', {
      isPremium,
      profileIsPremium: profile?.is_premium,
      subscriptionId: profile?.subscription_id,
      subscriptionStatus: profile?.subscription_status,
      subscriptionExpiry: profile?.subscription_expiry,
      localPremium,
      now: new Date().toISOString()
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
