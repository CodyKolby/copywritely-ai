
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
  setAdvertisingGoal: (goal: string) => void;
  setEmailStyle: (style: EmailStyle | null) => void;
  setSocialMediaPlatform: (platform: SocialMediaPlatform | null) => void;
  setIsProcessing: (processing: boolean) => void;
}

export const useDialogNavigation = (params: DialogNavigationProps, templateId: string | undefined) => {
  const {
    setShowForm,
    setShowGoalDialog,
    setShowEmailStyleDialog,
    setShowSocialMediaPlatformDialog,
    setShowScriptDialog,
    setShowEmailDialog,
    setAdvertisingGoal,
    setEmailStyle,
    setSocialMediaPlatform,
    setIsProcessing,
  } = params;

  // Step back from form to audience selection
  const handleBack = useCallback(() => {
    setShowForm(false);
  }, [setShowForm]);

  // Step back from goal to audience
  const handleGoalBack = useCallback(() => {
    setShowGoalDialog(false);
    setShowForm(true);
  }, [setShowGoalDialog, setShowForm]);
  
  // Submit goal and move to appropriate next dialog
  const handleGoalSubmit = useCallback((goal: string) => {
    setIsProcessing(true);
    
    setAdvertisingGoal(goal);
    
    // Determine next dialog based on template
    if (templateId === 'email') {
      setShowGoalDialog(false);
      setShowEmailStyleDialog(true);
    } else if (templateId === 'social') {
      setShowGoalDialog(false);
      setShowSocialMediaPlatformDialog(true);
    } else {
      setShowGoalDialog(false);
      setShowScriptDialog(true);
    }
    
    setIsProcessing(false);
  }, [
    setIsProcessing,
    setAdvertisingGoal,
    templateId,
    setShowGoalDialog,
    setShowEmailStyleDialog,
    setShowSocialMediaPlatformDialog,
    setShowScriptDialog
  ]);
  
  // Step back from email style to goal
  const handleEmailStyleBack = useCallback(() => {
    setShowEmailStyleDialog(false);
    setShowGoalDialog(true);
  }, [setShowEmailStyleDialog, setShowGoalDialog]);
  
  // Submit email style and go to email dialog
  const handleEmailStyleSubmit = useCallback((style: EmailStyle) => {
    setIsProcessing(true);
    
    setEmailStyle(style);
    
    setShowEmailStyleDialog(false);
    setShowEmailDialog(true);
    
    setIsProcessing(false);
  }, [setIsProcessing, setEmailStyle, setShowEmailStyleDialog, setShowEmailDialog]);
  
  // Step back from social media platform to goal
  const handleSocialMediaPlatformBack = useCallback(() => {
    setShowSocialMediaPlatformDialog(false);
    setShowGoalDialog(true);
  }, [setShowSocialMediaPlatformDialog, setShowGoalDialog]);
  
  // Submit social media platform and go to script dialog
  const handleSocialMediaPlatformSubmit = useCallback((platform: SocialMediaPlatform) => {
    setIsProcessing(true);
    
    setSocialMediaPlatform(platform);
    
    setShowSocialMediaPlatformDialog(false);
    setShowScriptDialog(true);
    
    setIsProcessing(false);
  }, [setIsProcessing, setSocialMediaPlatform, setShowSocialMediaPlatformDialog, setShowScriptDialog]);

  // Close script dialog
  const handleScriptDialogClose = useCallback(() => {
    setShowScriptDialog(false);
  }, [setShowScriptDialog]);
  
  // Close email dialog
  const handleEmailDialogClose = useCallback(() => {
    setShowEmailDialog(false);
  }, [setShowEmailDialog]);

  return {
    handleBack,
    handleGoalSubmit,
    handleGoalBack,
    handleEmailStyleSubmit,
    handleEmailStyleBack,
    handleSocialMediaPlatformSubmit,
    handleSocialMediaPlatformBack,
    handleScriptDialogClose,
    handleEmailDialogClose
  };
};
