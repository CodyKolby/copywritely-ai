
import React, { useEffect, useRef } from 'react';
import { TargetAudienceDialogProps } from './types';
import { useTargetAudienceDialog } from './hooks/useRefactoredTargetAudienceDialog';
import MainSelectionDialog from './dialogs/MainSelectionDialog';
import FormDialog from './dialogs/FormDialog';
import GoalDialog from './dialogs/GoalDialog';
import EmailStyleDialog from './dialogs/EmailStyleDialog';
import SocialMediaDialog from './dialogs/SocialMediaDialog';
import ResultDialogs from './dialogs/ResultDialogs';
import { toast } from 'sonner';

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
  // Prevent excessive re-renders and API calls
  const previousOpenState = useRef<boolean>(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Only log on template ID changes or when open state changes, not on every render
  useEffect(() => {
    if (templateId || open) {
      console.log("DialogManager rendering with templateId:", templateId);
    }
    
    // If dialog is transitioning from closed to open, clear any potential error toasts
    if (open && !previousOpenState.current) {
      // Clear existing timeout if any
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    }
    
    previousOpenState.current = open;
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
    fetchExistingAudiences,
    hasError
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

  // Force refresh audiences on dialog open and periodically if there are errors
  useEffect(() => {
    if (open && userId) {
      // Initial fetch on open
      if (!previousOpenState.current) {
        console.log("Dialog opened - fetching audiences");
        fetchExistingAudiences();
      }
      
      // Schedule periodic refreshes only if we've had an error
      if (hasError) {
        console.log("Setting up retry for audience fetch due to previous error");
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
        
        fetchTimeoutRef.current = setTimeout(() => {
          if (open) {
            console.log("Retry fetching audiences after error");
            fetchExistingAudiences();
          }
          fetchTimeoutRef.current = null;
        }, 5000); // Retry every 5 seconds
      }
      
      return () => {
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
          fetchTimeoutRef.current = null;
        }
      };
    }
  }, [open, userId, fetchExistingAudiences, hasError]);

  const handleDialogClose = () => {
    resetState(); // Reset all states
    onOpenChange(false);
  };

  // Fixed form submission handler with simplified and more robust error handling
  const handleFormSubmitWrapped = async (values: any): Promise<string | undefined> => {
    try {
      console.log("Form submission wrapper in DialogManager with userId:", userId);
      
      // Only proceed if we have a real user ID
      if (!userId) {
        console.error("No user ID provided to form submission wrapper");
        toast.error("Brak ID użytkownika - zaloguj się ponownie");
        return undefined;
      }
      
      let audienceId: string | undefined = undefined;
      let errorOccurred = false;
            
      // Call the handleFormSubmit function from the hook
      try {
        audienceId = await handleFormSubmit(values);
        
        if (audienceId) {
          console.log("Form submitted successfully in DialogManager with ID:", audienceId);
          
          // Ensure a refresh of audiences list
          setTimeout(() => {
            fetchExistingAudiences();
          }, 500);
          
          // After successful submission, go back to selection screen
          setTimeout(() => {
            handleBack();  // Return to selection screen
          }, 300);
          
          return audienceId;
        } else {
          errorOccurred = true;
          console.error("Form submission completed but no audience ID was returned");
        }
      } catch (error) {
        errorOccurred = true;
        console.error("Error in form submission:", error);
      }
      
      if (errorOccurred) {
        toast.error("Wystąpił błąd podczas zapisywania grupy docelowej");
      }
      
      return undefined;
    } catch (error) {
      console.error("Error in form submission wrapper:", error);
      toast.error("Nieoczekiwany błąd podczas przetwarzania formularza");
      return undefined;
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
  
  const isEmptyAudiences = existingAudiences.length === 0 && !isLoading;

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
        manualRefresh={fetchExistingAudiences}
        hasError={hasError}
        isEmpty={isEmptyAudiences}
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
