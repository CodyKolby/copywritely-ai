
import { useCallback } from 'react';
import { EmailStyle } from '../../EmailStyleDialog';
import { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';

interface DialogStepsNavigationProps {
  templateId: string;
  setIsProcessing: (isProcessing: boolean) => void;
  setIsTransitioning: (isTransitioning: boolean) => void;
  setAdvertisingGoal: (goal: string) => void;
  setEmailStyle: (style: string) => void;
  setSocialMediaPlatform: (platform: SocialMediaPlatform | undefined) => void;
  setShowGoalDialog: (show: boolean) => void;
  setShowEmailStyleDialog: (show: boolean) => void;
  setShowSocialMediaPlatformDialog: (show: boolean) => void;
  setShowScriptDialog: (show: boolean) => void;
  setShowEmailDialog: (show: boolean) => void;
  setShowSocialDialog: (show: boolean) => void;
  onOpenChange: (open: boolean) => void;
}

/**
 * Hook for handling navigation between dialog steps
 */
export const useDialogStepsNavigation = ({
  templateId,
  setIsProcessing,
  setIsTransitioning,
  setAdvertisingGoal,
  setEmailStyle,
  setSocialMediaPlatform,
  setShowGoalDialog,
  setShowEmailStyleDialog,
  setShowSocialMediaPlatformDialog,
  setShowScriptDialog,
  setShowEmailDialog,
  setShowSocialDialog,
  onOpenChange
}: DialogStepsNavigationProps) => {
  // Handle goal submission
  const handleGoalSubmit = useCallback((goal: string) => {
    setAdvertisingGoal(goal);
    setIsProcessing(true);
    setIsTransitioning(true);
    
    // Different next steps based on template
    if (templateId === 'email') {
      // For email, go to email style selection
      setTimeout(() => {
        setShowGoalDialog(false);
        setShowEmailStyleDialog(true);
        setIsTransitioning(false);
        setIsProcessing(false);
      }, 300);
    } else if (templateId === 'social') {
      // For social, go to platform selection
      setTimeout(() => {
        setShowGoalDialog(false);
        setShowSocialMediaPlatformDialog(true);
        setIsTransitioning(false);
        setIsProcessing(false);
      }, 300);
    } else {
      // For other templates, go straight to script generation
      setTimeout(() => {
        setShowGoalDialog(false);
        setShowScriptDialog(true);
        setIsTransitioning(false);
        setIsProcessing(false);
      }, 300);
    }
  }, [templateId]);

  // Handle back button in goal dialog
  const handleGoalBack = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowGoalDialog(false);
      setIsTransitioning(false);
    }, 300);
  }, []);

  // Handle email style submission
  const handleEmailStyleSubmit = useCallback((style: EmailStyle) => {
    setEmailStyle(style);
    setIsProcessing(true);
    setIsTransitioning(true);
    setTimeout(() => {
      setShowEmailStyleDialog(false);
      setShowEmailDialog(true);
      setIsTransitioning(false);
      setIsProcessing(false);
    }, 300);
  }, []);

  // Handle back button in email style dialog
  const handleEmailStyleBack = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowEmailStyleDialog(false);
      setShowGoalDialog(true);
      setIsTransitioning(false);
    }, 300);
  }, []);

  // Handle social media platform submission
  const handleSocialMediaPlatformSubmit = useCallback((platform: SocialMediaPlatform) => {
    setSocialMediaPlatform(platform);
    setIsProcessing(true);
    setIsTransitioning(true);
    setTimeout(() => {
      setShowSocialMediaPlatformDialog(false);
      setShowSocialDialog(true);
      setIsTransitioning(false);
      setIsProcessing(false);
    }, 300);
  }, []);

  // Handle back button in social media platform dialog
  const handleSocialMediaPlatformBack = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowSocialMediaPlatformDialog(false);
      setShowGoalDialog(true);
      setIsTransitioning(false);
    }, 300);
  }, []);

  // Handle dialog closures
  const handleScriptDialogClose = useCallback(() => {
    setShowScriptDialog(false);
    onOpenChange(false);
  }, []);

  const handleEmailDialogClose = useCallback(() => {
    setShowEmailDialog(false);
    onOpenChange(false);
  }, []);
  
  const handleSocialDialogClose = useCallback(() => {
    setShowSocialDialog(false);
    onOpenChange(false);
  }, []);

  return {
    handleGoalSubmit,
    handleGoalBack,
    handleEmailStyleSubmit,
    handleEmailStyleBack,
    handleSocialMediaPlatformSubmit,
    handleSocialMediaPlatformBack,
    handleScriptDialogClose,
    handleEmailDialogClose,
    handleSocialDialogClose
  };
};
