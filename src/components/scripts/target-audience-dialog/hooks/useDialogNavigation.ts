
import { useCallback } from 'react';
import { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';
import { EmailStyle } from '../../EmailStyleDialog';

interface DialogNavigationProps {
  setShowForm: (show: boolean) => void;
  setShowGoalDialog: (show: boolean) => void;
  setShowEmailStyleDialog: (show: boolean) => void;
  setShowSocialMediaPlatformDialog: (show: boolean) => void;
  setShowScriptDialog: (show: boolean) => void;
  setShowEmailDialog: (show: boolean) => void;
  setShowSocialDialog: (show: boolean) => void;
  setAdvertisingGoal: (goal: string) => void;
  setEmailStyle: (style: EmailStyle | null) => void;
  setSocialMediaPlatform: (platform: SocialMediaPlatform | null) => void;
  setIsProcessing: (isProcessing: boolean) => void;
}

export const useDialogNavigation = (
  props: DialogNavigationProps,
  templateId: string
) => {
  const {
    setShowForm,
    setShowGoalDialog,
    setShowEmailStyleDialog,
    setShowSocialMediaPlatformDialog,
    setShowScriptDialog,
    setShowEmailDialog,
    setShowSocialDialog,
    setAdvertisingGoal,
    setEmailStyle,
    setSocialMediaPlatform,
    setIsProcessing,
  } = props;

  // Handle going back from the goal dialog to the audience selection/form
  const handleBack = useCallback(() => {
    setShowForm(false);
    setIsProcessing(false);  // Reset processing state
  }, [setShowForm, setIsProcessing]);

  // Handle going back from the goal dialog
  const handleGoalBack = useCallback(() => {
    setIsProcessing(false);  // Reset processing state
    setShowGoalDialog(false);
    setShowForm(true);
  }, [setShowGoalDialog, setShowForm, setIsProcessing]);

  // Handle goal submission
  const handleGoalSubmit = useCallback((goal: string) => {
    setIsProcessing(true);
    setAdvertisingGoal(goal);
    setShowGoalDialog(false);
    
    // Route to the appropriate next dialog based on template type
    setTimeout(() => {
      if (templateId === 'email') {
        setShowEmailStyleDialog(true);
      } else if (templateId === 'social') {
        setShowSocialMediaPlatformDialog(true);
      } else {
        // For ad templates, show the script dialog directly
        setShowScriptDialog(true);
      }
      setIsProcessing(false);
    }, 50);
  }, [templateId, setAdvertisingGoal, setShowGoalDialog, setShowEmailStyleDialog, 
      setShowSocialMediaPlatformDialog, setShowScriptDialog, setIsProcessing]);

  // Handle going back from the email style dialog
  const handleEmailStyleBack = useCallback(() => {
    setIsProcessing(false);  // Reset processing state
    setShowEmailStyleDialog(false);
    setShowGoalDialog(true);
  }, [setShowEmailStyleDialog, setShowGoalDialog, setIsProcessing]);

  // Handle email style submission
  const handleEmailStyleSubmit = useCallback((style: EmailStyle) => {
    setIsProcessing(true);
    setEmailStyle(style);
    setShowEmailStyleDialog(false);
    
    setTimeout(() => {
      setShowEmailDialog(true);
      setIsProcessing(false);
    }, 50);
  }, [setEmailStyle, setShowEmailStyleDialog, setShowEmailDialog, setIsProcessing]);

  // Handle going back from the social media platform dialog
  const handleSocialMediaPlatformBack = useCallback(() => {
    setIsProcessing(false);  // Reset processing state
    setShowSocialMediaPlatformDialog(false);
    setShowGoalDialog(true);
  }, [setShowSocialMediaPlatformDialog, setShowGoalDialog, setIsProcessing]);

  // Handle social media platform submission
  const handleSocialMediaPlatformSubmit = useCallback((platform: SocialMediaPlatform) => {
    setIsProcessing(true);
    setSocialMediaPlatform(platform);
    setShowSocialMediaPlatformDialog(false);
    
    setTimeout(() => {
      setShowSocialDialog(true);
      setIsProcessing(false);
    }, 50);
  }, [setSocialMediaPlatform, setShowSocialMediaPlatformDialog, setShowSocialDialog, setIsProcessing]);

  // Handle closing the script dialog
  const handleScriptDialogClose = useCallback(() => {
    setIsProcessing(false);  // Reset processing state
    setShowScriptDialog(false);
  }, [setShowScriptDialog, setIsProcessing]);

  // Handle closing the email dialog
  const handleEmailDialogClose = useCallback(() => {
    setIsProcessing(false);  // Reset processing state
    setShowEmailDialog(false);
  }, [setShowEmailDialog, setIsProcessing]);
  
  // Handle closing the social dialog
  const handleSocialDialogClose = useCallback(() => {
    setIsProcessing(false);  // Reset processing state
    setShowSocialDialog(false);
  }, [setShowSocialDialog, setIsProcessing]);

  return {
    handleBack,
    handleGoalSubmit,
    handleGoalBack,
    handleEmailStyleSubmit,
    handleEmailStyleBack,
    handleSocialMediaPlatformSubmit,
    handleSocialMediaPlatformBack,
    handleScriptDialogClose,
    handleEmailDialogClose,
    handleSocialDialogClose,
  };
};
