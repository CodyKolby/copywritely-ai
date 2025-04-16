
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { TargetAudienceDialogProps } from '../types';
import { useDialogState } from './useDialogState';
import { useAudienceData } from './useAudienceData';
import { useDialogNavigation } from './useDialogNavigation';
import { useAudienceManagement } from './useAudienceManagement';
import { usePremiumVerification } from './usePremiumVerification';
import { useFormSubmission } from './useFormSubmission';
import { usePremiumValidator } from './usePremiumValidator';
import { useDialogReset } from './useDialogReset';
import { useAudienceStateUpdater } from './useAudienceStateUpdater';
import { saveTargetAudience } from '../api';

export const useTargetAudienceDialog = ({ 
  open, 
  onOpenChange, 
  templateId, 
  userId,
  isPremium
}: TargetAudienceDialogProps) => {
  // Use the hook for managing dialog state
  const dialogState = useDialogState();

  // Use the premium verification hook
  const { verifiedPremium } = usePremiumVerification(userId, isPremium);
  
  // Use the hook for fetching audience data
  const { 
    existingAudiences, 
    isLoading, 
    isCompressing,
    hasError,
    handleFormSubmit: submitAudienceForm,
    fetchExistingAudiences,
    handleDeleteAudience,
    manualRefresh
  } = useAudienceData(userId, open);
  
  // Use the hook for audience state updates
  useAudienceStateUpdater(
    existingAudiences, 
    isLoading,
    isCompressing,
    dialogState.setExistingAudiences, 
    dialogState.setIsLoading
  );
  
  // Use the hook for audience management
  const audienceManagement = useAudienceManagement(userId, {
    setIsLoading: dialogState.setIsLoading,
    setExistingAudiences: dialogState.setExistingAudiences,
    setSelectedAudienceId: dialogState.setSelectedAudienceId,
    setAudienceChoice: dialogState.setAudienceChoice,
    setShowForm: dialogState.setShowForm,
    setShowGoalDialog: dialogState.setShowGoalDialog,
    setIsProcessing: dialogState.setIsProcessing,
    audienceChoice: dialogState.audienceChoice,
    selectedAudienceId: dialogState.selectedAudienceId
  });
  
  // Use the hook for dialog navigation - Pass onOpenChange to control the parent dialog
  const dialogNavigation = useDialogNavigation({
    setShowForm: dialogState.setShowForm,
    setShowGoalDialog: dialogState.setShowGoalDialog,
    setShowEmailStyleDialog: dialogState.setShowEmailStyleDialog,
    setShowSocialMediaPlatformDialog: dialogState.setShowSocialMediaPlatformDialog,
    setShowScriptDialog: dialogState.setShowScriptDialog,
    setShowEmailDialog: dialogState.setShowEmailDialog,
    setShowSocialDialog: dialogState.setShowSocialDialog,
    setAdvertisingGoal: dialogState.setAdvertisingGoal,
    setEmailStyle: dialogState.setEmailStyle,
    setSocialMediaPlatform: dialogState.setSocialMediaPlatform,
    setIsProcessing: dialogState.setIsProcessing,
    onOpenChange: onOpenChange,
  }, templateId);
  
  // Use the hook for form submission
  const formSubmission = useFormSubmission(
    userId, 
    submitAudienceForm,
    fetchExistingAudiences
  );
  
  // Use the hook for premium validation
  const premiumValidator = usePremiumValidator(
    userId, 
    isPremium,
    verifiedPremium
  );
  
  // Use the hook for dialog reset
  useDialogReset(
    open,
    templateId,
    dialogState.resetState,
    dialogState.setShowGoalDialog,
    dialogState.setShowEmailStyleDialog,
    dialogState.setShowSocialMediaPlatformDialog,
    dialogState.setShowScriptDialog,
    dialogState.setShowEmailDialog,
    dialogState.setShowSocialDialog,
    dialogState.setAdvertisingGoal,
    dialogState.setEmailStyle,
    dialogState.setSocialMediaPlatform,
    dialogState.setIsProcessing
  );

  // Track submissions to prevent duplicates
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Enhanced form submission handler with improved flow control
  const handleFormSubmit = async (values: any): Promise<string | undefined> => {
    try {
      // Prevent duplicate submissions
      if (formSubmitted) {
        console.log("Form already submitted, preventing duplicate submission");
        return undefined;
      }
      
      setFormSubmitted(true);
      dialogState.setIsProcessing(true);
      console.log("Starting target audience form submission with user ID:", userId);
      
      // Create a clean copy of values without advertisingGoal
      const { advertisingGoal, ...dataToSubmit } = values;
      console.log("Clean data being submitted:", dataToSubmit);
      
      let audienceId: string | undefined;
      
      try {
        // Try direct save approach
        console.log("Attempting direct API save method");
        audienceId = await saveTargetAudience(dataToSubmit, userId || '');
      } catch (error) {
        console.error("Error in direct save approach:", error);
        
        try {
          // Try form submission utility as fallback
          console.log("Attempting form submission utility as fallback");
          audienceId = await formSubmission.handleFormSubmit(dataToSubmit);
        } catch (submissionError) {
          console.error("Error in form submission utility:", submissionError);
          throw submissionError;
        }
      }
      
      if (audienceId) {
        console.log("Target audience created successfully with ID:", audienceId);
        toast.success("Grupa docelowa została utworzona");
        
        // Set the selectedAudienceId
        dialogState.setSelectedAudienceId(audienceId);
        
        // Force refresh of audience list to ensure the new item appears
        await fetchExistingAudiences();
        
        // Return the audience ID to indicate success
        return audienceId;
      } else {
        throw new Error("No audience ID returned");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error('Nie udało się utworzyć grupy docelowej');
      return undefined;
    } finally {
      setTimeout(() => {
        setFormSubmitted(false);
        dialogState.setIsProcessing(false);
      }, 1000);
    }
  };

  // Return all the hooks' state and methods
  return {
    // State from dialogState
    isLoading: dialogState.isLoading,
    showForm: dialogState.showForm,
    audienceChoice: dialogState.audienceChoice,
    selectedAudienceId: dialogState.selectedAudienceId,
    existingAudiences: dialogState.existingAudiences,
    showScriptDialog: dialogState.showScriptDialog,
    showEmailDialog: dialogState.showEmailDialog,
    showSocialDialog: dialogState.showSocialDialog,
    showGoalDialog: dialogState.showGoalDialog,
    showEmailStyleDialog: dialogState.showEmailStyleDialog,
    showSocialMediaPlatformDialog: dialogState.showSocialMediaPlatformDialog,
    advertisingGoal: dialogState.advertisingGoal,
    emailStyle: dialogState.emailStyle,
    socialMediaPlatform: dialogState.socialMediaPlatform,
    isProcessing: dialogState.isProcessing,
    hasError, // Expose the hasError flag
    
    // Methods from audienceManagement
    handleChoiceSelection: audienceManagement.handleChoiceSelection,
    handleExistingAudienceSelect: audienceManagement.handleExistingAudienceSelect,
    handleContinue: audienceManagement.handleContinue,
    handleCreateNewAudience: audienceManagement.handleCreateNewAudience,
    handleFormSubmit,
    
    // Methods from dialogNavigation
    handleBack: dialogNavigation.handleBack,
    handleGoalSubmit: dialogNavigation.handleGoalSubmit,
    handleGoalBack: dialogNavigation.handleGoalBack,
    handleEmailStyleSubmit: dialogNavigation.handleEmailStyleSubmit,
    handleEmailStyleBack: dialogNavigation.handleEmailStyleBack,
    handleSocialMediaPlatformSubmit: dialogNavigation.handleSocialMediaPlatformSubmit,
    handleSocialMediaPlatformBack: dialogNavigation.handleSocialMediaPlatformBack,
    handleScriptDialogClose: dialogNavigation.handleScriptDialogClose,
    handleEmailDialogClose: dialogNavigation.handleEmailDialogClose,
    handleSocialDialogClose: dialogNavigation.handleSocialDialogClose,
    
    // Premium validation
    validatePremiumStatus: premiumValidator.validatePremiumStatus,
    
    // Added handleDeleteAudience from useAudienceData
    handleDeleteAudience,
    
    // Added fetchExistingAudiences to be available in components
    fetchExistingAudiences,
    
    // Added manual refresh
    manualRefresh,
    
    // Added resetState, to be available in the component
    resetState: dialogState.resetState,
  };
};
