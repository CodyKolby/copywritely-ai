
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
  }, [setShowForm]);

  // Handle going back from the goal dialog
  const handleGoalBack = useCallback(() => {
    setShowGoalDialog(false);
    setShowForm(true);
  }, [setShowGoalDialog, setShowForm]);

  // Handle goal submission
  const handleGoalSubmit = useCallback((goal: string) => {
    setIsProcessing(true);
    setAdvertisingGoal(goal);
    setShowGoalDialog(false);
    
    // Route to the appropriate next dialog based on template type
    if (templateId === 'email') {
      setShowEmailStyleDialog(true);
    } else if (templateId === 'social') {
      setShowSocialMediaPlatformDialog(true);
    } else {
      // For ad templates, show the script dialog directly
      setShowScriptDialog(true);
    }
    setIsProcessing(false);
  }, [templateId, setAdvertisingGoal, setShowGoalDialog, setShowEmailStyleDialog, 
      setShowSocialMediaPlatformDialog, setShowScriptDialog, setIsProcessing]);

  // Handle going back from the email style dialog
  const handleEmailStyleBack = useCallback(() => {
    setShowEmailStyleDialog(false);
    setShowGoalDialog(true);
  }, [setShowEmailStyleDialog, setShowGoalDialog]);

  // Handle email style submission
  const handleEmailStyleSubmit = useCallback((style: EmailStyle) => {
    setIsProcessing(true);
    setEmailStyle(style);
    setShowEmailStyleDialog(false);
    setShowEmailDialog(true);
    setIsProcessing(false);
  }, [setEmailStyle, setShowEmailStyleDialog, setShowEmailDialog, setIsProcessing]);

  // Handle going back from the social media platform dialog
  const handleSocialMediaPlatformBack = useCallback(() => {
    setShowSocialMediaPlatformDialog(false);
    setShowGoalDialog(true);
  }, [setShowSocialMediaPlatformDialog, setShowGoalDialog]);

  // Handle social media platform submission
  const handleSocialMediaPlatformSubmit = useCallback((platform: SocialMediaPlatform) => {
    setIsProcessing(true);
    setSocialMediaPlatform(platform);
    setShowSocialMediaPlatformDialog(false);
    setShowSocialDialog(true);
    setIsProcessing(false);
  }, [setSocialMediaPlatform, setShowSocialMediaPlatformDialog, setShowSocialDialog, setIsProcessing]);

  // Handle closing the script dialog
  const handleScriptDialogClose = useCallback(() => {
    setShowScriptDialog(false);
  }, [setShowScriptDialog]);

  // Handle closing the email dialog
  const handleEmailDialogClose = useCallback(() => {
    setShowEmailDialog(false);
  }, [setShowEmailDialog]);
  
  // Handle closing the social dialog
  const handleSocialDialogClose = useCallback(() => {
    setShowSocialDialog(false);
  }, [setShowSocialDialog]);

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
