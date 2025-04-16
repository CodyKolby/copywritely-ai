
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
    handleFormSubmit: submitAudienceForm,
    fetchExistingAudiences,
    handleDeleteAudience
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

  // Enhanced form submission handler with improved flow control
  const handleFormSubmit = async (values: any): Promise<string | undefined> => {
    try {
      dialogState.setIsProcessing(true);
      console.log("Starting target audience form submission with user ID:", userId);
      
      // Create a clean copy of values without advertisingGoal
      const { advertisingGoal, ...dataToSubmit } = values;
      console.log("Clean data being submitted:", dataToSubmit);
      
      // Direct attempt to save to the database using the API function
      let audienceId: string | undefined;
      
      try {
        // First try the direct API approach
        console.log("Attempting direct API save method");
        audienceId = await saveTargetAudience(dataToSubmit, userId || '');
        console.log("Direct API save method successful, audience ID:", audienceId);
      } catch (apiError) {
        console.error("Direct API save failed, falling back to form submission:", apiError);
        // Fallback to the form submission handler
        audienceId = await formSubmission.handleFormSubmit(values);
        console.log("Fallback save method completed, audience ID:", audienceId);
      }
      
      if (audienceId) {
        console.log("Target audience created successfully with ID:", audienceId);
        toast.success("Grupa docelowa została utworzona");
        
        // Set the selectedAudienceId
        dialogState.setSelectedAudienceId(audienceId);
        
        // First hide the form and go back to the main selection dialog
        dialogState.setShowForm(false);
        
        // Refresh audience list
        await fetchExistingAudiences();
        
        // Reset processing state
        dialogState.setIsProcessing(false);
        
        // Return the audience ID to indicate success
        return audienceId;
      } else {
        throw new Error("No audience ID returned");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error('Nie udało się utworzyć grupy docelowej');
      dialogState.setIsProcessing(false);
      return undefined;
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
    
    // Added resetState, to be available in the component
    resetState: dialogState.resetState,
  };
};
