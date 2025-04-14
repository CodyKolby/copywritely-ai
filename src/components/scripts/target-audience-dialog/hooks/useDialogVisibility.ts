
import { useState, useCallback, useEffect } from 'react';
import { AudienceChoice } from '../types';
import { EmailStyle } from '../../EmailStyleDialog';
import { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';

/**
 * Hook for managing dialog visibility states
 */
export const useDialogVisibility = (open: boolean, templateId: string) => {
  // State for dialog visibility
  const [showForm, setShowForm] = useState(false);
  const [showScriptDialog, setShowScriptDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showSocialDialog, setShowSocialDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showEmailStyleDialog, setShowEmailStyleDialog] = useState(false);
  const [showSocialMediaPlatformDialog, setShowSocialMediaPlatformDialog] = useState(false);
  
  // State for loading and transitions
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Reset dialog visibility states when closed or template changes
  useEffect(() => {
    if (!open) {
      resetVisibility();
    }
  }, [open]);

  // Reset specific dialog states when template changes
  useEffect(() => {
    if (templateId) {
      console.log("Template changed to:", templateId, "- resetting dialog visibility");
      resetVisibility();
    }
  }, [templateId]);

  // Reset all visibility states
  const resetVisibility = useCallback(() => {
    setShowForm(false);
    setShowScriptDialog(false);
    setShowEmailDialog(false);
    setShowSocialDialog(false);
    setShowGoalDialog(false);
    setShowEmailStyleDialog(false);
    setShowSocialMediaPlatformDialog(false);
    setIsProcessing(false);
    setIsTransitioning(false);
  }, []);

  return {
    showForm,
    setShowForm,
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
    isProcessing,
    setIsProcessing,
    isTransitioning,
    setIsTransitioning,
    resetVisibility
  };
};
