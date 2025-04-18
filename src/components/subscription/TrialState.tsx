
import React from 'react';
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Clock, ExternalLink } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import SubscriptionModalHeader from './SubscriptionModalHeader';
import { trackEvent } from '@/lib/posthog';

interface TrialStateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formatDate: (date: string) => string;
  expiryDate: string;
  daysRemaining: number;
  onOpenPortal: () => void;
}

const TrialState: React.FC<TrialStateProps> = ({ 
  open, 
  onOpenChange, 
  formatDate, 
  expiryDate, 
  daysRemaining,
  onOpenPortal
}) => {
  // Make sure days remaining is never negative
  const displayDays = Math.max(0, daysRemaining);
  
  // Helper for Polish plurality
  const getDayText = (days: number) => {
    if (days === 1) return 'dzień';
    if (days % 10 >= 2 && days % 10 <= 4 && (days % 100 < 10 || days % 100 >= 20)) return 'dni';
    return 'dni';
  };

  const handleBuySubscription = () => {
    trackEvent('trial_upgrade_clicked');
    window.location.href = '/pricing';
  };
  
  const handleManageSubscription = () => {
    trackEvent('subscription_portal_clicked');
    onOpenPortal();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-auto max-w-md rounded-xl p-6">
        <SubscriptionModalHeader 
          title="Twoja subskrypcja Premium"
          description="Posiadasz aktywny okres próbny"
        />
        
        <Card className="border-none shadow-none">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Plan Pro</h3>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="px-2 py-1 bg-blue-500">
                  Okres próbny
                </Badge>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 gap-2">
                <CalendarClock className="h-4 w-4" />
                <span>
                  Koniec okresu próbnego: {formatDate(expiryDate)}
                </span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {displayDays} {getDayText(displayDays)} do końca
                </span>
              </div>
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex flex-col space-y-4">
              <div className="flex justify-center">
                <Button 
                  onClick={handleBuySubscription} 
                  className="flex items-center gap-2 rounded-lg px-6" 
                  variant="default"
                >
                  Wykup pełną subskrypcję
                </Button>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={handleManageSubscription} 
                  className="flex items-center gap-2 rounded-lg px-6" 
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Zarządzaj subskrypcją w Stripe
                </Button>
              </div>
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

export default TrialState;
