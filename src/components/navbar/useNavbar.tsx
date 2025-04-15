
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { clearPremiumFromLocalStorage } from '@/contexts/auth/local-storage-utils';
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
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const { user, isPremium, profile, checkPremiumStatus } = useAuth();
  const checkingRef = useRef(false);

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
    if (checkingRef.current) return;
    
    async function verifyPremium() {
      checkingRef.current = true;
      
      try {
        // Use the most reliable source of truth - profile.is_premium
        if (profile) {
          // Check for expired subscription
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
          
          // Also check for canceled status
          if (profile.subscription_status === 'canceled') {
            console.log('[NAVBAR] Subscription is canceled');
            setLocalPremium(false);
            clearPremiumFromLocalStorage();
            return;
          }
          
          // If profile.is_premium is explicitly false, respect that
          if (profile.is_premium === false) {
            console.log('[NAVBAR] Profile explicitly has is_premium=false');
            setLocalPremium(false);
            clearPremiumFromLocalStorage();
            return;
          }
          
          // If we've passed all checks and profile.is_premium is true, user is premium
          if (profile.is_premium === true) {
            console.log('[NAVBAR] User has valid premium status according to profile');
            setLocalPremium(true);
            return;
          }
        }
        
        // Fall back to context state if profile doesn't have conclusive data
        setLocalPremium(isPremium);
      } finally {
        checkingRef.current = false;
      }
    }
    
    verifyPremium();
  }, [user, isPremium, profile, checkPremiumStatus]);

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
