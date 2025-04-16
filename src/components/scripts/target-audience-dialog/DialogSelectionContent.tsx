
import React from 'react';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import ExistingAudiencesList from './ExistingAudiencesList';
import PremiumAlert from './PremiumAlert';
import { TargetAudience } from './types';

interface DialogSelectionContentProps {
  isPremium: boolean;
  isLoading: boolean;
  existingAudiences: TargetAudience[];
  selectedAudienceId: string | null;
  audienceChoice: string | null;
  isProcessing: boolean;
  handleExistingAudienceSelect: (audienceId: string) => void;
  handleChoiceSelection: (choice: string) => void;
  handleCreateNewAudience: () => void;
  handleContinue: () => void;
  handleCancel: () => void;
  handleDeleteAudience?: (audienceId: string) => void;
  manualRefresh?: () => void;
  hasError?: boolean;
  isEmpty?: boolean;
}

const DialogSelectionContent = ({
  isPremium,
  isLoading,
  existingAudiences,
  selectedAudienceId,
  audienceChoice,
  isProcessing,
  handleExistingAudienceSelect,
  handleChoiceSelection,
  handleCreateNewAudience,
  handleContinue,
  handleCancel,
  handleDeleteAudience,
  manualRefresh,
  hasError = false,
  isEmpty = false,
}: DialogSelectionContentProps) => {
  return (
    <>
      <DialogHeader>
        <div className="flex items-center justify-between">
          <DialogTitle className="text-2xl font-bold mb-2">
            Wybierz grupę docelową dla której chcesz stworzyć skrypt
          </DialogTitle>
          
          {manualRefresh && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => manualRefresh()}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="sr-only">Odśwież</span>
            </Button>
          )}
        </div>
        <DialogDescription className="text-base">
          Wybierz jedną z istniejących grup docelowych lub stwórz nową, aby dostosować skrypt do Twoich potrzeb.
        </DialogDescription>
      </DialogHeader>
      
      {!isPremium ? (
        <PremiumAlert onCancel={handleCancel} />
      ) : (
        <div className="py-4 px-4">
          {hasError && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
              <p>Wystąpił problem podczas pobierania grup docelowych. 
                {manualRefresh && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => manualRefresh()}
                    className="text-amber-800 underline p-0 h-auto font-normal"
                  >
                    Kliknij tutaj, aby spróbować ponownie.
                  </Button>
                )}
              </p>
            </div>
          )}
          
          <ExistingAudiencesList
            isLoading={isLoading}
            existingAudiences={existingAudiences}
            selectedAudienceId={selectedAudienceId}
            handleExistingAudienceSelect={handleExistingAudienceSelect}
            handleChoiceSelection={handleChoiceSelection}
            handleCreateNewAudience={handleCreateNewAudience}
            handleDeleteAudience={handleDeleteAudience}
          />
          
          {isEmpty && !isLoading && !hasError && (
            <div className="my-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">
              <p>Nie masz jeszcze żadnych zapisanych grup docelowych. Utwórz swoją pierwszą grupę docelową, 
              aby móc generować spersonalizowane skrypty.</p>
            </div>
          )}
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={handleCancel} className="rounded-full border-2 font-medium px-6">
              Anuluj
            </Button>
            <Button 
              onClick={handleContinue}
              disabled={!audienceChoice || isProcessing}
              className="bg-copywrite-teal hover:bg-copywrite-teal-dark text-white rounded-full px-6 font-medium"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Przetwarzanie...
                </>
              ) : (
                'Dalej'
              )}
            </Button>
          </DialogFooter>
        </div>
      )}
    </>
  );
};

export default DialogSelectionContent;
