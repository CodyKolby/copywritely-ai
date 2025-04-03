
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  CalendarClock, 
  CheckCircle, 
  CreditCard, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  RefreshCcw,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createCheckoutSession, PRICE_IDS } from '@/lib/stripe';

interface SubscriptionDetails {
  subscriptionId: string;
  status: string;
  currentPeriodEnd: string;
  daysUntilRenewal: number;
  cancelAtPeriodEnd: boolean;
  portalUrl: string;
  hasSubscription: boolean;
  plan: string;
  trialEnd: string | null;
}

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const [cancelConfirm, setCancelConfirm] = useState(false);

  // Pobieramy dane subskrypcji
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscriptionDetails', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase.functions.invoke('subscription-details', {
        body: { userId: user.id }
      });
      
      if (error) throw new Error(error.message);
      return data as SubscriptionDetails;
    },
    enabled: !!user?.id && open,
  });

  // Anulowanie subskrypcji
  const cancelSubscription = useMutation({
    mutationFn: async () => {
      if (!user?.id || !data?.subscriptionId) {
        throw new Error('Brak danych do anulowania subskrypcji');
      }
      
      const { data: cancelData, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { 
          userId: user.id,
          subscriptionId: data.subscriptionId
        }
      });
      
      if (error) throw new Error(error.message);
      return cancelData;
    },
    onSuccess: () => {
      toast.success('Subskrypcja została anulowana', {
        description: 'Twoja subskrypcja będzie aktywna do końca bieżącego okresu rozliczeniowego.'
      });
      setCancelConfirm(false);
      refetch();
    },
    onError: (error) => {
      toast.error('Błąd podczas anulowania subskrypcji', {
        description: error instanceof Error ? error.message : 'Spróbuj ponownie później.'
      });
      setCancelConfirm(false);
    }
  });

  // Odnowienie subskrypcji
  const renewSubscription = () => {
    // Używamy tej samej funkcji co przy zakupie nowej subskrypcji
    try {
      // Używamy bieżącego planu (miesięczny lub roczny)
      const priceId = data?.plan?.includes('roczn') ? PRICE_IDS.PRO_ANNUAL : PRICE_IDS.PRO_MONTHLY;
      createCheckoutSession(priceId);
    } catch (error) {
      toast.error('Błąd podczas odnowienia subskrypcji', {
        description: error instanceof Error ? error.message : 'Spróbuj ponownie później.'
      });
    }
  };

  // Funkcja formatująca datę
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Funkcja renderująca status
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

  if (error || !data?.hasSubscription) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Twoja subskrypcja</DialogTitle>
          <DialogDescription>
            Zarządzaj swoją subskrypcją Copywritely AI
          </DialogDescription>
        </DialogHeader>
        
        <Card className="border-none shadow-none">
          <CardContent className="p-0 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Plan {data.plan}</h3>
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
              ) : cancelConfirm ? (
                <div className="space-y-2">
                  <p className="text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Czy na pewno chcesz anulować subskrypcję? Będziesz mieć dostęp do końca opłaconego okresu.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setCancelConfirm(false)} 
                      variant="outline" 
                      className="flex-1"
                    >
                      Anuluj
                    </Button>
                    <Button 
                      onClick={() => cancelSubscription.mutate()} 
                      variant="destructive" 
                      className="flex-1"
                      disabled={cancelSubscription.isPending}
                    >
                      {cancelSubscription.isPending ? 'Anulowanie...' : 'Potwierdzam'}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={() => setCancelConfirm(true)} 
                  className="w-full flex items-center gap-2" 
                  variant="outline"
                >
                  <XCircle className="h-4 w-4" />
                  Anuluj subskrypcję
                </Button>
              )}
              
              <Button 
                onClick={() => window.open(data.portalUrl, '_blank')} 
                className="w-full flex items-center gap-2" 
                variant="outline"
              >
                <CreditCard className="h-4 w-4" />
                Zarządzaj płatnościami
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
            
            <Separator />
            
            <div className="pt-2">
              <h4 className="font-medium mb-2">Dostępne funkcje</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Nieograniczona liczba generowanych briefów</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Rozszerzone funkcje edytora tekstu</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Priorytetowe wsparcie techniczne</span>
                </li>
              </ul>
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
