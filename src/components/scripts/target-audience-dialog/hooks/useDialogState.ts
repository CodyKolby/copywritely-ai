
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
  
  // Answer state
  const [advertisingGoal, setAdvertisingGoal] = useState('');
  const [emailStyle, setEmailStyle] = useState<EmailStyle | null>(null);
  const [socialMediaPlatform, setSocialMediaPlatform] = useState<SocialMediaPlatform | null>(null);

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
    setAdvertisingGoal('');
    setEmailStyle(null);
    setSocialMediaPlatform(null);
    setIsProcessing(false);
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
    advertisingGoal,
    emailStyle,
    socialMediaPlatform,
    
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
    setAdvertisingGoal,
    setEmailStyle,
    setSocialMediaPlatform,
    
    // Helper methods
    resetState,
  };
};
