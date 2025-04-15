
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';
import { createCheckoutSession, PRICE_IDS } from '@/lib/stripe';
import { SubscriptionDetails, getSubscriptionDetails } from '@/lib/stripe/subscription';
import { supabase } from '@/integrations/supabase/client';

export const useSubscriptionModal = (open: boolean) => {
  const { user, isPremium, refreshSession } = useAuth();
  const [manualRefetch, setManualRefetch] = useState(false);
  const [timeoutErrored, setTimeoutErrored] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Format date helper function
  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      return new Date(dateString).toLocaleDateString('pl-PL', options);
    } catch {
      return 'Data niedostępna';
    }
  };

  // Set timeout to prevent infinite loading
  useEffect(() => {
    let timeoutId: number | null = null;
    
    if (open) {
      console.log('[SubscriptionModal] Modal opened, starting timeout check');
      setTimeoutErrored(false); // Reset timeout error when opening
      
      timeoutId = window.setTimeout(() => {
        setTimeoutErrored(true);
        console.log('[SubscriptionModal] Subscription data fetch timeout reached');
      }, 15000); // Increased timeout
    }
    
    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [open, retryCount]);

  // Force session refresh when modal opens
  useEffect(() => {
    if (open && user?.id) {
      console.log('[SubscriptionModal] Modal opened, refreshing session');
      refreshSession().catch(err => {
        console.error('[SubscriptionModal] Error refreshing session:', err);
      });
    }
  }, [open, user?.id, refreshSession]);

  // Direct DB check for premium status
  const checkPremiumDirectly = useCallback(async (userId: string) => {
    try {
      console.log('[SubscriptionModal] Direct DB premium check for user:', userId);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_premium, subscription_status, subscription_expiry, subscription_id')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('[SubscriptionModal] Error checking DB for premium:', error);
        return null;
      }
      
      console.log('[SubscriptionModal] Direct DB check result:', profile);
      return profile;
    } catch (e) {
      console.error('[SubscriptionModal] Exception in direct DB check:', e);
      return null;
    }
  }, []);

  // Fetch subscription data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscriptionDetails', user?.id, manualRefetch, open, retryCount],
    queryFn: async () => {
      if (!user?.id) return null;

      try {
        console.log('[SubscriptionModal] Starting subscription data fetch for user:', user.id);
        
        // If we hit the timeout error, throw early to avoid waiting
        if (timeoutErrored) {
          throw new Error('Przekroczono czas oczekiwania na dane subskrypcji');
        }

        // First check DB directly to verify subscription status
        const profileData = await checkPremiumDirectly(user.id);
        
        // Get standard subscription details
        const subscriptionData = await getSubscriptionDetails(user.id);
        
        if (!subscriptionData) {
          console.log('[SubscriptionModal] No subscription data returned from API');
          
          // If no data returned but user is premium according to DB, create fallback data
          if (profileData && profileData.is_premium === true) {
            console.log('[SubscriptionModal] Creating fallback data from profile');
            
            // Get expiry date from profile
            const expiryDate = profileData.subscription_expiry || getDefaultExpiryDate();
            const daysUntil = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24));
            
            return {
              hasSubscription: true,
              subscriptionId: profileData.subscription_id || 'manual_premium',
              status: profileData.subscription_status || 'active',
              currentPeriodEnd: expiryDate,
              daysUntilRenewal: Math.max(0, daysUntil),
              cancelAtPeriodEnd: false,
              portalUrl: null,
              plan: 'Pro',
              trialEnd: null,
              isTrial: false
            } as SubscriptionDetails;
          }
          
          throw new Error('Nie udało się pobrać danych subskrypcji');
        }
        
        // Verify that we have all required fields
        if (typeof subscriptionData.isTrial !== 'boolean') {
          subscriptionData.isTrial = subscriptionData.status === 'trialing';
        }
        
        if (!subscriptionData.trialEnd && subscriptionData.isTrial && subscriptionData.currentPeriodEnd) {
          subscriptionData.trialEnd = subscriptionData.currentPeriodEnd;
        }
        
        // Double-check expiry date logic - if negative days, subscription has expired
        if (subscriptionData.daysUntilRenewal <= 0 && subscriptionData.status !== 'trialing') {
          console.log('[SubscriptionModal] Subscription appears expired based on days calculation');
          
          // Verify with DB - if DB says premium is active, trust that over the days calculation
          if (profileData && profileData.is_premium === true) {
            console.log('[SubscriptionModal] DB says premium is active despite days calculation');
            
            // Fix the days calculation
            const correctedDays = calculateDaysUntilRenewal(subscriptionData.currentPeriodEnd);
            subscriptionData.daysUntilRenewal = Math.max(1, correctedDays);
          } else {
            // Force refresh of auth status since subscription has expired
            await refreshSession();
            throw new Error('Twoja subskrypcja wygasła');
          }
        }
        
        return subscriptionData;
      } catch (err) {
        console.error('[SubscriptionModal] Error in subscription fetch:', err);
        
        if (isPremium) {
          console.log('[SubscriptionModal] Creating fallback subscription for premium user');
          
          // Create a fallback subscription object for users with premium status
          // but no subscription details (e.g. trial users)
          
          // Check if we can get profile details
          try {
            const profile = await checkPremiumDirectly(user.id);
              
            if (profile && profile.is_premium === true) {
              // Verify expiry date
              let currentExpiryDate = profile.subscription_expiry || getDefaultExpiryDate();
              let isTrial = profile.subscription_status === 'trialing' || 
                         (!profile.subscription_id && profile.subscription_expiry);
              
              // Calculate days until expiry
              const daysUntil = Math.ceil((new Date(currentExpiryDate).getTime() - Date.now()) / (1000 * 3600 * 24));
              
              console.log('[SubscriptionModal] Created fallback subscription from profile data');
              
              return {
                hasSubscription: true,
                subscriptionId: profile.subscription_id || 'manual_premium',
                status: profile.subscription_status || 'active',
                currentPeriodEnd: currentExpiryDate,
                daysUntilRenewal: Math.max(0, daysUntil),
                cancelAtPeriodEnd: false,
                portalUrl: null,
                plan: isTrial ? 'Trial' : 'Pro',
                trialEnd: isTrial ? currentExpiryDate : null,
                isTrial: isTrial
              } as SubscriptionDetails;
            }
          } catch (profileErr) {
            console.error('[SubscriptionModal] Error fetching profile details:', profileErr);
          }
          
          // Default fallback
          return getFallbackSubscriptionData();
        }
        
        throw err;
      }
    },
    enabled: !!user?.id && open,
    retry: timeoutErrored ? 0 : 2,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 2,
  });

  // Helper function to get default expiry date (30 days from now)
  const getDefaultExpiryDate = () => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    return expiryDate.toISOString();
  };
  
  // Helper function to calculate days until renewal
  const calculateDaysUntilRenewal = (dateString: string) => {
    try {
      return Math.ceil((new Date(dateString).getTime() - Date.now()) / (1000 * 3600 * 24));
    } catch (e) {
      return 30; // Default to 30 days if calculation fails
    }
  };
  
  // Get fallback subscription data
  const getFallbackSubscriptionData = (): SubscriptionDetails => {
    const expiryDate = getDefaultExpiryDate();
    return {
      hasSubscription: true,
      subscriptionId: 'manual_premium',
      status: 'active',
      plan: 'Pro',
      daysUntilRenewal: 30,
      currentPeriodEnd: expiryDate,
      portalUrl: null,
      trialEnd: null,
      isTrial: false,
      cancelAtPeriodEnd: false
    };
  };

  // Refresh data when modal is opened
  useEffect(() => {
    if (open) {
      console.log('[SubscriptionModal] Modal opened, triggering data refresh');
      setTimeoutErrored(false);
      setTimeout(() => {
        setManualRefetch(prev => !prev);
      }, 300);
    }
  }, [open]);

  // Handle subscription renewal
  const renewSubscription = () => {
    try {
      const priceId = data?.plan?.includes('roczn') ? PRICE_IDS.PRO_ANNUAL : PRICE_IDS.PRO_MONTHLY;
      createCheckoutSession(priceId);
    } catch (error) {
      toast.error('Błąd podczas odnowienia subskrypcji', {
        description: error instanceof Error ? error.message : 'Spróbuj ponownie później.'
      });
    }
  };

  // Handle opening Stripe portal
  const handleOpenPortal = () => {
    try {
      if (data?.portalUrl) {
        console.log('[SubscriptionModal] Opening portal URL:', data.portalUrl);
        
        window.open(data.portalUrl, '_blank');
      } else {
        console.error('[SubscriptionModal] No portal URL available');
        toast.error('Nie udało się utworzyć sesji portalu klienta', {
          description: 'Spróbuj odświeżyć informacje o subskrypcji lub skontaktuj się z obsługą klienta.'
        });
      }
    } catch (err) {
      console.error('[SubscriptionModal] Error opening portal URL:', err);
      toast.error('Wystąpił błąd podczas otwierania portalu klienta');
    }
  };

  // Manual retry functionality
  const handleRetry = useCallback(() => {
    console.log('[SubscriptionModal] Manual retry triggered');
    setTimeoutErrored(false);
    setRetryCount(count => count + 1);
    refetch();
  }, [refetch]);

  // Check if we have premium but no data
  const isPremiumButNoData = isPremium && (!data || !data.hasSubscription);

  return {
    data,
    isLoading: isLoading && !timeoutErrored,
    error: timeoutErrored ? new Error('Przekroczono czas oczekiwania na dane subskrypcji') : error,
    isPremiumButNoData,
    formatDate,
    renewSubscription,
    handleOpenPortal,
    fallbackData: getFallbackSubscriptionData(),
    refetch,
    timeoutErrored,
    handleRetry
  };
};
