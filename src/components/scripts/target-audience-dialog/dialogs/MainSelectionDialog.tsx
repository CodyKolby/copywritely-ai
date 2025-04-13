
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import DialogSelectionContent from '../DialogSelectionContent';
import { AudienceChoice, TargetAudience } from '../types';

interface MainSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPremium: boolean;
  isLoading: boolean;
  existingAudiences: TargetAudience[];
  selectedAudienceId: string | null;
  audienceChoice: AudienceChoice;
  isProcessing: boolean;
  handleExistingAudienceSelect: (audienceId: string) => void;
  handleChoiceSelection: (choice: string) => void;
  handleCreateNewAudience: () => void;
  handleContinue: () => void;
  handleCancel: () => void;
  handleDeleteAudience?: (audienceId: string) => void;
}

const MainSelectionDialog = ({
  open,
  onOpenChange,
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
}: MainSelectionDialogProps) => {
  return (
    <Dialog 
      open={open} 
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogSelectionContent
          isPremium={isPremium}
          isLoading={isLoading}
          existingAudiences={existingAudiences}
          selectedAudienceId={selectedAudienceId}
          audienceChoice={audienceChoice}
          handleExistingAudienceSelect={handleExistingAudienceSelect}
          handleChoiceSelection={handleChoiceSelection}
          handleCreateNewAudience={handleCreateNewAudience}
          handleContinue={handleContinue}
          handleCancel={handleCancel}
          isProcessing={isProcessing}
          handleDeleteAudience={handleDeleteAudience}
        />
      </DialogContent>
    </Dialog>
  );
};

export default MainSelectionDialog;
