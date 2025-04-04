import { useEffect } from 'react';
import { toast } from 'sonner';
import { checkAllPremiumStorages, updateAllPremiumStorages } from '@/contexts/auth/local-storage-utils';
import { forcePremiumStatusUpdate, checkPremiumStatus } from '@/contexts/auth/premium-utils';
import { EmailStyle } from '../../EmailStyleDialog';
import { useDialogState } from './useDialogState';
import { useAudienceManagement } from './useAudienceManagement';
import { useDialogNavigation } from './useDialogNavigation';
import { usePremiumVerification } from './usePremiumVerification';
import { useAudienceData } from './useAudienceData';
import { TargetAudienceDialogOptions } from '../types';

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
    audienceChoice: dialogState.audienceChoice,
    selectedAudienceId: dialogState.selectedAudienceId
  });
  
  // Use the hook for dialog navigation
  const dialogNavigation = useDialogNavigation({
    setShowForm: dialogState.setShowForm,
    setShowGoalDialog: dialogState.setShowGoalDialog,
    setShowEmailStyleDialog: dialogState.setShowEmailStyleDialog,
    setShowScriptDialog: dialogState.setShowScriptDialog,
    setShowEmailDialog: dialogState.setShowEmailDialog,
    setAdvertisingGoal: dialogState.setAdvertisingGoal,
    setEmailStyle: dialogState.setEmailStyle
  }, templateId);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      dialogState.resetState();
    }
  }, [open]);

  // Enhanced form submission handler
  const handleFormSubmit = async (values: any) => {
    dialogState.setIsProcessing(true);
    
    try {
      const audienceId = await submitAudienceForm(values);
      
      if (audienceId) {
        dialogState.setSelectedAudienceId(audienceId);
        dialogState.setShowForm(false);
        dialogState.setShowGoalDialog(true);
        toast.success('Grupa docelowa została utworzona');
      }
    } finally {
      dialogState.setIsProcessing(false);
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
    advertisingGoal: dialogState.advertisingGoal,
    emailStyle: dialogState.emailStyle,
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
    handleScriptDialogClose: dialogNavigation.handleScriptDialogClose,
    handleEmailDialogClose: dialogNavigation.handleEmailDialogClose,
    
    // Premium validation
    validatePremiumStatus,
  };
};
