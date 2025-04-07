
import { useState } from 'react';
import { AudienceChoice } from '../types';
import { EmailStyle } from '../../EmailStyleDialog';
import { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';

/**
 * Hook for managing the state of the target audience dialog
 */
export const useDialogState = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [existingAudiences, setExistingAudiences] = useState<any[]>([]);
  const [selectedAudienceId, setSelectedAudienceId] = useState<string | null>(null);
  const [audienceChoice, setAudienceChoice] = useState<AudienceChoice>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showScriptDialog, setShowScriptDialog] = useState<boolean>(false);
  const [showEmailDialog, setShowEmailDialog] = useState<boolean>(false);
  const [showGoalDialog, setShowGoalDialog] = useState<boolean>(false);
  const [showEmailStyleDialog, setShowEmailStyleDialog] = useState<boolean>(false);
  const [showSocialMediaPlatformDialog, setShowSocialMediaPlatformDialog] = useState<boolean>(false);
  const [advertisingGoal, setAdvertisingGoal] = useState<string>('');
  const [emailStyle, setEmailStyle] = useState<EmailStyle | null>(null);
  const [socialMediaPlatform, setSocialMediaPlatform] = useState<SocialMediaPlatform | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const resetState = () => {
    setShowForm(false);
    setShowScriptDialog(false);
    setShowEmailDialog(false);
    setShowGoalDialog(false);
    setShowEmailStyleDialog(false);
    setShowSocialMediaPlatformDialog(false);
    setAudienceChoice(null);
    setSelectedAudienceId(null);
    setAdvertisingGoal('');
    setEmailStyle(null);
    setSocialMediaPlatform(null);
    setIsProcessing(false);
  };

  return {
    isLoading,
    setIsLoading,
    existingAudiences,
    setExistingAudiences,
    selectedAudienceId,
    setSelectedAudienceId,
    audienceChoice,
    setAudienceChoice,
    showForm,
    setShowForm,
    showScriptDialog,
    setShowScriptDialog,
    showEmailDialog,
    setShowEmailDialog,
    showGoalDialog,
    setShowGoalDialog,
    showEmailStyleDialog,
    setShowEmailStyleDialog,
    showSocialMediaPlatformDialog,
    setShowSocialMediaPlatformDialog,
    advertisingGoal,
    setAdvertisingGoal,
    emailStyle,
    setEmailStyle,
    socialMediaPlatform,
    setSocialMediaPlatform,
    isProcessing,
    setIsProcessing,
    resetState
  };
};
