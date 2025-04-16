
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const timeoutRef = useRef<number | null>(null);
  const maxRetries = 2; // Limit retries
  const documentVisibleRef = useRef(true);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Track document visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      documentVisibleRef.current = document.visibilityState === 'visible';
      
      // When tab becomes visible again, try a refresh if we previously had an error
      if (documentVisibleRef.current && timeoutErrored && open) {
        console.log('[SubscriptionModal] Tab became visible again, refreshing data');
        setTimeoutErrored(false);
        setManualRefetch(prev => !prev);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [timeoutErrored, open]);

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
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (open) {
      console.log('[SubscriptionModal] Modal opened, starting timeout check');
      setTimeoutErrored(false); // Reset timeout error when opening
      
      timeoutRef.current = window.setTimeout(() => {
        // Only set timeout error if the document is visible
        if (documentVisibleRef.current) {
          setTimeoutErrored(true);
          console.log('[SubscriptionModal] Subscription data fetch timeout reached');
        } else {
          console.log('[SubscriptionModal] Timeout reached but tab not visible, deferring error');
        }
      }, 10000); // 10 second timeout
    }
    
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
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
    if (!userId) return null;
    
    try {
      console.log('[SubscriptionModal] Direct DB premium check for user:', userId);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_premium, subscription_status, subscription_expiry, subscription_id, trial_started_at')
        .eq('id', userId)
        .maybeSingle();
        
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

  // Helper function to calculate trial expiry date (3 days from trial start)
  const getTrialExpiryDate = (trialStartDate: string | null) => {
    if (!trialStartDate) {
      const now = new Date();
      now.setDate(now.getDate() + 3); // Default 3-day trial
      return now.toISOString();
    }
    
    const startDate = new Date(trialStartDate);
    startDate.setDate(startDate.getDate() + 3); // 3-day trial
    return startDate.toISOString();
  };
  
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
  const getFallbackSubscriptionData = (isTrial: boolean = false): SubscriptionDetails => {
    const expiryDate = isTrial ? getTrialExpiryDate(null) : getDefaultExpiryDate();
    const daysUntil = calculateDaysUntilRenewal(expiryDate);
    
    return {
      hasSubscription: true,
      subscriptionId: 'manual_premium',
      status: isTrial ? 'trialing' : 'active',
      plan: isTrial ? 'Trial' : 'Pro',
      daysUntilRenewal: Math.max(1, daysUntil),
      currentPeriodEnd: expiryDate,
      portalUrl: null,
      trialEnd: isTrial ? expiryDate : null,
      isTrial: isTrial,
      cancelAtPeriodEnd: false
    };
  };

  // Fetch subscription data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscriptionDetails', user?.id, manualRefetch, open, retryCount],
    queryFn: async () => {
      if (!user?.id) return null;

      try {
        console.log('[SubscriptionModal] Starting subscription data fetch for user:', user.id);
        
        // If we hit the timeout error, use fallback immediately
        if (timeoutErrored && retryCount >= maxRetries) {
          console.log('[SubscriptionModal] Timeout reached after max retries, using fallback');
          if (isPremium) {
            // Check if the user is in trial mode
            const profileData = await checkPremiumDirectly(user.id);
            const isTrial = profileData && (
              profileData.trial_started_at !== null || 
              profileData.subscription_status === 'trialing'
            );
            
            return getFallbackSubscriptionData(!!isTrial);
          }
          throw new Error('Przekroczono czas oczekiwania na dane subskrypcji');
        }

        // First check DB directly to verify subscription status
        const profileData = await checkPremiumDirectly(user.id);
        
        if (profileData && profileData.is_premium === true) {
          console.log('[SubscriptionModal] Creating fallback data from profile');
          
          // Check if the user is in trial mode
          const isTrial = profileData && (
            profileData.trial_started_at !== null || 
            profileData.subscription_status === 'trialing'
          );
            
          // Get expiry date based on subscription type
          let expiryDate;
          if (isTrial) {
            expiryDate = profileData.subscription_expiry || 
                        getTrialExpiryDate(profileData.trial_started_at || null);
          } else {
            expiryDate = profileData.subscription_expiry || getDefaultExpiryDate();
          }
          
          const daysUntil = calculateDaysUntilRenewal(expiryDate);
          
          return {
            hasSubscription: true,
            subscriptionId: profileData.subscription_id || 'manual_premium',
            status: profileData.subscription_status || (isTrial ? 'trialing' : 'active'),
            currentPeriodEnd: expiryDate,
            daysUntilRenewal: Math.max(0, daysUntil),
            cancelAtPeriodEnd: false,
            portalUrl: profileData.subscription_id ? '/customer-portal' : null,
            plan: isTrial ? 'Trial' : 'Pro',
            trialEnd: isTrial ? expiryDate : null,
            isTrial: !!isTrial
          } as SubscriptionDetails;
        }
        
        // Set a quick timeout for edge function call
        const subscriptionPromise = getSubscriptionDetails(user.id);
        const timeoutPromise = new Promise<null>((_, reject) => {
          setTimeout(() => {
            if (documentVisibleRef.current) {
              reject(new Error('Przekroczono czas oczekiwania na dane subskrypcji'));
            } else {
              // If tab is not visible, resolve with null instead of rejecting
              console.log('[SubscriptionModal] Tab not visible during timeout, not showing error');
              reject(new Error('Tab not visible'));
            }
          }, 5000); // 5 second timeout for the edge function
        });
        
        // Race between subscription data fetch and timeout
        const subscriptionData = await Promise.race([
          subscriptionPromise,
          timeoutPromise
        ]);
        
        if (!subscriptionData) {
          console.log('[SubscriptionModal] No subscription data returned from API');
          
          // If timeout occurred but user has premium, use fallback data
          if (isPremium) {
            console.log('[SubscriptionModal] User has premium, using fallback data');
            
            // Check if the user is in trial mode
            const profileData = await checkPremiumDirectly(user.id);
            const isTrial = profileData && (
              profileData.trial_started_at !== null || 
              profileData.subscription_status === 'trialing'
            );
            
            return getFallbackSubscriptionData(!!isTrial);
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
        
        // Make sure portal URL is available
        if (!subscriptionData.portalUrl && subscriptionData.subscriptionId) {
          subscriptionData.portalUrl = '/customer-portal';
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
        
        // If the user is in trial mode, set daysUntilRenewal to 3 days or less
        if (subscriptionData.isTrial && subscriptionData.daysUntilRenewal > 3) {
          console.log('[SubscriptionModal] Correcting trial days calculation to max 3 days');
          subscriptionData.daysUntilRenewal = Math.min(3, subscriptionData.daysUntilRenewal);
          
          // Also update the currentPeriodEnd to match 3 days from now
          const trialEnd = new Date();
          trialEnd.setDate(trialEnd.getDate() + subscriptionData.daysUntilRenewal);
          subscriptionData.currentPeriodEnd = trialEnd.toISOString();
          subscriptionData.trialEnd = trialEnd.toISOString();
        }
        
        return subscriptionData;
      } catch (err) {
        console.error('[SubscriptionModal] Error in subscription fetch:', err);
        
        // If this is because tab is not visible, don't show error
        if (err instanceof Error && err.message === 'Tab not visible') {
          console.log('[SubscriptionModal] Error due to tab not being visible, returning last data');
          return data || (isPremium ? getFallbackSubscriptionData() : null);
        }
        
        if (isPremium) {
          console.log('[SubscriptionModal] Creating fallback subscription for premium user');
          
          // Create a fallback subscription object for users with premium status
          // but no subscription details (e.g. trial users)
          
          // Check if we can get profile details
          try {
            const profile = await checkPremiumDirectly(user.id);
              
            if (profile && profile.is_premium === true) {
              // Check if user is in trial mode
              const isTrial = profile && (
                profile.trial_started_at !== null || 
                profile.subscription_status === 'trialing'
              );
                           
              // Verify expiry date
              let currentExpiryDate;
              if (isTrial) {
                currentExpiryDate = profile.subscription_expiry || 
                                    getTrialExpiryDate(profile.trial_started_at || null);
              } else {
                currentExpiryDate = profile.subscription_expiry || getDefaultExpiryDate();
              }
              
              // Calculate days until expiry
              const daysUntil = isTrial ? 
                Math.min(3, calculateDaysUntilRenewal(currentExpiryDate)) : 
                calculateDaysUntilRenewal(currentExpiryDate);
              
              console.log('[SubscriptionModal] Created fallback subscription from profile data');
              
              return {
                hasSubscription: true,
                subscriptionId: profile.subscription_id || 'manual_premium',
                status: profile.subscription_status || (isTrial ? 'trialing' : 'active'),
                currentPeriodEnd: currentExpiryDate,
                daysUntilRenewal: Math.max(0, daysUntil),
                cancelAtPeriodEnd: false,
                portalUrl: profile.subscription_id ? '/customer-portal' : null,
                plan: isTrial ? 'Trial' : 'Pro',
                trialEnd: isTrial ? currentExpiryDate : null,
                isTrial: !!isTrial
              } as SubscriptionDetails;
            }
          } catch (profileErr) {
            console.error('[SubscriptionModal] Error fetching profile details:', profileErr);
          }
          
          // If we can't determine if the user is in trial mode, use a regular premium fallback
          return getFallbackSubscriptionData(false);
        }
        
        throw err;
      }
    },
    enabled: !!user?.id && open,
    retry: false, // Disable auto retry, we handle our own retries
    staleTime: 60000, // Cache data for 1 minute
  });

  // Refresh data when modal is opened
  useEffect(() => {
    if (open) {
      console.log('[SubscriptionModal] Modal opened, triggering data refresh');
      setTimeoutErrored(false);
      setTimeout(() => {
        setManualRefetch(prev => !prev);
      }, 100);
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
        
        // If we're using a relative URL, it means we need to generate a new portal URL
        if (data.portalUrl === '/customer-portal') {
          console.log('[SubscriptionModal] Creating new portal URL');
          // Create a portal session via edge function
          if (!user?.id) {
            toast.error('Musisz być zalogowany, aby zarządzać subskrypcją.');
            return;
          }
          
          toast.loading('Przygotowywanie portalu zarządzania subskrypcją...');
          
          // Call the edge function to get a customer portal URL
          supabase.functions.invoke('subscription-portal', {
            body: { userId: user.id }
          })
            .then(response => {
              toast.dismiss();
              if (response.error) {
                console.error('[SubscriptionModal] Error creating portal URL:', response.error);
                toast.error('Nie udało się utworzyć sesji portalu klienta', {
                  description: 'Spróbuj ponownie później lub skontaktuj się z obsługą.'
                });
                return;
              }
              
              const portalUrl = response.data?.url;
              if (portalUrl) {
                window.open(portalUrl, '_blank');
              } else {
                toast.error('Nie udało się utworzyć sesji portalu klienta');
              }
            })
            .catch(err => {
              toast.dismiss();
              console.error('[SubscriptionModal] Exception creating portal URL:', err);
              toast.error('Wystąpił błąd podczas tworzenia sesji portalu');
            });
          return;
        }
        
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
    if (retryCount >= maxRetries) {
      console.log('[SubscriptionModal] Max retries reached, using fallback data');
      if (isPremium) {
        // Just close modal and use fallback data
        return;
      }
    }
    
    console.log('[SubscriptionModal] Manual retry triggered');
    setTimeoutErrored(false);
    setRetryCount(count => count + 1);
    refetch();
  }, [refetch, retryCount, isPremium, maxRetries]);

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
