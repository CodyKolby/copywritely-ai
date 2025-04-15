
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useNavigate } from 'react-router-dom';

interface ErrorStateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPremium?: boolean;
  error: Error | null;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ 
  open, 
  onOpenChange, 
  isPremium, 
  error,
  onRetry
}) => {
  const navigate = useNavigate();
  const isTimeout = error?.message?.includes('czas oczekiwania') || false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-semibold text-red-600 flex items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Wystąpił błąd
          </DialogTitle>
        </DialogHeader>
        
        <DialogDescription className="text-center py-4">
          {isPremium ? (
            <>
              <p className="text-sm mb-4">
                Wykryliśmy, że masz aktywne konto Premium, ale wystąpił problem z pobraniem szczegółów Twojej subskrypcji.
              </p>
              <p className="text-sm font-medium mb-2">
                {isTimeout 
                  ? "Przekroczono czas oczekiwania na dane subskrypcji."
                  : "Możesz nadal korzystać z funkcji Premium, ale nie możemy wyświetlić szczegółów subskrypcji."}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm mb-4">
                {isTimeout 
                  ? "Przekroczono czas oczekiwania na dane subskrypcji."
                  : error?.message || "Nie udało się pobrać danych subskrypcji."}
              </p>
            </>
          )}
        </DialogDescription>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:justify-center">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Zamknij
          </Button>
          <Button 
            onClick={() => {
              if (onRetry) {
                onRetry();
              } else {
                onOpenChange(false);
                navigate(0); // Force refresh page
              }
            }} 
            variant="default" 
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {onRetry ? 'Spróbuj ponownie' : 'Odśwież stronę'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorState;
