
import { useCallback } from 'react';
import { UseTargetAudienceDialogReturn } from '../types';
import { useDialogVisibility } from './useDialogVisibility';
import { useAudienceSelection } from './useAudienceSelection';
import { useWorkflowParameters } from './useWorkflowParameters';
import { useWorkflowNavigation } from './useWorkflowNavigation';
import { useFormHandling } from './useFormHandling';
import { useDialogStepsNavigation } from './useDialogStepsNavigation';

interface UseAudienceDialogStateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  userId: string;
  isPremium: boolean;
}

/**
 * Main hook that composes all the other hooks for complete target audience dialog functionality
 */
export const useAudienceDialogState = ({
  open,
  onOpenChange,
  templateId,
  userId,
  isPremium
}: UseAudienceDialogStateProps): UseTargetAudienceDialogReturn => {
  // Dialog visibility states
  const visibility = useDialogVisibility(open, templateId);
  
  // Audience selection
  const audienceSelection = useAudienceSelection(userId, open);
  
  // Workflow parameters
  const parameters = useWorkflowParameters();
  
  // Workflow navigation
  const navigation = useWorkflowNavigation({
    isPremium,
    audienceChoice: audienceSelection.audienceChoice,
    selectedAudienceId: audienceSelection.selectedAudienceId,
    onOpenChange,
    setIsProcessing: visibility.setIsProcessing,
    setIsTransitioning: visibility.setIsTransitioning,
    setShowForm: visibility.setShowForm,
    setShowGoalDialog: visibility.setShowGoalDialog,
    setShowEmailStyleDialog: visibility.setShowEmailStyleDialog,
    setShowSocialMediaPlatformDialog: visibility.setShowSocialMediaPlatformDialog,
    setShowScriptDialog: visibility.setShowScriptDialog,
    setShowEmailDialog: visibility.setShowEmailDialog,
    setShowSocialDialog: visibility.setShowSocialDialog,
    templateId
  });
  
  // Form handling
  const formHandling = useFormHandling({
    setSelectedAudienceId: audienceSelection.setSelectedAudienceId,
    setIsProcessing: visibility.setIsProcessing,
    setIsTransitioning: visibility.setIsTransitioning,
    setShowForm: visibility.setShowForm,
    goToNextStep: navigation.goToNextStep
  });
  
  // Dialog steps navigation
  const dialogSteps = useDialogStepsNavigation({
    templateId,
    setIsProcessing: visibility.setIsProcessing,
    setIsTransitioning: visibility.setIsTransitioning,
    setAdvertisingGoal: parameters.setAdvertisingGoal,
    setEmailStyle: parameters.setEmailStyle,
    setSocialMediaPlatform: parameters.setSocialMediaPlatform,
    setShowGoalDialog: visibility.setShowGoalDialog,
    setShowEmailStyleDialog: visibility.setShowEmailStyleDialog,
    setShowSocialMediaPlatformDialog: visibility.setShowSocialMediaPlatformDialog,
    setShowScriptDialog: visibility.setShowScriptDialog,
    setShowEmailDialog: visibility.setShowEmailDialog,
    setShowSocialDialog: visibility.setShowSocialDialog,
    onOpenChange
  });
  
  // Reset all state
  const resetState = useCallback(() => {
    visibility.resetVisibility();
    audienceSelection.resetAudienceSelection();
    parameters.resetParameters();
  }, [
    visibility.resetVisibility,
    audienceSelection.resetAudienceSelection,
    parameters.resetParameters
  ]);

  // Add a basic validatePremiumStatus function
  const validatePremiumStatus = useCallback(async () => {
    return Promise.resolve(isPremium);
  }, [isPremium]);

  // Create a handleFormSubmit function that returns a string or undefined
  const handleFormSubmit = useCallback(async (values: any): Promise<string | undefined> => {
    try {
      await formHandling.handleFormSubmit(values);
      // Return the audience ID from the form handling result
      // If it's not available, just return a placeholder ID
      return audienceSelection.selectedAudienceId || undefined;
    } catch (error) {
      console.error("Error in handleFormSubmit:", error);
      return undefined;
    }
  }, [formHandling.handleFormSubmit, audienceSelection.selectedAudienceId]);

  // Return combined state and methods
  return {
    isLoading: audienceSelection.isLoading,
    showForm: visibility.showForm,
    audienceChoice: audienceSelection.audienceChoice,
    selectedAudienceId: audienceSelection.selectedAudienceId,
    existingAudiences: audienceSelection.existingAudiences,
    showScriptDialog: visibility.showScriptDialog,
    showEmailDialog: visibility.showEmailDialog,
    showSocialDialog: visibility.showSocialDialog,
    showGoalDialog: visibility.showGoalDialog,
    showEmailStyleDialog: visibility.showEmailStyleDialog,
    showSocialMediaPlatformDialog: visibility.showSocialMediaPlatformDialog,
    advertisingGoal: parameters.advertisingGoal,
    emailStyle: parameters.emailStyle,
    socialMediaPlatform: parameters.socialMediaPlatform,
    isProcessing: visibility.isProcessing,
    isTransitioning: visibility.isTransitioning,
    handleChoiceSelection: audienceSelection.handleChoiceSelection,
    handleExistingAudienceSelect: audienceSelection.handleExistingAudienceSelect,
    handleContinue: navigation.handleContinue,
    handleCreateNewAudience: navigation.handleCreateNewAudience,
    handleFormSubmit,
    handleBack: formHandling.handleBack,
    handleGoalSubmit: dialogSteps.handleGoalSubmit,
    handleGoalBack: dialogSteps.handleGoalBack,
    handleEmailStyleSubmit: dialogSteps.handleEmailStyleSubmit,
    handleEmailStyleBack: dialogSteps.handleEmailStyleBack,
    handleSocialMediaPlatformSubmit: dialogSteps.handleSocialMediaPlatformSubmit,
    handleSocialMediaPlatformBack: dialogSteps.handleSocialMediaPlatformBack,
    handleScriptDialogClose: dialogSteps.handleScriptDialogClose,
    handleEmailDialogClose: dialogSteps.handleEmailDialogClose,
    handleSocialDialogClose: dialogSteps.handleSocialDialogClose,
    resetState,
    validatePremiumStatus,
    handleDeleteAudience: async (audienceId: string) => {
      try {
        console.log("Deleting audience:", audienceId);
        // This is just a placeholder implementation
        return Promise.resolve();
      } catch (error) {
        console.error("Error deleting audience:", error);
      }
    }
  };
};
