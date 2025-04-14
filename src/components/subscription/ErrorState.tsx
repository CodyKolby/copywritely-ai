
import React from 'react';
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, XCircle } from 'lucide-react';
import SubscriptionModalHeader from './SubscriptionModalHeader';

interface ErrorStateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPremium: boolean;
  error: Error | unknown;
}

const ErrorState: React.FC<ErrorStateProps> = ({ open, onOpenChange, isPremium, error }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 rounded-xl">
        <SubscriptionModalHeader 
          title="Sprawdzanie informacji o subskrypcji"
          description={isPremium 
            ? "Twoje konto ma status Premium, ale nie możemy pobrać szczegółowych informacji o subskrypcji."
            : "Nie znaleźliśmy aktywnej subskrypcji dla Twojego konta."
          }
        />
        
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
};

export default ErrorState;
