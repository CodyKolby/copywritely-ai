
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import TargetAudienceForm from './TargetAudienceForm';
import GeneratedScriptDialog from './GeneratedScriptDialog';
import AdvertisingGoalDialog from './AdvertisingGoalDialog';
import EmailStyleDialog from './EmailStyleDialog';
import GeneratedEmailDialog from './GeneratedEmailDialog';
import { TargetAudienceDialogProps } from './target-audience-dialog/types';
import { useTargetAudienceDialog } from './target-audience-dialog/useTargetAudienceDialog';
import DialogSelectionContent from './target-audience-dialog/DialogSelectionContent';
import { EmailStyle } from './EmailStyleDialog';

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
    showEmailDialog,
    showGoalDialog,
    showEmailStyleDialog,
    advertisingGoal,
    emailStyle,
    isProcessing,
    handleChoiceSelection,
    handleExistingAudienceSelect,
    handleContinue,
    handleCreateNewAudience,
    handleFormSubmit,
    handleBack,
    handleGoalSubmit,
    handleGoalBack,
    handleEmailStyleSubmit,
    handleEmailStyleBack,
    handleScriptDialogClose,
    handleEmailDialogClose,
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

  const handleEmailClose = () => {
    handleEmailDialogClose();
    onOpenChange(false);
  };

  // Hide the audience dialog when script/email dialog is shown
  const shouldShowAudienceDialog = open && !showScriptDialog && !showEmailDialog;

  return (
    <>
      <Dialog open={shouldShowAudienceDialog} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          {!showForm && !showGoalDialog && !showEmailStyleDialog ? (
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
              isProcessing={isProcessing}
            />
          ) : showGoalDialog ? (
            <AdvertisingGoalDialog 
              onSubmit={handleGoalSubmit}
              onBack={handleGoalBack}
              onCancel={handleDialogClose}
              isProcessing={isProcessing}
            />
          ) : showEmailStyleDialog ? (
            <EmailStyleDialog
              onSubmit={handleEmailStyleSubmit}
              onBack={handleEmailStyleBack}
              onCancel={handleDialogClose}
              isProcessing={isProcessing}
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
      
      {/* Script Dialog - shown for non-email templates */}
      {templateId !== 'email' && (
        <GeneratedScriptDialog
          open={showScriptDialog}
          onOpenChange={handleScriptClose}
          targetAudienceId={selectedAudienceId || ''}
          templateId={templateId}
          advertisingGoal={advertisingGoal}
        />
      )}

      {/* Email Dialog - shown only for email template */}
      {templateId === 'email' && (
        <GeneratedEmailDialog
          open={showEmailDialog}
          onOpenChange={handleEmailClose}
          targetAudienceId={selectedAudienceId || ''}
          templateId={templateId}
          advertisingGoal={advertisingGoal}
          emailStyle={emailStyle as EmailStyle}
        />
      )}
    </>
  );
};

export default TargetAudienceDialog;
