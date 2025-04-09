
import { useState, useCallback, useEffect, useRef } from 'react';
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
  
  // Dialog transition state - to prevent flashing of previous dialogs
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Answer state
  const [advertisingGoal, setAdvertisingGoal] = useState('');
  const [emailStyle, setEmailStyle] = useState<EmailStyle | null>(null);
  const [socialMediaPlatform, setSocialMediaPlatform] = useState<SocialMediaPlatform | null>(null);

  // Visibility tracking state - NEW
  const visibilityState = useRef({
    wasFocused: true,
    dialogsInProgress: false
  });

  // NEW: Monitor page visibility and preserve dialog state
  useEffect(() => {
    // Function to handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !visibilityState.current.wasFocused) {
        // Tab is now visible again after being hidden
        console.log("Tab became visible - preserving dialog state");
        visibilityState.current.wasFocused = true;
      } else if (document.visibilityState === 'hidden') {
        // Tab is now hidden
        console.log("Tab became hidden - marking dialog state to preserve");
        visibilityState.current.wasFocused = false;
        
        // Check if we're in an active dialog sequence
        visibilityState.current.dialogsInProgress = 
          showGoalDialog || showEmailStyleDialog || 
          showSocialMediaPlatformDialog || showScriptDialog || 
          showEmailDialog || showForm;
      }
    };

    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    showGoalDialog, 
    showEmailStyleDialog, 
    showSocialMediaPlatformDialog, 
    showScriptDialog, 
    showEmailDialog,
    showForm
  ]);

  // Reset all state - implementacja z useCallback dla stabilności referencji
  const resetState = useCallback(() => {
    // Only reset if we're not in the middle of a dialog sequence that needs to be preserved
    if (visibilityState.current.dialogsInProgress && !visibilityState.current.wasFocused) {
      console.log("Skipping dialog reset because tab visibility changed during active dialog sequence");
      return;
    }
    
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
    setIsTransitioning(false); // Reset transition state
    
    // Reset visibility tracking
    visibilityState.current.dialogsInProgress = false;
  }, []); // Pusta tablica zależności, funkcja nigdy nie jest tworzona na nowo
  
  // Sequential dialog transitions to prevent flashing
  const transitionToDialog = useCallback((closeDialog: () => void, openDialog: () => void) => {
    setIsTransitioning(true);
    
    // First close current dialog
    closeDialog();
    
    // Then open next dialog with delay
    setTimeout(() => {
      openDialog();
      setIsTransitioning(false);
      setIsProcessing(false);
    }, 100);
  }, []);

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
    isTransitioning,
    
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
    setIsTransitioning,
    
    // Actions
    resetState,
    transitionToDialog,
  };
};
