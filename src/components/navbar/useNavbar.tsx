
import { useState, useEffect } from 'react';
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
      // Use the most reliable source of truth - profile.is_premium
      if (profile?.is_premium === true) {
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
        
        setLocalPremium(true);
      } else {
        // If profile.is_premium is explicitly false, respect that
        if (profile && profile.is_premium === false) {
          setLocalPremium(false);
          clearPremiumFromLocalStorage();
        } else if (isPremium) {
          // Fall back to context state if profile not available
          setLocalPremium(true);
        } else {
          setLocalPremium(false);
        }
      }
    }
    
    verifyPremium();
  }, [user, isPremium, profile, checkPremiumStatus]);

  // If user is logged in but we don't have premium status or profile yet,
  // verify with server
  useEffect(() => {
    if (user?.id && !isPremium && !profile?.is_premium) {
      console.log('[NAVBAR] User logged in but no premium status, checking with server');
      checkPremiumStatus(user.id);
    }
  }, [user, isPremium, profile, checkPremiumStatus]);

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
