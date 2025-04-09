
import { useEffect } from 'react';
import { toast } from 'sonner';
import { checkAllPremiumStorages, updateAllPremiumStorages } from '@/contexts/auth/local-storage-utils';
import { forcePremiumStatusUpdate, checkPremiumStatus } from '@/contexts/auth/premium-utils';
import { EmailStyle } from '../EmailStyleDialog';
import { SocialMediaPlatform } from '../SocialMediaPlatformDialog';
import { useDialogState } from './hooks/useDialogState';
import { useAudienceManagement } from './hooks/useAudienceManagement';
import { useDialogNavigation } from './hooks/useDialogNavigation';
import { usePremiumVerification } from './hooks/usePremiumVerification';
import { useAudienceData } from './hooks/useAudienceData';
import { TargetAudienceDialogOptions } from './types';

export const useTargetAudienceDialog = ({ 
  open, 
  onOpenChange,
  templateId,
  userId,
  isPremium
}: TargetAudienceDialogOptions) => {
  // Use the hook for managing dialog state
  const dialogState = useDialogState();

  // Use the premium verification hook
  const { verifiedPremium } = usePremiumVerification(userId, isPremium);
  
  // Use the hook for fetching audience data
  const { existingAudiences, isLoading, handleFormSubmit: submitAudienceForm } = useAudienceData(userId, open);
  
  // Set existing audiences and loading state
  useEffect(() => {
    dialogState.setExistingAudiences(existingAudiences);
    dialogState.setIsLoading(isLoading);
  }, [existingAudiences, isLoading]);
  
  // Use the hook for audience management
  const audienceManagement = useAudienceManagement(userId, {
    setIsLoading: dialogState.setIsLoading,
    setExistingAudiences: dialogState.setExistingAudiences,
    setSelectedAudienceId: dialogState.setSelectedAudienceId,
    setAudienceChoice: dialogState.setAudienceChoice,
    setShowForm: dialogState.setShowForm,
    setShowGoalDialog: dialogState.setShowGoalDialog,
    setIsProcessing: dialogState.setIsProcessing,
    transitionToDialog: dialogState.transitionToDialog,
    audienceChoice: dialogState.audienceChoice,
    selectedAudienceId: dialogState.selectedAudienceId
  });
  
  // Use the hook for dialog navigation
  const dialogNavigation = useDialogNavigation({
    setShowForm: dialogState.setShowForm,
    setShowGoalDialog: dialogState.setShowGoalDialog,
    setShowEmailStyleDialog: dialogState.setShowEmailStyleDialog,
    setShowSocialMediaPlatformDialog: dialogState.setShowSocialMediaPlatformDialog,
    setShowScriptDialog: dialogState.setShowScriptDialog,
    setShowEmailDialog: dialogState.setShowEmailDialog,
    setAdvertisingGoal: dialogState.setAdvertisingGoal,
    setEmailStyle: dialogState.setEmailStyle,
    setSocialMediaPlatform: dialogState.setSocialMediaPlatform,
    setIsProcessing: dialogState.setIsProcessing,
    isTransitioning: dialogState.isTransitioning,
    transitionToDialog: dialogState.transitionToDialog
  }, templateId);

  // Dodatkowy efekt do logowania stanu dialogu
  useEffect(() => {
    if (open) {
      console.log("Dialog state:", {
        audienceChoice: dialogState.audienceChoice,
        selectedAudienceId: dialogState.selectedAudienceId,
        isLoading: dialogState.isLoading,
        showForm: dialogState.showForm,
        showGoalDialog: dialogState.showGoalDialog,
        showEmailStyleDialog: dialogState.showEmailStyleDialog,
        showSocialMediaPlatformDialog: dialogState.showSocialMediaPlatformDialog,
        showScriptDialog: dialogState.showScriptDialog,
        showEmailDialog: dialogState.showEmailDialog,
        isProcessing: dialogState.isProcessing,
        isTransitioning: dialogState.isTransitioning
      });
    }
  }, [
    open, 
    dialogState.audienceChoice,
    dialogState.selectedAudienceId,
    dialogState.isLoading,
    dialogState.showForm,
    dialogState.showGoalDialog,
    dialogState.showEmailStyleDialog,
    dialogState.showSocialMediaPlatformDialog,
    dialogState.showScriptDialog,
    dialogState.showEmailDialog,
    dialogState.isProcessing,
    dialogState.isTransitioning
  ]);

  // Reset state when dialog opens/closes or template changes
  useEffect(() => {
    console.log(`Dialog ${open ? 'opened' : 'closed'} for template ${templateId}, resetting state`);
    
    if (!open) {
      dialogState.resetState();
    }
  }, [open, dialogState.resetState]);

  // Reset specific dialog states when template changes
  useEffect(() => {
    if (templateId) {
      console.log("Template changed to:", templateId, "- resetting dialog flow states");
      
      // Reset dialog flow states to prevent incorrect dialog sequences
      dialogState.setShowGoalDialog(false);
      dialogState.setShowEmailStyleDialog(false);
      dialogState.setShowSocialMediaPlatformDialog(false);
      dialogState.setShowScriptDialog(false);
      dialogState.setShowEmailDialog(false);
      dialogState.setAdvertisingGoal('');
      dialogState.setEmailStyle(null);
      dialogState.setSocialMediaPlatform(null);
      dialogState.setIsProcessing(false); // Make sure processing state is reset
      dialogState.setIsTransitioning(false); // Reset transition state
    }
  }, [templateId]);

  // Enhanced form submission handler
  const handleFormSubmit = async (values: any) => {
    try {
      dialogState.setIsProcessing(true);
      const audienceId = await submitAudienceForm(values);
      
      if (audienceId) {
        dialogState.setSelectedAudienceId(audienceId);
        
        // Użyj mechanizmu sekwencyjnych przejść
        dialogState.transitionToDialog(
          () => dialogState.setShowForm(false),
          () => dialogState.setShowGoalDialog(true)
        );
        
        toast.success('Grupa docelowa została utworzona');
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error('Wystąpił błąd podczas tworzenia grupy docelowej');
      dialogState.setIsProcessing(false);
      dialogState.setIsTransitioning(false);
    }
  };

  // Function to validate premium status
  const validatePremiumStatus = async () => {
    if (!userId) return false;
    
    // First check storage immediately
    const storagePremium = checkAllPremiumStorages();
    if (storagePremium) {
      return true;
    }
    
    // Otherwise use the verified status if available
    if (verifiedPremium !== null) {
      return verifiedPremium;
    }
    
    // Otherwise return the original premium status
    return isPremium;
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
    showGoalDialog: dialogState.showGoalDialog,
    showEmailStyleDialog: dialogState.showEmailStyleDialog,
    showSocialMediaPlatformDialog: dialogState.showSocialMediaPlatformDialog,
    advertisingGoal: dialogState.advertisingGoal,
    emailStyle: dialogState.emailStyle,
    socialMediaPlatform: dialogState.socialMediaPlatform,
    isProcessing: dialogState.isProcessing,
    isTransitioning: dialogState.isTransitioning,
    
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
    
    // Premium validation
    validatePremiumStatus,
    
    // Dodałem resetState, aby był dostępny w komponencie
    resetState: dialogState.resetState,
  };
};
