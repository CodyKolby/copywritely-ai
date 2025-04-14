
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
  RefreshCcw,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createCheckoutSession, PRICE_IDS } from '@/lib/stripe';
import { SubscriptionDetails, getSubscriptionDetails } from '@/lib/stripe/subscription';

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
          return {
            hasSubscription: true,
            subscriptionId: 'manual_premium',
            status: 'active',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            daysUntilRenewal: 30,
            cancelAtPeriodEnd: false,
            portalUrl: null,
            plan: 'Pro',
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

  const handleManualRefresh = async () => {
    console.log('Manual refresh triggered');
    
    await refreshSession();
    
    setManualRefetch(prev => !prev);
    toast.info('Odświeżanie informacji o subskrypcji...');
  };

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
    const isCanceled = data.cancelAtPeriodEnd;
    
    return (
      <div className="flex items-center gap-2 mb-2">
        <Badge className={`px-2 py-1 ${
          isActive && !isCanceled ? 'bg-green-500' : 
          isActive && isCanceled ? 'bg-yellow-500' : 
          'bg-red-500'
        }`}>
          {isActive && !isCanceled ? 'Aktywna' : 
           isActive && isCanceled ? 'Anulowana' : 
           'Nieaktywna'}
        </Badge>
      </div>
    );
  };

  const isPremiumButNoData = isPremium && (!data || !data.hasSubscription);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ładowanie danych subskrypcji...</DialogTitle>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sprawdzanie informacji o subskrypcji</DialogTitle>
            <DialogDescription>
              {isPremium 
                ? "Twoje konto ma status Premium, ale nie możemy pobrać szczegółowych informacji o subskrypcji."
                : "Nie znaleźliśmy aktywnej subskrypcji dla Twojego konta."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4 space-y-4">
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
          <DialogFooter className="flex justify-center sm:justify-center space-x-2">
            {isPremium && (
              <Button 
                onClick={handleManualRefresh} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Odśwież dane
              </Button>
            )}
            
            <Button onClick={() => onOpenChange(false)}>Zamknij</Button>
            
            {!isPremium && (
              <Button onClick={() => window.location.href = '/pricing'} variant="default">
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
      plan: 'Pro',
      daysUntilRenewal: 30,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      portalUrl: null
    };
    
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="mx-auto max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle>Twoja subskrypcja Premium</DialogTitle>
            <DialogDescription>
              Posiadasz aktywną subskrypcję Premium
            </DialogDescription>
          </DialogHeader>
          <Card className="border-none shadow-none">
            <CardContent className="p-0 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Plan {fallbackData.plan}</h3>
                  <Button 
                    onClick={handleManualRefresh} 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    <span className="sr-only">Odśwież</span>
                  </Button>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="px-2 py-1 bg-green-500">
                    Aktywna
                  </Badge>
                </div>
                
                <div className="flex items-center text-sm text-gray-600 gap-2">
                  <CalendarClock className="h-4 w-4" />
                  <span>
                    Następne odnowienie: {formatDate(fallbackData.currentPeriodEnd)}
                  </span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600 gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {fallbackData.daysUntilRenewal} {fallbackData.daysUntilRenewal === 1 ? 'dzień' : 
                     fallbackData.daysUntilRenewal < 5 ? 'dni' : 'dni'} do odnowienia
                  </span>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex flex-col space-y-3">
                <h4 className="font-medium">Dostępne akcje</h4>
                <Button 
                  onClick={handleManualRefresh} 
                  className="w-full flex items-center gap-2" 
                  variant="outline"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Odśwież dane subskrypcji
                </Button>
              </div>
              
              
            </CardContent>
          </Card>
          
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => onOpenChange(false)}>Zamknij</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (!data?.hasSubscription) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="mx-auto max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle>Brak aktywnej subskrypcji</DialogTitle>
            <DialogDescription>
              Nie znaleźliśmy aktywnej subskrypcji dla Twojego konta.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4 space-y-4">
            <AlertTriangle className="h-16 w-16 text-yellow-500" />
            <p className="text-center text-gray-700">
              Uzyskaj dostęp do wszystkich funkcji poprzez zakup subskrypcji.
            </p>
          </div>
          <DialogFooter className="flex justify-center sm:justify-center">
            <Button onClick={() => onOpenChange(false)}>Zamknij</Button>
            <Button onClick={() => window.location.href = '/pricing'} variant="default">
              Zobacz plany
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-auto max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle>Twoja subskrypcja</DialogTitle>
        </DialogHeader>
        
        <Card className="border-none shadow-none">
          <CardContent className="p-0 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Plan {data.plan}</h3>
                <Button 
                  onClick={handleManualRefresh} 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                >
                  <RefreshCcw className="h-4 w-4" />
                  <span className="sr-only">Odśwież</span>
                </Button>
              </div>
              {renderStatus()}
              
              <div className="flex items-center text-sm text-gray-600 gap-2">
                <CalendarClock className="h-4 w-4" />
                <span>
                  {data.cancelAtPeriodEnd 
                    ? 'Aktywna do' 
                    : 'Następne odnowienie'}: {formatDate(data.currentPeriodEnd)}
                </span>
              </div>
              
              {!data.cancelAtPeriodEnd && (
                <div className="flex items-center text-sm text-gray-600 gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {data.daysUntilRenewal} {data.daysUntilRenewal === 1 ? 'dzień' : 
                     data.daysUntilRenewal < 5 ? 'dni' : 'dni'} do odnowienia
                  </span>
                </div>
              )}
            </div>
            
            <Separator />
            
            <div className="flex flex-col space-y-3">
              <h4 className="font-medium">Dostępne akcje</h4>
              
              {data.cancelAtPeriodEnd ? (
                <Button 
                  onClick={renewSubscription} 
                  className="w-full flex items-center gap-2" 
                  variant="default"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Odnów subskrypcję
                </Button>
              ) : null }
              
              <Button 
                onClick={handleOpenPortal} 
                className="w-full flex items-center gap-2" 
                variant="outline"
                disabled={!data.portalUrl}
              >
                <ExternalLink className="h-4 w-4" />
                Zarządzaj subskrypcją w Stripe
              </Button>
              
              <Button 
                onClick={handleManualRefresh}
                className="w-full flex items-center gap-2" 
                variant="outline"
              >
                <RefreshCcw className="h-4 w-4" />
                Odśwież dane subskrypcji
              </Button>
            </div>
            
            
          </CardContent>
        </Card>
        
        <DialogFooter className="sm:justify-center">
          <Button onClick={() => onOpenChange(false)}>Zamknij</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;
