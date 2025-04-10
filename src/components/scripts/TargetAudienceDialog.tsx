
import React, { useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import TargetAudienceForm from './TargetAudienceForm';
import GeneratedScriptDialog from './GeneratedScriptDialog';
import AdvertisingGoalDialog from './AdvertisingGoalDialog';
import EmailStyleDialog from './EmailStyleDialog';
import SocialMediaPlatformDialog from './SocialMediaPlatformDialog';
import GeneratedEmailDialog from './GeneratedEmailDialog';
import GeneratedSocialDialog from './GeneratedSocialDialog';
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
  console.log("TargetAudienceDialog rendering with templateId:", templateId);

  const {
    isLoading,
    showForm,
    audienceChoice,
    selectedAudienceId,
    existingAudiences,
    showScriptDialog,
    showEmailDialog,
    showSocialDialog,
    showGoalDialog,
    showEmailStyleDialog,
    showSocialMediaPlatformDialog,
    advertisingGoal,
    emailStyle,
    socialMediaPlatform,
    isProcessing,
    isTransitioning,
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
    handleSocialDialogClose,
    resetState,
  } = useTargetAudienceDialog({
    open,
    onOpenChange,
    templateId,
    userId,
    isPremium
  });

  // Force reset isProcessing when component unmounts or dialog closes
  useEffect(() => {
    // Resetuj stan, gdy dialog się zamyka
    if (!open) {
      console.log("Dialog jest zamknięty - resetuję stan");
      resetState();
      
      // Dodatkowe zabezpieczenie - reset po animacji zamknięcia
      const resetTimeout = setTimeout(() => {
        console.log("Wykonuję opóźniony reset stanu dialogu");
        resetState();
      }, 300);
      
      return () => clearTimeout(resetTimeout);
    }
  }, [open, resetState]);

  // Dodatkowy efekt, który sprawdza, czy dialog powinien być otwarty
  useEffect(() => {
    console.log("Stan dialogu:", {
      open,
      showForm,
      showGoalDialog,
      showEmailStyleDialog, 
      showSocialMediaPlatformDialog,
      showScriptDialog,
      showEmailDialog,
      showSocialDialog,
      isProcessing,
      isTransitioning
    });
  }, [open, showForm, showGoalDialog, showEmailStyleDialog, showSocialMediaPlatformDialog, 
      showScriptDialog, showEmailDialog, showSocialDialog, isProcessing, isTransitioning]);

  const handleDialogClose = () => {
    console.log("handleDialogClose wywołane - zamykanie dialogu");
    resetState(); // Resetuj wszystkie stany
    onOpenChange(false);
  };

  const handleScriptClose = () => {
    console.log("handleScriptClose wywołane");
    handleScriptDialogClose();
    resetState(); // Pełny reset stanu
    onOpenChange(false);
  };

  const handleEmailClose = () => {
    console.log("handleEmailClose wywołane");
    handleEmailDialogClose();
    resetState(); // Pełny reset stanu
    onOpenChange(false);
  };

  const handleSocialClose = () => {
    console.log("handleSocialClose wywołane");
    handleSocialDialogClose();
    resetState(); // Pełny reset stanu
    onOpenChange(false);
  };

  // Hide the audience dialog when script/email/social dialog is shown or transitioning
  const shouldShowAudienceDialog = open && !showScriptDialog && !showEmailDialog && !showSocialDialog && !isTransitioning;
  
  // Prevent display of multiple dialogs simultaneously
  const showMainDialog = shouldShowAudienceDialog && !showForm && !showGoalDialog && !showEmailStyleDialog && !showSocialMediaPlatformDialog;
  const showFormDialog = shouldShowAudienceDialog && showForm && !isTransitioning;
  const showGoalDialogUi = shouldShowAudienceDialog && showGoalDialog && !isTransitioning;
  const showEmailStyleDialogUi = shouldShowAudienceDialog && showEmailStyleDialog && !isTransitioning;
  const showSocialMediaDialogUi = shouldShowAudienceDialog && showSocialMediaPlatformDialog && !isTransitioning;

  useEffect(() => {
    // Debug social dialog conditions
    if (templateId === 'social') {
      console.log('Social Dialog Debug:', { 
        showSocialDialog,
        socialMediaPlatform,
        hasTargetAudience: !!selectedAudienceId,
        advertisingGoal
      });
    }
  }, [templateId, showSocialDialog, socialMediaPlatform, selectedAudienceId, advertisingGoal]);

  return (
    <>
      {/* Main audience selection dialog */}
      <Dialog 
        open={showMainDialog} 
        onOpenChange={handleDialogClose}
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
            handleCancel={handleDialogClose}
            isProcessing={isProcessing}
          />
        </DialogContent>
      </Dialog>
      
      {/* Form dialog */}
      <Dialog 
        open={showFormDialog} 
        onOpenChange={handleDialogClose}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <TargetAudienceForm 
            onSubmit={handleFormSubmit}
            onCancel={handleDialogClose}
            onBack={handleBack}
          />
        </DialogContent>
      </Dialog>
      
      {/* Goal dialog */}
      <Dialog 
        open={showGoalDialogUi} 
        onOpenChange={handleDialogClose}
      >
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
      <Dialog 
        open={showEmailStyleDialogUi} 
        onOpenChange={handleDialogClose}
      >
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
      <Dialog 
        open={showSocialMediaDialogUi} 
        onOpenChange={handleDialogClose}
      >
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
      
      {/* Script Dialog - shown for ad templates */}
      {templateId === 'ad' && (
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
      
      {/* Social Dialog - shown only for social template */}
      {templateId === 'social' && (
        <GeneratedSocialDialog
          open={showSocialDialog}
          onOpenChange={handleSocialClose}
          targetAudienceId={selectedAudienceId || ''}
          templateId={templateId}
          advertisingGoal={advertisingGoal}
          platform={socialMediaPlatform}
        />
      )}
    </>
  );
};

export default TargetAudienceDialog;
