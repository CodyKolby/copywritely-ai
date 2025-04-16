
import React, { useEffect } from 'react';
import { TargetAudienceDialogProps } from './types';
import { useTargetAudienceDialog } from './hooks/useRefactoredTargetAudienceDialog';
import MainSelectionDialog from './dialogs/MainSelectionDialog';
import FormDialog from './dialogs/FormDialog';
import GoalDialog from './dialogs/GoalDialog';
import EmailStyleDialog from './dialogs/EmailStyleDialog';
import SocialMediaDialog from './dialogs/SocialMediaDialog';
import ResultDialogs from './dialogs/ResultDialogs';

/**
 * Main dialog manager component that orchestrates all dialogs
 * in the target audience workflow
 */
const DialogManager = ({
  open,
  onOpenChange,
  templateId,
  userId,
  isPremium,
}: TargetAudienceDialogProps) => {
  // Only log on template ID changes or when open state changes, not on every render
  useEffect(() => {
    if (templateId || open) {
      console.log("DialogManager rendering with templateId:", templateId);
    }
  }, [templateId, open]);

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
    handleDeleteAudience,
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
    if (!open) {
      console.log("Dialog is closed - resetting state");
      resetState();
      
      // Additional protection - reset after close animation
      const resetTimeout = setTimeout(() => {
        resetState();
      }, 300);
      
      return () => clearTimeout(resetTimeout);
    }
  }, [open, resetState]);

  const handleDialogClose = () => {
    resetState(); // Reset all states
    onOpenChange(false);
  };

  // Custom form submission handler to ensure we return to the selection screen after successful form submission
  const handleFormSubmitWrapped = async (values: any) => {
    try {
      console.log("Form submission wrapper in DialogManager");
      // Call the actual form submit handler
      const result = await handleFormSubmit(values);
      
      // After successful submission, close the form dialog and show the main selection dialog
      if (result) {
        console.log("Form submitted successfully in DialogManager, showing main selection");
      }
      
      return result;
    } catch (error) {
      console.error("Error in form submission wrapper:", error);
      throw error;
    }
  };

  // Hide the audience dialog when script/email dialog is shown
  const shouldShowAudienceDialog = open && !showScriptDialog && !showEmailDialog && !showSocialDialog;
  
  // Using explicit mutual exclusion for each dialog to prevent flickering
  const showMainDialog = shouldShowAudienceDialog && !showForm && !showGoalDialog && 
                         !showEmailStyleDialog && !showSocialMediaPlatformDialog;
  
  const showFormDialog = shouldShowAudienceDialog && showForm && 
                         !showGoalDialog && !showEmailStyleDialog && !showSocialMediaPlatformDialog;
                         
  const showGoalDialogUi = shouldShowAudienceDialog && showGoalDialog && 
                           !showForm && !showEmailStyleDialog && !showSocialMediaPlatformDialog;
                           
  const showEmailStyleDialogUi = shouldShowAudienceDialog && showEmailStyleDialog && 
                                 !showForm && !showGoalDialog && !showSocialMediaPlatformDialog;
                                 
  const showSocialMediaDialogUi = shouldShowAudienceDialog && showSocialMediaPlatformDialog && 
                                  !showForm && !showGoalDialog && !showEmailStyleDialog;

  return (
    <>
      {/* Main audience selection dialog */}
      <MainSelectionDialog 
        open={showMainDialog}
        onOpenChange={handleDialogClose}
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
        handleDeleteAudience={handleDeleteAudience}
      />
      
      {/* Form dialog */}
      <FormDialog
        open={showFormDialog}
        onOpenChange={handleDialogClose}
        onSubmit={handleFormSubmitWrapped}
        onBack={handleBack}
      />
      
      {/* Goal dialog */}
      <GoalDialog
        open={showGoalDialogUi}
        onOpenChange={handleDialogClose}
        onSubmit={handleGoalSubmit}
        onBack={handleGoalBack}
        isProcessing={isProcessing}
      />
      
      {/* Email style dialog */}
      <EmailStyleDialog
        open={showEmailStyleDialogUi}
        onOpenChange={handleDialogClose}
        onSubmit={handleEmailStyleSubmit}
        onBack={handleEmailStyleBack}
        isProcessing={isProcessing}
      />
      
      {/* Social media platform dialog */}
      <SocialMediaDialog
        open={showSocialMediaDialogUi}
        onOpenChange={handleDialogClose}
        onSubmit={handleSocialMediaPlatformSubmit}
        onBack={handleSocialMediaPlatformBack}
        isProcessing={isProcessing}
      />
      
      {/* Result dialogs (script, email, social) based on template type */}
      <ResultDialogs
        templateId={templateId}
        showScriptDialog={showScriptDialog}
        showEmailDialog={showEmailDialog}
        showSocialDialog={showSocialDialog}
        selectedAudienceId={selectedAudienceId}
        advertisingGoal={advertisingGoal}
        emailStyle={emailStyle}
        socialMediaPlatform={socialMediaPlatform}
        handleScriptDialogClose={handleScriptDialogClose}
        handleEmailDialogClose={handleEmailDialogClose}
        handleSocialDialogClose={handleSocialDialogClose}
      />
    </>
  );
};

export default DialogManager;
