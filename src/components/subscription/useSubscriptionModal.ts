
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

  // Fetch subscription data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscriptionDetails', user?.id, manualRefetch, open],
    queryFn: async () => {
      if (!user?.id) return null;

      try {
        const subscriptionData = await getSubscriptionDetails(user.id);
        
        if (!subscriptionData) {
          throw new Error('Nie udało się pobrać danych subskrypcji');
        }
        
        return subscriptionData;
      } catch (err) {
        if (isPremium) {
          // Create a fallback subscription object for users with premium status
          // but no subscription details (e.g. trial users)
          const expiryDate = new Date();
          
          // Check if we can get profile details
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('subscription_expiry')
              .eq('id', user.id)
              .single();
              
            if (profile && profile.subscription_expiry) {
              // Use the actual expiry date from the profile
              const subscriptionExpiry = profile.subscription_expiry;
              const daysUntil = Math.ceil((new Date(subscriptionExpiry).getTime() - Date.now()) / (1000 * 3600 * 24));
              
              return {
                hasSubscription: true,
                subscriptionId: 'trial',
                status: 'active',
                currentPeriodEnd: subscriptionExpiry,
                daysUntilRenewal: daysUntil,
                cancelAtPeriodEnd: false,
                portalUrl: null,
                plan: 'Trial',
                trialEnd: subscriptionExpiry,
                isTrial: true
              } as SubscriptionDetails;
            }
          } catch (profileErr) {
            console.error('Error fetching profile details:', profileErr);
          }
          
          // Default fallback to 3-day trial
          expiryDate.setDate(expiryDate.getDate() + 3);
          
          return {
            hasSubscription: true,
            subscriptionId: 'trial',
            status: 'active',
            currentPeriodEnd: expiryDate.toISOString(),
            daysUntilRenewal: 3,
            cancelAtPeriodEnd: false,
            portalUrl: null,
            plan: 'Trial',
            trialEnd: expiryDate.toISOString(),
            isTrial: true
          } as SubscriptionDetails;
        }
        throw err;
      }
    },
    enabled: !!user?.id && open,
    retry: 2,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 2,
  });

  // Refresh data when modal is opened
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        setManualRefetch(prev => !prev);
      }, 300);
    }
  }, [open, isPremium]);

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
    expiryDate.setDate(expiryDate.getDate() + 3);
    
    return {
      hasSubscription: true,
      status: 'active',
      plan: 'Trial',
      daysUntilRenewal: 3,
      currentPeriodEnd: expiryDate.toISOString(),
      portalUrl: null,
      trialEnd: expiryDate.toISOString()
    };
  };

  return {
    data,
    isLoading,
    error,
    isPremiumButNoData,
    formatDate,
    renewSubscription,
    handleOpenPortal,
    fallbackData: getFallbackData()
  };
};
