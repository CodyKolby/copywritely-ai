
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

  // Visibility tracking state - improved
  const visibilityRef = useRef({
    wasFocused: true,
    dialogsInProgress: false,
    lastActiveDialog: null as string | null,
    dialogState: {} as Record<string, boolean>
  });

  // Helper to determine current active dialog
  const getCurrentActiveDialog = useCallback(() => {
    if (showScriptDialog) return 'script';
    if (showEmailDialog) return 'email';
    if (showSocialMediaPlatformDialog) return 'socialMedia';
    if (showEmailStyleDialog) return 'emailStyle';
    if (showGoalDialog) return 'goal';
    if (showForm) return 'form';
    return null;
  }, [
    showScriptDialog,
    showEmailDialog,
    showSocialMediaPlatformDialog,
    showEmailStyleDialog,
    showGoalDialog,
    showForm
  ]);

  // Save current dialog state when tab becomes hidden
  const saveDialogState = useCallback(() => {
    const currentDialog = getCurrentActiveDialog();
    console.log("Saving dialog state, active dialog:", currentDialog);
    
    visibilityRef.current.lastActiveDialog = currentDialog;
    visibilityRef.current.dialogState = {
      showForm,
      showGoalDialog,
      showEmailStyleDialog,
      showSocialMediaPlatformDialog,
      showScriptDialog,
      showEmailDialog
    };
    
    visibilityRef.current.dialogsInProgress = 
      showGoalDialog || showEmailStyleDialog || 
      showSocialMediaPlatformDialog || showScriptDialog || 
      showEmailDialog || showForm;
      
    console.log("Dialog state saved:", visibilityRef.current);
  }, [
    getCurrentActiveDialog,
    showForm,
    showGoalDialog,
    showEmailStyleDialog,
    showSocialMediaPlatformDialog,
    showScriptDialog,
    showEmailDialog
  ]);

  // Restore dialog state when tab becomes visible again
  const restoreDialogState = useCallback(() => {
    const savedState = visibilityRef.current;
    console.log("Restoring dialog state:", savedState);
    
    if (savedState.dialogsInProgress) {
      // Restore specific dialog that was active
      if (savedState.dialogState) {
        console.log("Restoring specific dialog:", savedState.lastActiveDialog);
        
        setShowForm(savedState.dialogState.showForm || false);
        setShowGoalDialog(savedState.dialogState.showGoalDialog || false);
        setShowEmailStyleDialog(savedState.dialogState.showEmailStyleDialog || false);
        setShowSocialMediaPlatformDialog(savedState.dialogState.showSocialMediaPlatformDialog || false);
        setShowScriptDialog(savedState.dialogState.showScriptDialog || false);
        setShowEmailDialog(savedState.dialogState.showEmailDialog || false);
      }
    }
  }, []);

  // Monitor page visibility with improved state handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !visibilityRef.current.wasFocused) {
        // Tab is now visible again after being hidden
        console.log("Tab became visible again - restoring dialog state");
        visibilityRef.current.wasFocused = true;
        
        // Only restore state if we were in the middle of a dialog sequence
        if (visibilityRef.current.dialogsInProgress) {
          restoreDialogState();
        }
      } else if (document.visibilityState === 'hidden') {
        // Tab is now hidden
        console.log("Tab became hidden - saving dialog state");
        visibilityRef.current.wasFocused = false;
        saveDialogState();
      }
    };

    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    saveDialogState,
    restoreDialogState
  ]);

  // Update current dialog state whenever dialogs change
  useEffect(() => {
    // Only update if page is visible to avoid interference with visibility handling
    if (document.visibilityState === 'visible') {
      const currentDialog = getCurrentActiveDialog();
      
      if (currentDialog) {
        visibilityRef.current.lastActiveDialog = currentDialog;
        visibilityRef.current.dialogsInProgress = true;
      } else {
        visibilityRef.current.dialogsInProgress = false;
      }
    }
  }, [
    getCurrentActiveDialog,
    showForm, 
    showGoalDialog, 
    showEmailStyleDialog, 
    showSocialMediaPlatformDialog, 
    showScriptDialog, 
    showEmailDialog
  ]);

  // Reset all state - implementacja z useCallback dla stabilności referencji
  const resetState = useCallback(() => {
    // Only reset if we're not in the middle of a dialog sequence that needs to be preserved
    // OR if we're explicitly closing the dialog (when tab is visible)
    if (!visibilityRef.current.dialogsInProgress || 
        (document.visibilityState === 'visible' && !isTransitioning)) {
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
      visibilityRef.current.dialogsInProgress = false;
      visibilityRef.current.lastActiveDialog = null;
    } else {
      console.log("Skipping dialog reset because dialog sequence is in progress and tab visibility changed");
    }
  }, [isTransitioning]); // dodany isTransitioning jako zależność
  
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
