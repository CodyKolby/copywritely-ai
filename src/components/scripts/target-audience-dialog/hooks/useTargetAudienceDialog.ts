
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

export const useTargetAudienceDialog = ({ 
  open, 
  onOpenChange, 
  templateId, 
  userId,
  isPremium
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  userId: string;
  isPremium: boolean;
}) => {
  // Use all the extracted hooks
  const dialogState = useDialogState();
  const { verifiedPremium } = usePremiumVerification(userId, isPremium);
  
  // Use the hook for fetching audience data
  const { 
    existingAudiences, 
    isLoading, 
    handleFormSubmit: submitAudienceForm 
  } = useAudienceData(userId, open);

  // Set state from audience data
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

  // Enhanced form submission handler
  const handleFormSubmit = async (values: any) => {
    try {
      dialogState.setIsProcessing(true);
      const audienceId = await submitAudienceForm(values);
      
      if (audienceId) {
        dialogState.setSelectedAudienceId(audienceId);
        
        // Hide the form and show the goal dialog
        dialogState.setShowForm(false);
        dialogState.setShowGoalDialog(true);
        
        toast.success('Grupa docelowa została utworzona');
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error('Wystąpił błąd podczas tworzenia grupy docelowej');
      dialogState.setIsProcessing(false);
    } finally {
      dialogState.setIsProcessing(false);
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
    
    // Added resetState, to be available in the component
    resetState: dialogState.resetState,
  };
};
