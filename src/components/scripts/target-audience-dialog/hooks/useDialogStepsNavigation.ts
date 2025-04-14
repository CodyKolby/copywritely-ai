
import { useCallback } from 'react';
import { EmailStyle } from '../../EmailStyleDialog';
import { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';

interface UseDialogStepsNavigationProps {
  templateId: string;
  setIsProcessing: (processing: boolean) => void;
  setIsTransitioning?: (transitioning: boolean) => void;
  setAdvertisingGoal: (goal: string) => void;
  setEmailStyle: (style: EmailStyle) => void;
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
 * Hook for handling navigation within the dialog steps
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
}: UseDialogStepsNavigationProps) => {

  // Goal dialog handlers
  const handleGoalSubmit = useCallback((goal: string) => {
    setAdvertisingGoal(goal);
    setIsProcessing(true);
    
    setTimeout(() => {
      setShowGoalDialog(false);
      
      // After hiding goal dialog, determine next step based on template
      if (templateId === 'email') {
        setTimeout(() => setShowEmailStyleDialog(true), 100);
      } else if (templateId === 'social') {
        setTimeout(() => setShowSocialMediaPlatformDialog(true), 100);
      } else {
        // For ad templates or fallback
        setTimeout(() => {
          if (templateId === 'ad') {
            setShowScriptDialog(true);
          }
        }, 100);
      }
    }, 300);
  }, [setAdvertisingGoal, setIsProcessing, setShowGoalDialog, templateId, 
      setShowEmailStyleDialog, setShowSocialMediaPlatformDialog, setShowScriptDialog]);

  const handleGoalBack = useCallback(() => {
    if (setIsTransitioning) setIsTransitioning(true);
    
    setTimeout(() => {
      setShowGoalDialog(false);
      if (setIsTransitioning) setIsTransitioning(false);
      onOpenChange(false);
    }, 300);
  }, [setIsTransitioning, setShowGoalDialog, onOpenChange]);

  // Email style dialog handlers
  const handleEmailStyleSubmit = useCallback((style: EmailStyle) => {
    setEmailStyle(style);
    setIsProcessing(true);
    
    setTimeout(() => {
      setShowEmailStyleDialog(false);
      setTimeout(() => {
        setShowEmailDialog(true);
      }, 100);
    }, 300);
  }, [setEmailStyle, setIsProcessing, setShowEmailStyleDialog, setShowEmailDialog]);

  const handleEmailStyleBack = useCallback(() => {
    if (setIsTransitioning) setIsTransitioning(true);
    
    setTimeout(() => {
      setShowEmailStyleDialog(false);
      setShowGoalDialog(true);
      if (setIsTransitioning) setIsTransitioning(false);
    }, 300);
  }, [setIsTransitioning, setShowEmailStyleDialog, setShowGoalDialog]);

  // Social media platform dialog handlers
  const handleSocialMediaPlatformSubmit = useCallback((platform: SocialMediaPlatform) => {
    setSocialMediaPlatform(platform);
    setIsProcessing(true);
    
    setTimeout(() => {
      setShowSocialMediaPlatformDialog(false);
      setTimeout(() => {
        setShowSocialDialog(true);
      }, 100);
    }, 300);
  }, [setSocialMediaPlatform, setIsProcessing, setShowSocialMediaPlatformDialog, setShowSocialDialog]);

  const handleSocialMediaPlatformBack = useCallback(() => {
    if (setIsTransitioning) setIsTransitioning(true);
    
    setTimeout(() => {
      setShowSocialMediaPlatformDialog(false);
      setShowGoalDialog(true);
      if (setIsTransitioning) setIsTransitioning(false);
    }, 300);
  }, [setIsTransitioning, setShowSocialMediaPlatformDialog, setShowGoalDialog]);

  // Result dialog close handlers
  const handleScriptDialogClose = useCallback(() => {
    setShowScriptDialog(false);
    onOpenChange(false);
  }, [setShowScriptDialog, onOpenChange]);

  const handleEmailDialogClose = useCallback(() => {
    setShowEmailDialog(false);
    onOpenChange(false);
  }, [setShowEmailDialog, onOpenChange]);

  const handleSocialDialogClose = useCallback(() => {
    setShowSocialDialog(false);
    onOpenChange(false);
  }, [setShowSocialDialog, onOpenChange]);

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
