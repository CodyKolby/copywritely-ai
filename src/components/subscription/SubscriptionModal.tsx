import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  CalendarClock, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createCheckoutSession, PRICE_IDS } from '@/lib/stripe';
import { SubscriptionDetails, getSubscriptionDetails } from '@/lib/stripe/subscription';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ open, onOpenChange }) => {
  const { user, isPremium, refreshSession } = useAuth();
  const [manualRefetch, setManualRefetch] = useState(false);

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
          
          // Check if we can get profile details with trial information
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('trial_started_at, subscription_expiry')
              .eq('id', user.id)
              .single();
              
            if (profile?.subscription_expiry) {
              // Use the actual expiry date from the profile
              return {
                hasSubscription: true,
                subscriptionId: 'trial',
                status: 'active',
                currentPeriodEnd: profile.subscription_expiry,
                daysUntilRenewal: Math.ceil((new Date(profile.subscription_expiry).getTime() - Date.now()) / (1000 * 3600 * 24)),
                cancelAtPeriodEnd: false,
                portalUrl: null,
                plan: 'Trial',
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

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        setManualRefetch(prev => !prev);
      }, 300);
    }
  }, [open, isPremium]);

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

  const renderStatus = () => {
    if (!data) return null;
    
    const isActive = data.status === 'active' || data.status === 'trialing';
    const isTrial = data.isTrial === true;
    const isCanceled = data.cancelAtPeriodEnd;
    
    let statusText = 'Aktywna';
    let statusColor = 'bg-green-500';
    
    if (isActive && isTrial) {
      statusText = 'Okres próbny';
      statusColor = 'bg-blue-500';
    } else if (isActive && isCanceled) {
      statusText = 'Anulowana';
      statusColor = 'bg-yellow-500';
    } else if (!isActive) {
      statusText = 'Nieaktywna';
      statusColor = 'bg-red-500';
    }
    
    return (
      <div className="flex items-center gap-2 mb-2">
        <Badge className={`px-2 py-1 ${statusColor}`}>
          {statusText}
        </Badge>
      </div>
    );
  };

  const isPremiumButNoData = isPremium && (!data || !data.hasSubscription);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-semibold">Ładowanie danych subskrypcji...</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isPremiumButNoData || error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md p-6 rounded-xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-semibold">Sprawdzanie informacji o subskrypcji</DialogTitle>
            <DialogDescription className="mt-2">
              {isPremium 
                ? "Twoje konto ma status Premium, ale nie możemy pobrać szczegółowych informacji o subskrypcji."
                : "Nie znaleźliśmy aktywnej subskrypcji dla Twojego konta."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6 space-y-4">
            {isPremium 
              ? <AlertTriangle className="h-16 w-16 text-yellow-500" />
              : <XCircle className="h-16 w-16 text-red-500" />
            }
            <p className="text-center text-gray-700">
              {error
                ? "Wystąpił błąd podczas pobierania danych subskrypcji."
                : isPremium
                  ? "Spróbuj odświeżyć dane subskrypcji."
                  : "Uzyskaj dostęp do wszystkich funkcji poprzez zakup subskrypcji."
              }
            </p>
            
            {error && (
              <p className="text-sm text-red-500 text-center max-w-xs">
                Szczegóły błędu: {error instanceof Error ? error.message : String(error)}
              </p>
            )}
          </div>
          <DialogFooter className="flex justify-center gap-3 pt-4">
            <Button onClick={() => onOpenChange(false)} className="rounded-lg">Zamknij</Button>
            
            {!isPremium && (
              <Button onClick={() => window.location.href = '/pricing'} variant="default" className="rounded-lg">
                Zobacz plany
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (isPremium && (!data?.hasSubscription)) {
    const fallbackData = {
      hasSubscription: true,
      status: 'active',
      plan: 'Trial',
      daysUntilRenewal: 3,
      currentPeriodEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      portalUrl: null
    };
    
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="mx-auto max-w-md rounded-xl p-6">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-xl font-semibold">Twoja subskrypcja Premium</DialogTitle>
            <DialogDescription className="mt-2">
              Posiadasz aktywny okres próbny
            </DialogDescription>
          </DialogHeader>
          <Card className="border-none shadow-none">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Okres próbny</h3>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="px-2 py-1 bg-blue-500">
                    Okres próbny
                  </Badge>
                </div>
                
                <div className="flex items-center text-sm text-gray-600 gap-2">
                  <CalendarClock className="h-4 w-4" />
                  <span>
                    Koniec okresu próbnego: {formatDate(fallbackData.currentPeriodEnd)}
                  </span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600 gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {fallbackData.daysUntilRenewal} {fallbackData.daysUntilRenewal === 1 ? 'dzień' : 
                     fallbackData.daysUntilRenewal < 5 ? 'dni' : 'dni'} do końca
                  </span>
                </div>
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex justify-center">
                <Button 
                  onClick={() => window.location.href = '/pricing'} 
                  className="flex items-center gap-2 rounded-lg px-6" 
                  variant="default"
                >
                  Wykup pełną subskrypcję
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <DialogFooter className="flex justify-center pt-4">
            <Button onClick={() => onOpenChange(false)} className="rounded-lg">Zamknij</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (!data?.hasSubscription) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="mx-auto max-w-md rounded-xl p-6">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-xl font-semibold">Brak aktywnej subskrypcji</DialogTitle>
            <DialogDescription className="mt-2">
              Nie znaleźliśmy aktywnej subskrypcji dla Twojego konta.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6 space-y-4">
            <AlertTriangle className="h-16 w-16 text-yellow-500" />
            <p className="text-center text-gray-700">
              Uzyskaj dostęp do wszystkich funkcji poprzez zakup subskrypcji.
            </p>
          </div>
          <DialogFooter className="flex justify-center gap-3 pt-4">
            <Button onClick={() => onOpenChange(false)} className="rounded-lg">Zamknij</Button>
            <Button onClick={() => window.location.href = '/pricing'} variant="default" className="rounded-lg">
              Zobacz plany
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const isTrial = data.isTrial === true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-auto max-w-md rounded-xl p-6">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-xl font-semibold">Twoja subskrypcja</DialogTitle>
        </DialogHeader>
        
        <Card className="border-none shadow-none">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Plan {data.plan}</h3>
              </div>
              {renderStatus()}
              
              <div className="flex items-center text-sm text-gray-600 gap-2">
                <CalendarClock className="h-4 w-4" />
                <span>
                  {data.cancelAtPeriodEnd 
                    ? 'Aktywna do' 
                    : isTrial
                      ? 'Koniec okresu próbnego'
                      : 'Następne odnowienie'}: {formatDate(data.currentPeriodEnd)}
                </span>
              </div>
              
              {!data.cancelAtPeriodEnd && (
                <div className="flex items-center text-sm text-gray-600 gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {data.daysUntilRenewal} {data.daysUntilRenewal === 1 ? 'dzień' : 
                     data.daysUntilRenewal < 5 ? 'dni' : 'dni'} do {isTrial ? 'końca' : 'odnowienia'}
                  </span>
                </div>
              )}
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex flex-col space-y-4 pt-2">
              
              {isTrial && (
                <div className="flex justify-center">
                  <Button 
                    onClick={() => window.location.href = '/pricing'} 
                    className="flex items-center gap-2 rounded-lg px-6" 
                    variant="default"
                  >
                    Wykup pełną subskrypcję
                  </Button>
                </div>
              )}
              
              {data.cancelAtPeriodEnd && !isTrial && (
                <div className="flex justify-center">
                  <Button 
                    onClick={renewSubscription} 
                    className="flex items-center gap-2 rounded-lg px-6" 
                    variant="default"
                  >
                    Odnów subskrypcję
                  </Button>
                </div>
              )}
              
              {!isTrial && (
                <div className="flex justify-center">
                  <Button 
                    onClick={handleOpenPortal} 
                    className="flex items-center gap-2 rounded-lg px-6" 
                    variant="outline"
                    disabled={!data.portalUrl}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Zarządzaj subskrypcją w Stripe
                  </Button>
                </div>
              )}
            </div>
            
          </CardContent>
        </Card>
        
        <DialogFooter className="flex justify-center pt-4">
          <Button onClick={() => onOpenChange(false)} className="rounded-lg">Zamknij</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;
