
import { useState, useCallback } from 'react';
import { EmailStyle } from '../../EmailStyleDialog';
import { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';
import { TargetAudience } from '../types';

export const useDialogState = () => {
  // Base dialog state
  const [showForm, setShowForm] = useState(false);
  const [audienceChoice, setAudienceChoice] = useState<'existing' | 'new' | null>(null);
  const [selectedAudienceId, setSelectedAudienceId] = useState<string | null>(null);
  const [existingAudiences, setExistingAudiences] = useState<TargetAudience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Processing state - critical for UI feedback
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

  // Reset all state - implementacja z useCallback dla stabilności referencji
  const resetState = useCallback(() => {
    console.log("Resetowanie wszystkich stanów dialogu");
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
    setIsProcessing(false); // Important: reset processing state
  }, []); // Pusta tablica zależności, funkcja nigdy nie jest tworzona na nowo

  return {
    // State
    showForm,
    audienceChoice,
    selectedAudienceId,
    existingAudiences,
    isLoading,
    showScriptDialog,
    showEmailDialog,
    showGoalDialog,
    showEmailStyleDialog,
    showSocialMediaPlatformDialog,
    advertisingGoal,
    emailStyle,
    socialMediaPlatform,
    isProcessing,
    
    // Setters
    setShowForm,
    setAudienceChoice,
    setSelectedAudienceId,
    setExistingAudiences,
    setIsLoading,
    setShowScriptDialog,
    setShowEmailDialog,
    setShowGoalDialog,
    setShowEmailStyleDialog,
    setShowSocialMediaPlatformDialog,
    setAdvertisingGoal,
    setEmailStyle,
    setSocialMediaPlatform,
    setIsProcessing,
    
    // Actions
    resetState,
  };
};
