
import { useState, useCallback } from 'react';
import { AudienceChoice, TargetAudience } from '../types';
import { EmailStyle } from '../../EmailStyleDialog';
import { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';

export const useDialogState = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [audienceChoice, setAudienceChoice] = useState<AudienceChoice>(null);
  const [selectedAudienceId, setSelectedAudienceId] = useState<string | null>(null);
  const [existingAudiences, setExistingAudiences] = useState<TargetAudience[]>([]);
  const [showScriptDialog, setShowScriptDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showSocialDialog, setShowSocialDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showEmailStyleDialog, setShowEmailStyleDialog] = useState(false);
  const [showSocialMediaPlatformDialog, setShowSocialMediaPlatformDialog] = useState(false);
  const [advertisingGoal, setAdvertisingGoal] = useState('');
  const [emailStyle, setEmailStyle] = useState<EmailStyle | null>(null);
  const [socialMediaPlatform, setSocialMediaPlatform] = useState<SocialMediaPlatform | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const resetState = useCallback(() => {
    setShowForm(false);
    setAudienceChoice(null);
    setSelectedAudienceId(null);
    setShowScriptDialog(false);
    setShowEmailDialog(false);
    setShowSocialDialog(false);
    setShowGoalDialog(false);
    setShowEmailStyleDialog(false);
    setShowSocialMediaPlatformDialog(false);
    setAdvertisingGoal('');
    setEmailStyle(null);
    setSocialMediaPlatform(null);
    setIsProcessing(false);
  }, []);

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
    showSocialDialog,
    setShowSocialDialog,
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
    resetState,
  };
};
