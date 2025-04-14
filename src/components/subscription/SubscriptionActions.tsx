
import React from 'react';
import { Button } from "@/components/ui/button";
import { ExternalLink } from 'lucide-react';

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
  return (
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
      
      {cancelAtPeriodEnd && !isTrial && (
        <div className="flex justify-center">
          <Button 
            onClick={onRenew} 
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
            onClick={onOpenPortal} 
            className="flex items-center gap-2 rounded-lg px-6" 
            variant="outline"
            disabled={!portalUrl}
          >
            <ExternalLink className="h-4 w-4" />
            Zarządzaj subskrypcją w Stripe
          </Button>
        </div>
      )}
    </div>
  );
};

export default SubscriptionActions;
