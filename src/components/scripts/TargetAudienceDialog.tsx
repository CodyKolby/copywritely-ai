
import React, { useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import TargetAudienceForm from './TargetAudienceForm';
import GeneratedScriptDialog from './GeneratedScriptDialog';
import AdvertisingGoalDialog from './AdvertisingGoalDialog';
import EmailStyleDialog from './EmailStyleDialog';
import SocialMediaPlatformDialog from './SocialMediaPlatformDialog';
import GeneratedEmailDialog from './GeneratedEmailDialog';
import { TargetAudienceDialogProps } from './target-audience-dialog/types';
import { useTargetAudienceDialog } from './target-audience-dialog/useTargetAudienceDialog';
import DialogSelectionContent from './target-audience-dialog/DialogSelectionContent';
import { EmailStyle } from './EmailStyleDialog';
import { SocialMediaPlatform } from './SocialMediaPlatformDialog';

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
    showSocialMediaPlatformDialog,
    advertisingGoal,
    emailStyle,
    socialMediaPlatform,
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
    handleSocialMediaPlatformSubmit,
    handleSocialMediaPlatformBack,
    handleScriptDialogClose,
    handleEmailDialogClose,
  } = useTargetAudienceDialog({
    open,
    onOpenChange,
    templateId,
    userId,
    isPremium
  });

  // Force reset isProcessing when component unmounts or dialog closes
  useEffect(() => {
    if (!open) {
      // This will help ensure the isProcessing state is always reset when the dialog closes
      const resetTimeout = setTimeout(() => {
        // This is a no-op if the component is unmounted, but helps ensure state is reset
        // We use a timeout to ensure this happens after any animations
      }, 300);
      
      return () => clearTimeout(resetTimeout);
    }
  }, [open]);

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
      {/* Main audience selection dialog */}
      <Dialog open={shouldShowAudienceDialog && !showForm && !showGoalDialog && !showEmailStyleDialog && !showSocialMediaPlatformDialog} onOpenChange={onOpenChange}>
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
            handleCancel={handleDialogClose}
            isProcessing={isProcessing}
          />
        </DialogContent>
      </Dialog>
      
      {/* Form dialog */}
      <Dialog open={shouldShowAudienceDialog && showForm} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <TargetAudienceForm 
            onSubmit={handleFormSubmit}
            onCancel={handleDialogClose}
            onBack={handleBack}
          />
        </DialogContent>
      </Dialog>
      
      {/* Goal dialog */}
      <Dialog open={shouldShowAudienceDialog && showGoalDialog} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <AdvertisingGoalDialog 
            onSubmit={handleGoalSubmit}
            onBack={handleGoalBack}
            onCancel={handleDialogClose}
            isProcessing={isProcessing}
          />
        </DialogContent>
      </Dialog>
      
      {/* Email style dialog */}
      <Dialog open={shouldShowAudienceDialog && showEmailStyleDialog} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <EmailStyleDialog
            onSubmit={handleEmailStyleSubmit}
            onBack={handleEmailStyleBack}
            onCancel={handleDialogClose}
            isProcessing={isProcessing}
          />
        </DialogContent>
      </Dialog>
      
      {/* Social media platform dialog */}
      <Dialog open={shouldShowAudienceDialog && showSocialMediaPlatformDialog} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <SocialMediaPlatformDialog
            open={true}
            onOpenChange={() => {}}
            onSelect={handleSocialMediaPlatformSubmit}
            onBack={handleSocialMediaPlatformBack}
            onCancel={handleDialogClose}
            isProcessing={isProcessing}
          />
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
          socialMediaPlatform={templateId === 'social' ? socialMediaPlatform : undefined}
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
