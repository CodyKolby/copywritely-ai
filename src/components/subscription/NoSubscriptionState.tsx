
import React from 'react';
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from 'lucide-react';
import SubscriptionModalHeader from './SubscriptionModalHeader';

interface NoSubscriptionStateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NoSubscriptionState: React.FC<NoSubscriptionStateProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-auto max-w-md rounded-xl p-6">
        <SubscriptionModalHeader 
          title="Brak aktywnej subskrypcji"
          description="Nie znaleźliśmy aktywnej subskrypcji dla Twojego konta."
        />
        
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
};

export default NoSubscriptionState;
