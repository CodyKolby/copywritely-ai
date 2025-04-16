
import React from 'react';
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trackEvent } from '@/lib/posthog';
import SubscriptionModalHeader from './SubscriptionModalHeader';
import SubscriptionDetails from './SubscriptionDetails';
import SubscriptionActions from './SubscriptionActions';
import { SubscriptionDetails as SubscriptionDetailsType } from '@/lib/stripe/subscription';

interface PremiumSubscriptionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: SubscriptionDetailsType;
  formatDate: (date: string) => string;
  onRenew: () => void;
  onOpenPortal: () => void;
}

const PremiumSubscription: React.FC<PremiumSubscriptionProps> = ({
  open,
  onOpenChange,
  data,
  formatDate,
  onRenew,
  onOpenPortal
}) => {
  // Ensure isTrial is properly set
  const isTrial = data.isTrial === true || data.status === 'trialing';
  
  const handleClose = () => {
    trackEvent('premium_subscription_modal_closed');
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-auto max-w-md rounded-xl p-6">
        <SubscriptionModalHeader title="Twoja subskrypcja" />
        
        <Card className="border-none shadow-none">
          <CardContent className="p-4 space-y-4">
            <SubscriptionDetails data={data} formatDate={formatDate} />
            
            <SubscriptionActions 
              isTrial={isTrial}
              cancelAtPeriodEnd={data.cancelAtPeriodEnd}
              portalUrl={data.portalUrl}
              onRenew={onRenew}
              onOpenPortal={onOpenPortal}
            />
          </CardContent>
        </Card>
        
        <DialogFooter className="flex justify-center pt-4">
          <Button onClick={handleClose} className="rounded-lg">Zamknij</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumSubscription;
