
import { useState } from 'react';
import { EmailStyle } from '../../EmailStyleDialog';
import { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';
import { TargetAudience } from '../types';

export const useDialogState = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [audienceChoice, setAudienceChoice] = useState<'existing' | 'new' | null>(null);
  const [selectedAudienceId, setSelectedAudienceId] = useState<string | null>(null);
  const [existingAudiences, setExistingAudiences] = useState<TargetAudience[]>([]);
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
    setIsLoading(false);
    setShowForm(false);
    setAudienceChoice(null);
    setSelectedAudienceId(null);
    setExistingAudiences([]);
    setShowScriptDialog(false);
    setShowEmailDialog(false);
    setShowGoalDialog(false);
    setShowEmailStyleDialog(false);
    setShowSocialMediaPlatformDialog(false);
    setAdvertisingGoal('');
    setEmailStyle(null);
    setSocialMediaPlatform(null);
    setIsProcessing(false);
  };

  return {
    isLoading,
    setIsLoading,
    showForm,
    setShowForm,
    audienceChoice,
    setAudienceChoice,
    selectedAudienceId,
    setSelectedAudienceId,
    existingAudiences,
    setExistingAudiences,
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
