
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import TargetAudienceForm from './TargetAudienceForm';
import GeneratedScriptDialog from './GeneratedScriptDialog';
import AdvertisingGoalDialog from './AdvertisingGoalDialog';
import { TargetAudienceDialogProps } from './target-audience-dialog/types';
import { useTargetAudienceDialog } from './target-audience-dialog/useTargetAudienceDialog';
import DialogSelectionContent from './target-audience-dialog/DialogSelectionContent';

const TargetAudienceDialog = ({
  open,
  onOpenChange,
  templateId,
  userId,
  isPremium,
}: TargetAudienceDialogProps) => {
  const {
    isLoading,
    showForm,
    audienceChoice,
    selectedAudienceId,
    existingAudiences,
    showScriptDialog,
    showGoalDialog,
    advertisingGoal,
    handleChoiceSelection,
    handleExistingAudienceSelect,
    handleContinue,
    handleCreateNewAudience,
    handleFormSubmit,
    handleBack,
    handleGoalSubmit,
    handleGoalBack,
    handleScriptDialogClose,
  } = useTargetAudienceDialog({
    open,
    onOpenChange,
    templateId,
    userId,
    isPremium
  });

  const handleDialogClose = () => {
    onOpenChange(false);
  };

  const handleScriptClose = () => {
    handleScriptDialogClose();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          {!showForm && !showGoalDialog ? (
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
              handleCancel={handleDialogClose}
            />
          ) : showGoalDialog ? (
            <AdvertisingGoalDialog 
              onSubmit={handleGoalSubmit}
              onBack={handleGoalBack}
              onCancel={handleDialogClose}
            />
          ) : (
            <TargetAudienceForm 
              onSubmit={handleFormSubmit}
              onCancel={handleDialogClose}
              onBack={handleBack}
            />
          )}
        </DialogContent>
      </Dialog>
      
      <GeneratedScriptDialog
        open={showScriptDialog}
        onOpenChange={handleScriptClose}
        targetAudienceId={selectedAudienceId || ''}
        templateId={templateId}
        advertisingGoal={advertisingGoal}
      />
    </>
  );
};

export default TargetAudienceDialog;
