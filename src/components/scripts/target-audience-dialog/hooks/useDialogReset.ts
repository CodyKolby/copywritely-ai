
import { useEffect } from 'react';

/**
 * Hook to handle dialog state reset on open/close events or template changes
 */
export const useDialogReset = (
  open: boolean,
  templateId: string,
  resetState: () => void,
  setShowGoalDialog: (show: boolean) => void,
  setShowEmailStyleDialog: (show: boolean) => void,
  setShowSocialMediaPlatformDialog: (show: boolean) => void,
  setShowScriptDialog: (show: boolean) => void,
  setShowEmailDialog: (show: boolean) => void,
  setShowSocialDialog: (show: boolean) => void,
  setAdvertisingGoal: (goal: string) => void,
  setEmailStyle: (style: any) => void,
  setSocialMediaPlatform: (platform: any) => void,
  setIsProcessing: (isProcessing: boolean) => void
) => {
  // Reset state when dialog opens/closes or template changes
  useEffect(() => {
    if (!open) {
      console.log("Dialog is closed, resetting state");
      resetState();
    }
  }, [open, resetState]);

  // Reset specific dialog states when template changes
  useEffect(() => {
    if (templateId) {
      console.log("Template changed to:", templateId, "- resetting dialog flow states");
      
      // Reset dialog flow states to prevent incorrect dialog sequences
      setShowGoalDialog(false);
      setShowEmailStyleDialog(false);
      setShowSocialMediaPlatformDialog(false);
      setShowScriptDialog(false);
      setShowEmailDialog(false);
      setShowSocialDialog(false);
      setAdvertisingGoal('');
      setEmailStyle(null);
      setSocialMediaPlatform(null);
      setIsProcessing(false);
    }
  }, [templateId]);
};
