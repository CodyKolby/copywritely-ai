import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth/AuthContext';
import { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';
import { EmailStyle } from '../../EmailStyleDialog';
import { useDialogState } from './useDialogState';
import { useAudienceData } from './useAudienceData';
import { useDialogNavigation } from './useDialogNavigation';
import { useAudienceManagement } from './useAudienceManagement';
import { usePremiumVerification } from './usePremiumVerification';
import { TargetAudienceDialogProps } from '../types';
import { checkAllPremiumStorages } from '@/contexts/auth/local-storage-utils';

export const useTargetAudienceDialog = ({ 
  open, 
  onOpenChange, 
  templateId, 
  userId,
  isPremium
}: TargetAudienceDialogProps) => {
  // Use all the extracted hooks
  const dialogState = useDialogState();
  const { verifiedPremium } = usePremiumVerification(userId, isPremium);
  
  // Use the hook for fetching audience data
  const { 
    existingAudiences, 
    isLoading, 
    isCompressing,
    handleFormSubmit: submitAudienceForm,
    fetchExistingAudiences
  } = useAudienceData(userId, open);

  // Set state from audience data
  useEffect(() => {
    dialogState.setExistingAudiences(existingAudiences);
    dialogState.setIsLoading(isLoading || isCompressing);
  }, [existingAudiences, isLoading, isCompressing]);
  
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
    setShowSocialMediaPlatformDialog: dialogState.setShowSocialMediaPlatformDialog,
    setShowScriptDialog: dialogState.setShowScriptDialog,
    setShowEmailDialog: dialogState.setShowEmailDialog,
    setShowSocialDialog: dialogState.setShowSocialDialog,
    setAdvertisingGoal: dialogState.setAdvertisingGoal,
    setEmailStyle: dialogState.setEmailStyle,
    setSocialMediaPlatform: dialogState.setSocialMediaPlatform,
    setIsProcessing: dialogState.setIsProcessing,
  }, templateId);

  // Reset state when dialog opens/closes or template changes
  useEffect(() => {
    if (!open) {
      console.log("Dialog is closed, resetting state");
      dialogState.resetState();
    }
  }, [open, dialogState.resetState]);

  useEffect(() => {
    if (templateId) {
      // Reset dialog flow states to prevent incorrect dialog sequences
      dialogState.setShowGoalDialog(false);
      dialogState.setShowEmailStyleDialog(false);
      dialogState.setShowSocialMediaPlatformDialog(false);
      dialogState.setShowScriptDialog(false);
      dialogState.setShowEmailDialog(false);
      dialogState.setShowSocialDialog(false);
      dialogState.setAdvertisingGoal('');
      dialogState.setEmailStyle(null);
      dialogState.setSocialMediaPlatform(null);
      dialogState.setIsProcessing(false);
    }
  }, [templateId]);

  // Enhanced form submission handler with improved error handling
  const handleFormSubmit = async (values: any) => {
    try {
      console.log("Form submission started");
      dialogState.setIsProcessing(true);
      
      if (!userId) {
        console.error("No user ID provided");
        toast.error('Nie jesteś zalogowany');
        dialogState.setIsProcessing(false);
        return;
      }
      
      // Create a clean copy of values without advertisingGoal
      const { advertisingGoal, ...dataToSubmit } = values;
      console.log("Values for submission (without advertisingGoal):", dataToSubmit);
      
      // Pass the cleaned data to submitAudienceForm
      const audienceId = await submitAudienceForm(dataToSubmit);
      console.log("Audience created with ID:", audienceId);
      
      if (audienceId) {
        // Set the selectedAudienceId
        dialogState.setSelectedAudienceId(audienceId);
        
        // ZMIANA: Bezpośrednio ukrywamy formularz i nie pokazujemy dialogu z celem
        // a wracamy do ekranu wyboru grupy docelowej
        dialogState.setShowForm(false);
        
        // Refresh audience list
        await fetchExistingAudiences();
        return audienceId;
      } else {
        throw new Error("No audience ID returned");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error('Nie udało się utworzyć grupy docelowej');
      throw error;
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
    validatePremiumStatus,
    
    // Added resetState, to be available in the component
    resetState: dialogState.resetState,
  };
};
