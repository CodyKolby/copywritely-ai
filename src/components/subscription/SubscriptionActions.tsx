
import React from 'react';
import { Button } from "@/components/ui/button";
import { ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/posthog';

interface SubscriptionActionsProps {
  isTrial: boolean;
  cancelAtPeriodEnd?: boolean;
  portalUrl: string | null;
  onRenew: () => void;
  onOpenPortal: () => void;
}

const SubscriptionActions: React.FC<SubscriptionActionsProps> = ({
  isTrial,
  cancelAtPeriodEnd,
  portalUrl,
  onRenew,
  onOpenPortal
}) => {
  const handleManageSubscription = () => {
    trackEvent('subscription_portal_clicked');
    
    // Let the user know we're processing their request
    toast.loading('Łączenie z portalem zarządzania Stripe...', {
      duration: 2000,
    });
    
    onOpenPortal();
  };

  const handleRenewSubscription = () => {
    trackEvent('subscription_renew_clicked');
    onRenew();
  };

  const handleBuySubscription = () => {
    trackEvent('subscription_upgrade_clicked');
    window.location.href = '/pricing';
  };

  return (
    <div className="flex flex-col space-y-4 pt-2">
      {isTrial && (
        <div className="flex justify-center">
          <Button 
            onClick={handleBuySubscription} 
            className="flex items-center gap-2 rounded-lg px-6" 
            variant="default"
          >
            Wykup pełną subskrypcję
          </Button>
        </div>
      )}
      
      {cancelAtPeriodEnd && !isTrial && (
        <div className="flex justify-center">
          <Button 
            onClick={handleRenewSubscription} 
            className="flex items-center gap-2 rounded-lg px-6" 
            variant="default"
          >
            Odnów subskrypcję
          </Button>
        </div>
      )}
      
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
  );
};

export default SubscriptionActions;
