
import { useState, useCallback } from 'react';
import { AudienceChoice, TargetAudience } from '../types';
import { EmailStyle } from '../../EmailStyleDialog';
import { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';

export const useDialogState = () => {
  // Dialog state
  const [showForm, setShowForm] = useState(false);
  const [audienceChoice, setAudienceChoice] = useState<AudienceChoice>(null);
  const [selectedAudienceId, setSelectedAudienceId] = useState<string | null>(null);
  const [existingAudiences, setExistingAudiences] = useState<TargetAudience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Dialog flow state
  const [showScriptDialog, setShowScriptDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showEmailStyleDialog, setShowEmailStyleDialog] = useState(false);
  const [showSocialMediaPlatformDialog, setShowSocialMediaPlatformDialog] = useState(false);
  const [showSocialDialog, setShowSocialDialog] = useState(false);
  
  // Answer state
  const [advertisingGoal, setAdvertisingGoal] = useState('');
  const [emailStyle, setEmailStyle] = useState<EmailStyle | null>(null);
  const [socialMediaPlatform, setSocialMediaPlatform] = useState<SocialMediaPlatform | null>(null);
  
  // Transition state to prevent multiple dialogs from showing simultaneously
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle sequential dialog transitions
  const transitionToDialog = useCallback((closeDialog: () => void, openDialog: () => void) => {
    setIsTransitioning(true);
    
    // Close the current dialog
    closeDialog();
    
    // Wait for animation to complete before opening next dialog
    setTimeout(() => {
      openDialog();
      setIsTransitioning(false);
      setIsProcessing(false);
    }, 300);
  }, []);

  // Reset all dialog state
  const resetState = useCallback(() => {
    setShowForm(false);
    setAudienceChoice(null);
    setSelectedAudienceId(null);
    setShowScriptDialog(false);
    setShowEmailDialog(false);
    setShowGoalDialog(false);
    setShowEmailStyleDialog(false);
    setShowSocialMediaPlatformDialog(false);
    setShowSocialDialog(false);
    setAdvertisingGoal('');
    setEmailStyle(null);
    setSocialMediaPlatform(null);
    setIsProcessing(false);
    setIsTransitioning(false);
  }, []);

  return {
    // State getters
    showForm,
    audienceChoice,
    selectedAudienceId,
    existingAudiences,
    isLoading,
    isProcessing,
    showScriptDialog,
    showEmailDialog,
    showGoalDialog,
    showEmailStyleDialog,
    showSocialMediaPlatformDialog,
    showSocialDialog,
    advertisingGoal,
    emailStyle,
    socialMediaPlatform,
    isTransitioning,
    
    // State setters
    setShowForm,
    setAudienceChoice,
    setSelectedAudienceId,
    setExistingAudiences,
    setIsLoading,
    setIsProcessing,
    setShowScriptDialog,
    setShowEmailDialog,
    setShowGoalDialog,
    setShowEmailStyleDialog,
    setShowSocialMediaPlatformDialog,
    setShowSocialDialog,
    setAdvertisingGoal,
    setEmailStyle,
    setSocialMediaPlatform,
    setIsTransitioning,
    
    // Helper methods
    transitionToDialog,
    resetState,
  };
};
