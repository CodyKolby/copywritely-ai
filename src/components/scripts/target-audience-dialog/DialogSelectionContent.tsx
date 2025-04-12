
import React from 'react';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
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
}: DialogSelectionContentProps) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold mb-2">
          Wybierz grupę docelową dla której chcesz stworzyć skrypt
        </DialogTitle>
        <DialogDescription className="text-base">
          Wybierz jedną z istniejących grup docelowych lub stwórz nową, aby dostosować skrypt do Twoich potrzeb.
        </DialogDescription>
      </DialogHeader>
      
      {!isPremium ? (
        <PremiumAlert onCancel={handleCancel} />
      ) : (
        <div className="py-4 px-4">
          <ExistingAudiencesList
            isLoading={isLoading}
            existingAudiences={existingAudiences}
            selectedAudienceId={selectedAudienceId}
            handleExistingAudienceSelect={handleExistingAudienceSelect}
            handleChoiceSelection={handleChoiceSelection}
            handleCreateNewAudience={handleCreateNewAudience}
          />
          
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
