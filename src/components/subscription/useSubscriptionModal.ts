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
  const lastSuccessDataRef = useRef<SubscriptionDetails | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      documentVisibleRef.current = document.visibilityState === 'visible';
      
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

  const isSubscriptionExpired = (expiryDateStr: string | null): boolean => {
    if (!expiryDateStr) return false;
    try {
      const expiryDate = new Date(expiryDateStr);
      return expiryDate <= new Date();
    } catch (e) {
      console.error('[SubscriptionModal] Error parsing expiry date', e);
      return false;
    }
  };

  useEffect(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (open) {
      console.log('[SubscriptionModal] Modal opened, starting timeout check');
      
      if (!lastSuccessDataRef.current || retryCount > 0) {
        setTimeoutErrored(false);
        timeoutRef.current = window.setTimeout(() => {
          if (documentVisibleRef.current && !lastSuccessDataRef.current) {
            setTimeoutErrored(true);
            console.log('[SubscriptionModal] Subscription data fetch timeout reached');
          } else {
            console.log('[SubscriptionModal] Timeout reached but using cached data or tab not visible');
          }
        }, 10000);
      }
    }
    
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [open, retryCount]);

  useEffect(() => {
    if (open && user?.id) {
      console.log('[SubscriptionModal] Modal opened, refreshing session');
      refreshSession().catch(err => {
        console.error('[SubscriptionModal] Error refreshing session:', err);
      });
    }
  }, [open, user?.id, refreshSession]);

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

  const getTrialExpiryDate = (trialStartDate: string | null) => {
    if (!trialStartDate) {
      const now = new Date();
      now.setDate(now.getDate() + 3);
      return now.toISOString();
    }
    
    const startDate = new Date(trialStartDate);
    startDate.setDate(startDate.getDate() + 3);
    return startDate.toISOString();
  };
  
  const getDefaultExpiryDate = () => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    return expiryDate.toISOString();
  };
  
  const calculateDaysUntilRenewal = (dateString: string) => {
    try {
      return Math.ceil((new Date(dateString).getTime() - Date.now()) / (1000 * 3600 * 24));
    } catch (e) {
      return 30;
    }
  };
  
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

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscriptionDetails', user?.id, manualRefetch, open, retryCount],
    queryFn: async () => {
      if (!user?.id) return null;

      try {
        console.log('[SubscriptionModal] Starting subscription data fetch for user:', user.id);
        
        if (timeoutErrored && retryCount >= maxRetries) {
          console.log('[SubscriptionModal] Timeout reached after max retries, using fallback or cached data');
          
          if (lastSuccessDataRef.current) {
            console.log('[SubscriptionModal] Using cached successful data');
            return lastSuccessDataRef.current;
          }
          
          if (isPremium) {
            const profileData = await checkPremiumDirectly(user.id);
            const isTrial = profileData && (
              profileData.trial_started_at !== null || 
              profileData.subscription_status === 'trialing'
            );
            
            const fallbackData = getFallbackSubscriptionData(!!isTrial);
            return fallbackData;
          }
          
          throw new Error('Przekroczono czas oczekiwania na dane subskrypcji');
        }

        const profileData = await checkPremiumDirectly(user.id);
        
        if (profileData && profileData.is_premium === true) {
          console.log('[SubscriptionModal] Creating fallback data from profile');
          
          const isTrial = profileData && (
            profileData.trial_started_at !== null || 
            profileData.subscription_status === 'trialing'
          );
            
          let expiryDate;
          if (isTrial) {
            expiryDate = profileData.subscription_expiry || 
                        getTrialExpiryDate(profileData.trial_started_at || null);
          } else {
            expiryDate = profileData.subscription_expiry || getDefaultExpiryDate();
          }
          
          const daysUntil = calculateDaysUntilRenewal(expiryDate);
          
          const subscriptionData = {
            hasSubscription: true,
            subscriptionId: profileData.subscription_id || 'manual_premium',
            status: profileData.subscription_status || (isTrial ? 'trialing' : 'active'),
            currentPeriodEnd: expiryDate,
            daysUntilRenewal: Math.max(0, daysUntil),
            cancelAtPeriodEnd: false,
            portalUrl: profileData.subscription_id ? '/customer-portal' : null,
            plan: isTrial ? 'Pro' : 'Pro',
            trialEnd: isTrial ? expiryDate : null,
            isTrial: !!isTrial
          } as SubscriptionDetails;
          
          lastSuccessDataRef.current = subscriptionData;
          
          if (subscriptionData && subscriptionData.currentPeriodEnd) {
            const expired = isSubscriptionExpired(subscriptionData.currentPeriodEnd);
            if (expired && subscriptionData.status !== 'canceled') {
              console.log('[SubscriptionModal] Subscription appears expired based on date check');
              subscriptionData.status = 'expired';
              subscriptionData.daysUntilRenewal = 0;
            }
          }
          
          return subscriptionData;
        }
        
        const subscriptionPromise = getSubscriptionDetails(user.id);
        const timeoutPromise = new Promise<null>((_, reject) => {
          setTimeout(() => {
            if (documentVisibleRef.current) {
              reject(new Error('Przekroczono czas oczekiwania na dane subskrypcji'));
            } else {
              reject(new Error('Tab not visible'));
            }
          }, 8000);
        });
        
        const subscriptionData = await Promise.race([
          subscriptionPromise,
          timeoutPromise
        ]);
        
        if (!subscriptionData) {
          console.log('[SubscriptionModal] No subscription data returned from API');
          
          if (isPremium) {
            console.log('[SubscriptionModal] User has premium, checking for cached data or creating fallback');
            
            if (lastSuccessDataRef.current) {
              return lastSuccessDataRef.current;
            }
            
            const profileData = await checkPremiumDirectly(user.id);
            const isTrial = profileData && (
              profileData.trial_started_at !== null || 
              profileData.subscription_status === 'trialing'
            );
            
            return getFallbackSubscriptionData(!!isTrial);
          }
          
          throw new Error('Nie udało się pobrać danych subskrypcji');
        }
        
        if (typeof subscriptionData.isTrial !== 'boolean') {
          subscriptionData.isTrial = subscriptionData.status === 'trialing';
        }
        
        if (!subscriptionData.trialEnd && subscriptionData.isTrial && subscriptionData.currentPeriodEnd) {
          subscriptionData.trialEnd = subscriptionData.currentPeriodEnd;
        }
        
        if (!subscriptionData.portalUrl && subscriptionData.subscriptionId) {
          subscriptionData.portalUrl = '/customer-portal';
        }
        
        if (subscriptionData.daysUntilRenewal <= 0 && subscriptionData.status !== 'trialing') {
          console.log('[SubscriptionModal] Subscription appears expired based on days calculation');
          
          if (profileData && profileData.is_premium === true) {
            console.log('[SubscriptionModal] DB says premium is active despite days calculation');
            
            const correctedDays = calculateDaysUntilRenewal(subscriptionData.currentPeriodEnd);
            subscriptionData.daysUntilRenewal = Math.max(1, correctedDays);
          } else {
            await refreshSession();
            throw new Error('Twoja subskrypcja wygasła');
          }
        }
        
        if (subscriptionData.isTrial && subscriptionData.daysUntilRenewal > 3) {
          console.log('[SubscriptionModal] Correcting trial days calculation to max 3 days');
          subscriptionData.daysUntilRenewal = Math.min(3, subscriptionData.daysUntilRenewal);
          
          const trialEnd = new Date();
          trialEnd.setDate(trialEnd.getDate() + subscriptionData.daysUntilRenewal);
          subscriptionData.currentPeriodEnd = trialEnd.toISOString();
          subscriptionData.trialEnd = trialEnd.toISOString();
        }
        
        lastSuccessDataRef.current = subscriptionData;
        
        return subscriptionData;
      } catch (err) {
        console.error('[SubscriptionModal] Error in subscription fetch:', err);
        
        if (err instanceof Error && err.message === 'Tab not visible') {
          console.log('[SubscriptionModal] Error due to tab not being visible, returning last data');
          
          if (lastSuccessDataRef.current) {
            return lastSuccessDataRef.current;
          }
          
          return data || (isPremium ? getFallbackSubscriptionData() : null);
        }
        
        if (isPremium) {
          console.log('[SubscriptionModal] Creating fallback subscription for premium user');
          
          if (lastSuccessDataRef.current) {
            return lastSuccessDataRef.current;
          }
          
          const profile = await checkPremiumDirectly(user.id);
              
          if (profile && profile.is_premium === true) {
            const isTrial = profile && (
              profile.trial_started_at !== null || 
              profile.subscription_status === 'trialing'
            );
                           
            let currentExpiryDate;
            if (isTrial) {
              currentExpiryDate = profile.subscription_expiry || 
                                    getTrialExpiryDate(profile.trial_started_at || null);
            } else {
              currentExpiryDate = profile.subscription_expiry || getDefaultExpiryDate();
            }
              
            const daysUntil = isTrial ? 
              Math.min(3, calculateDaysUntilRenewal(currentExpiryDate)) : 
              calculateDaysUntilRenewal(currentExpiryDate);
              
            console.log('[SubscriptionModal] Created fallback subscription from profile data');
              
            const fallbackData = {
              hasSubscription: true,
              subscriptionId: profile.subscription_id || 'manual_premium',
              status: profile.subscription_status || (isTrial ? 'trialing' : 'active'),
              currentPeriodEnd: currentExpiryDate,
              daysUntilRenewal: Math.max(0, daysUntil),
              cancelAtPeriodEnd: false,
              portalUrl: profile.subscription_id ? '/customer-portal' : null,
              plan: isTrial ? 'Pro' : 'Pro',
              trialEnd: isTrial ? currentExpiryDate : null,
              isTrial: !!isTrial
            } as SubscriptionDetails;
              
            lastSuccessDataRef.current = fallbackData;
              
            return fallbackData;
          }
        }
        
        throw err;
      }
    },
    enabled: !!user?.id && open,
    retry: false,
    staleTime: 60000,
    gcTime: 300000
  });

  useEffect(() => {
    if (open) {
      console.log('[SubscriptionModal] Modal opened, triggering data refresh');
      setTimeoutErrored(false);
      
      if (!lastSuccessDataRef.current) {
        setTimeout(() => {
          setManualRefetch(prev => !prev);
        }, 100);
      }
    }
  }, [open]);

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

  const handleOpenPortal = () => {
    try {
      if (data?.portalUrl) {
        console.log('[SubscriptionModal] Opening portal URL:', data.portalUrl);
        
        if (data.portalUrl === '/customer-portal') {
          console.log('[SubscriptionModal] Creating new portal URL');
          if (!user?.id) {
            toast.error('Musisz być zalogowany, aby zarządzać subskrypcją.');
            return;
          }
          
          toast.loading('Przygotowywanie portalu zarządzania subskrypcją...', {
            duration: 5000,
          });
          
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
                console.log('[SubscriptionModal] Redirecting to portal URL:', portalUrl);
                window.location.href = portalUrl;
              } else if (response.data?.error === 'Customer portal not configured') {
                toast.error('Portal klienta nie jest skonfigurowany', {
                  description: 'Administrator musi skonfigurować portal klienta w panelu Stripe.'
                });
                
                // Optional: redirect to configuration page for admins
                // window.open(response.data.url, '_blank');
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

  const handleRetry = useCallback(() => {
    if (retryCount >= maxRetries) {
      console.log('[SubscriptionModal] Max retries reached, using fallback data');
      if (isPremium) {
        return;
      }
    }
    
    console.log('[SubscriptionModal] Manual retry triggered');
    setTimeoutErrored(false);
    setRetryCount(count => count + 1);
    refetch();
  }, [refetch, retryCount, isPremium, maxRetries]);

  const isPremiumButNoData = isPremium && (!data || !data.hasSubscription);

  return {
    data: data || lastSuccessDataRef.current,
    isLoading: isLoading && !timeoutErrored && !lastSuccessDataRef.current,
    error: timeoutErrored && !lastSuccessDataRef.current ? new Error('Przekroczono czas oczekiwania na dane subskrypcji') : error,
    isPremiumButNoData: isPremiumButNoData && !lastSuccessDataRef.current,
    formatDate,
    renewSubscription,
    handleOpenPortal,
    fallbackData: getFallbackSubscriptionData(),
    refetch,
    timeoutErrored: timeoutErrored && !lastSuccessDataRef.current,
    handleRetry
  };
};
