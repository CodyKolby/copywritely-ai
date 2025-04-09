
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
  const [showSocialDialog, setShowSocialDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showEmailStyleDialog, setShowEmailStyleDialog] = useState(false);
  const [showSocialMediaPlatformDialog, setShowSocialMediaPlatformDialog] = useState(false);
  
  // Dialog transition state - to prevent flashing of previous dialogs
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Answer state
  const [advertisingGoal, setAdvertisingGoal] = useState('');
  const [emailStyle, setEmailStyle] = useState<EmailStyle | null>(null);
  const [socialMediaPlatform, setSocialMediaPlatform] = useState<SocialMediaPlatform | null>(null);

  // Visibility tracking state - improved with lock to prevent dialog cycling
  const visibilityRef = useRef({
    wasFocused: true,
    dialogsInProgress: false,
    lastActiveDialog: null as string | null,
    dialogState: {} as Record<string, boolean>,
    stateWasSaved: false,
    stateRestorationLock: false, // Add state restoration lock to prevent cycling
    lastStateUpdateTime: 0 // Timestamp to throttle updates
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

  // Throttled save function to prevent excessive storage operations
  const saveDialogState = useCallback(() => {
    const currentTime = Date.now();
    
    // Throttle updates to once per second max
    if (currentTime - visibilityRef.current.lastStateUpdateTime < 1000) {
      console.log("Skipping save operation due to throttling");
      return;
    }
    
    visibilityRef.current.lastStateUpdateTime = currentTime;
    const currentDialog = getCurrentActiveDialog();
    console.log("Saving dialog state, active dialog:", currentDialog);
    
    // Don't save if we're not in an active dialog process
    if (!currentDialog) {
      console.log("No active dialog to save, skipping save operation");
      return;
    }
    
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
    
    visibilityRef.current.stateWasSaved = true;
      
    console.log("Dialog state saved:", visibilityRef.current);
    
    // Save to session storage as a backup - using a unique key for each dialog type
    // to prevent conflicts between different dialog states
    try {
      const storageKey = `dialogState_${currentDialog}`;
      sessionStorage.setItem(storageKey, JSON.stringify({
        lastActiveDialog: currentDialog,
        dialogState: visibilityRef.current.dialogState,
        dialogsInProgress: visibilityRef.current.dialogsInProgress,
        advertisingGoal,
        socialMediaPlatform,
        emailStyle,
        selectedAudienceId,
        timestamp: currentTime
      }));
      console.log("Dialog state saved to session storage with key:", storageKey);
    } catch (err) {
      console.error("Failed to save dialog state to session storage:", err);
    }
  }, [
    getCurrentActiveDialog,
    showForm,
    showGoalDialog,
    showEmailStyleDialog,
    showSocialMediaPlatformDialog,
    showScriptDialog,
    showEmailDialog,
    advertisingGoal,
    socialMediaPlatform, 
    emailStyle,
    selectedAudienceId
  ]);

  // Restore dialog state when tab becomes visible again
  const restoreDialogState = useCallback(() => {
    // Prevent state restoration cycling by using a lock
    if (visibilityRef.current.stateRestorationLock) {
      console.log("State restoration is locked, skipping...");
      return false;
    }
    
    // Set the lock before attempting restoration
    visibilityRef.current.stateRestorationLock = true;
    
    // Get current dialog to determine which state to restore
    const currentDialog = getCurrentActiveDialog();
    const storageKey = currentDialog ? `dialogState_${currentDialog}` : null;
    
    // Try to get state from session storage first
    try {
      // If we have a current dialog, try to restore that specific state
      if (storageKey) {
        const savedStateJson = sessionStorage.getItem(storageKey);
        if (savedStateJson) {
          const savedState = JSON.parse(savedStateJson);
          console.log("Restoring dialog state from session storage for:", currentDialog, savedState);
          
          // Only restore if saved state is less than 5 minutes old
          const isStale = Date.now() - savedState.timestamp > 5 * 60 * 1000;
          if (isStale) {
            console.log("Saved state is too old, skipping restoration");
            visibilityRef.current.stateRestorationLock = false;
            return false;
          }
          
          if (savedState.dialogsInProgress) {
            // Prevent switching between dialogs - only restore if it matches current dialog
            if (savedState.lastActiveDialog === currentDialog) {
              console.log("Restoring matching dialog state:", savedState.lastActiveDialog);
              
              // Release lock after a timeout to allow the state to settle
              setTimeout(() => {
                visibilityRef.current.stateRestorationLock = false;
              }, 2000);
              
              return true;
            } else {
              console.log("Current dialog doesn't match saved dialog, not restoring");
            }
          }
        }
      }
    } catch (err) {
      console.error("Error restoring dialog state from session storage:", err);
    }
    
    // Fall back to in-memory state if session storage failed
    const savedState = visibilityRef.current;
    console.log("Checking in-memory state:", savedState);
    
    if (!savedState.stateWasSaved) {
      console.log("No saved state found, nothing to restore");
      visibilityRef.current.stateRestorationLock = false;
      return false;
    }
    
    // Release lock after timeout
    setTimeout(() => {
      visibilityRef.current.stateRestorationLock = false;
    }, 2000);
    
    return false;
  }, [getCurrentActiveDialog]);

  // Monitor page visibility with improved state handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !visibilityRef.current.wasFocused) {
        // Tab is now visible again after being hidden
        console.log("Tab became visible again");
        visibilityRef.current.wasFocused = true;
        
        // Add a small delay before restoration to prevent race conditions
        setTimeout(() => {
          const restored = restoreDialogState();
          if (restored) {
            console.log("Dialog state successfully restored");
          } else {
            console.log("No dialog state to restore or restoration failed");
          }
        }, 500);
      } else if (document.visibilityState === 'hidden') {
        // Tab is now hidden
        console.log("Tab became hidden - saving dialog state");
        visibilityRef.current.wasFocused = false;
        saveDialogState();
      }
    };

    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Check if we need to restore state on mount
    if (document.visibilityState === 'visible') {
      // Wrap in setTimeout to ensure component is fully mounted
      setTimeout(() => {
        const restored = restoreDialogState();
        if (restored) {
          console.log("Dialog state restored on component mount");
        }
      }, 500);
    }
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    saveDialogState,
    restoreDialogState
  ]);

  // Update current dialog state whenever dialogs change - but with throttling
  useEffect(() => {
    // Only update if page is visible to avoid interference with visibility handling
    if (document.visibilityState === 'visible') {
      const currentDialog = getCurrentActiveDialog();
      
      // Use throttling to prevent excessive updates
      const currentTime = Date.now();
      if (currentTime - visibilityRef.current.lastStateUpdateTime < 1000) {
        return; // Skip this update if less than 1 second since last update
      }
      
      if (currentDialog) {
        visibilityRef.current.lastActiveDialog = currentDialog;
        visibilityRef.current.dialogsInProgress = true;
        
        // Save state whenever dialog state changes while page is visible
        saveDialogState();
      } else {
        visibilityRef.current.dialogsInProgress = false;
      }
    }
  }, [
    getCurrentActiveDialog,
    saveDialogState,
    showForm, 
    showGoalDialog, 
    showEmailStyleDialog, 
    showSocialMediaPlatformDialog, 
    showScriptDialog, 
    showEmailDialog
  ]);

  // Reset all state - implementacja z useCallback dla stabilności referencji
  const resetState = useCallback(() => {
    console.log("Resetting all dialog state");
    
    // Clear all session storage keys
    try {
      sessionStorage.removeItem('dialogState_script');
      sessionStorage.removeItem('dialogState_goal');
      sessionStorage.removeItem('dialogState_form');
      sessionStorage.removeItem('dialogState_email');
      sessionStorage.removeItem('dialogState_emailStyle');
      sessionStorage.removeItem('dialogState_socialMedia');
      sessionStorage.removeItem('dialogState_social');
      sessionStorage.removeItem('dialogState'); // legacy key
    } catch (err) {
      console.error("Failed to clear dialog state from session storage:", err);
    }
    
    // Reset all state variables
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
    setIsProcessing(false); // Important: reset processing state
    setIsTransitioning(false); // Reset transition state
    
    // Reset visibility tracking
    visibilityRef.current.dialogsInProgress = false;
    visibilityRef.current.lastActiveDialog = null;
    visibilityRef.current.stateWasSaved = false;
    visibilityRef.current.stateRestorationLock = false;
    visibilityRef.current.lastStateUpdateTime = 0;
    
    console.log("Dialog state reset completed");
  }, []);
  
  // Sequential dialog transitions to prevent flashing - with improved locking
  const transitionToDialog = useCallback((closeDialog: () => void, openDialog: () => void) => {
    setIsTransitioning(true);
    
    // Set a lock during transition
    visibilityRef.current.stateRestorationLock = true;
    
    console.log("Starting dialog transition");
    
    // First close current dialog
    closeDialog();
    
    // Then open next dialog with delay
    setTimeout(() => {
      openDialog();
      setIsTransitioning(false);
      setIsProcessing(false);
      
      // Release lock after transition is complete
      setTimeout(() => {
        visibilityRef.current.stateRestorationLock = false;
        console.log("Dialog transition completed, lock released");
      }, 1000);
    }, 300);
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
    showSocialDialog,
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
    setShowSocialDialog,
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
