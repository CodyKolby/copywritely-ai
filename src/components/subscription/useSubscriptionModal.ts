
import { useState, useEffect } from 'react';
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
      timeoutId = window.setTimeout(() => {
        setTimeoutErrored(true);
        console.log('Subscription data fetch timeout reached');
      }, 10000);
    }
    
    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [open]);

  // Fetch subscription data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscriptionDetails', user?.id, manualRefetch, open],
    queryFn: async () => {
      if (!user?.id) return null;

      try {
        // If we hit the timeout error, throw early to avoid waiting
        if (timeoutErrored) {
          throw new Error('Przekroczono czas oczekiwania na dane subskrypcji');
        }

        const subscriptionData = await getSubscriptionDetails(user.id);
        
        if (!subscriptionData) {
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
          // Force refresh of auth status since subscription has expired
          await refreshSession();
          throw new Error('Twoja subskrypcja wygasła');
        }
        
        return subscriptionData;
      } catch (err) {
        if (isPremium) {
          console.log('Creating fallback subscription for premium user');
          
          // Create a fallback subscription object for users with premium status
          // but no subscription details (e.g. trial users)
          
          // Check if we can get profile details
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('subscription_expiry, subscription_status, subscription_id')
              .eq('id', user.id)
              .single();
              
            if (profile) {
              // Verify expiry date
              let currentExpiryDate = profile.subscription_expiry;
              let isTrial = profile.subscription_status === 'trialing' || 
                         (!profile.subscription_id && profile.subscription_expiry);
              
              // If no expiry date, create one based on subscription type
              if (!currentExpiryDate) {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + (isTrial ? 3 : 30));
                currentExpiryDate = expiryDate.toISOString();
              }
              
              // Calculate days until expiry
              const daysUntil = Math.ceil((new Date(currentExpiryDate).getTime() - Date.now()) / (1000 * 3600 * 24));
              
              console.log('Created fallback subscription from profile data');
              
              return {
                hasSubscription: true,
                subscriptionId: profile.subscription_id || 'trial',
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
            console.error('Error fetching profile details:', profileErr);
          }
          
          // Default fallback
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);
          
          return {
            hasSubscription: true,
            subscriptionId: 'manual_premium',
            status: 'active',
            currentPeriodEnd: expiryDate.toISOString(),
            daysUntilRenewal: 30,
            cancelAtPeriodEnd: false,
            portalUrl: null,
            plan: 'Pro',
            trialEnd: null,
            isTrial: false
          } as SubscriptionDetails;
        }
        
        console.error('Error fetching subscription details:', err);
        throw err;
      }
    },
    enabled: !!user?.id && open,
    retry: timeoutErrored ? 0 : 2,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 2,
  });

  // Refresh data when modal is opened
  useEffect(() => {
    if (open) {
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
        console.log('Opening portal URL:', data.portalUrl);
        
        window.open(data.portalUrl, '_blank');
      } else {
        console.error('No portal URL available');
        toast.error('Nie udało się utworzyć sesji portalu klienta', {
          description: 'Spróbuj odświeżyć informacje o subskrypcji lub skontaktuj się z obsługą klienta.'
        });
      }
    } catch (err) {
      console.error('Error opening portal URL:', err);
      toast.error('Wystąpił błąd podczas otwierania portalu klienta');
    }
  };

  // Check if we have premium but no subscription data
  const isPremiumButNoData = isPremium && (!data || !data.hasSubscription);
  
  // Calculate fallback data for premium users without subscription data
  const getFallbackData = () => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    return {
      hasSubscription: true,
      subscriptionId: 'manual_premium',
      status: 'active',
      plan: 'Pro',
      daysUntilRenewal: 30,
      currentPeriodEnd: expiryDate.toISOString(),
      portalUrl: null,
      trialEnd: null,
      isTrial: false,
      cancelAtPeriodEnd: false
    };
  };

  return {
    data,
    isLoading: isLoading && !timeoutErrored,
    error: timeoutErrored ? new Error('Przekroczono czas oczekiwania na dane subskrypcji') : error,
    isPremiumButNoData,
    formatDate,
    renewSubscription,
    handleOpenPortal,
    fallbackData: getFallbackData(),
    refetch,
    timeoutErrored
  };
};
