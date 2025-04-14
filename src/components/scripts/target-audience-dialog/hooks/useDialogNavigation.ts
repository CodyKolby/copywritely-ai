
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
  onOpenChange: (open: boolean) => void;
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
    onOpenChange,
  } = props;

  // Handle going back from the form to the audience selection
  const handleBack = useCallback(() => {
    // First reset processing state
    setIsProcessing(false);
    
    // Then change dialogs
    setShowForm(false);
  }, [setShowForm, setIsProcessing]);

  // Handle going back from the goal dialog to the audience selection dialog directly
  const handleGoalBack = useCallback(() => {
    // First reset processing state
    setIsProcessing(false);
    
    // Close the goal dialog completely
    setShowGoalDialog(false);
    
    // Close the main dialog to prevent flickering
    onOpenChange(false);
    
    // Reopen the main dialog after a short delay
    setTimeout(() => {
      onOpenChange(true);
    }, 50);
    
  }, [setShowGoalDialog, setIsProcessing, onOpenChange]);

  // Handle goal submission
  const handleGoalSubmit = useCallback((goal: string) => {
    // Store the goal value first
    setAdvertisingGoal(goal);
    
    // Update processing state
    setIsProcessing(true);
    
    // First hide current dialog without delay
    setShowGoalDialog(false);
    
    // Close the main dialog completely to prevent background visibility
    onOpenChange(false);
    
    // Determine and open the next dialog after a short delay
    setTimeout(() => {
      // First re-open the main container dialog
      onOpenChange(true);
      
      // Then after a tiny delay, show the appropriate next dialog
      setTimeout(() => {
        if (templateId === 'email') {
          setShowEmailStyleDialog(true);
        } else if (templateId === 'social') {
          setShowSocialMediaPlatformDialog(true);
        } else {
          // For ad templates, show the script dialog directly
          setShowScriptDialog(true);
        }
        
        // Reset processing state after everything is shown
        setTimeout(() => {
          setIsProcessing(false);
        }, 100);
      }, 50);
    }, 100);
  }, [
    templateId, setAdvertisingGoal, setShowGoalDialog, setShowEmailStyleDialog,
    setShowSocialMediaPlatformDialog, setShowScriptDialog, setIsProcessing, onOpenChange
  ]);

  // Handle going back from the email style dialog
  const handleEmailStyleBack = useCallback(() => {
    // Reset processing state
    setIsProcessing(false);
    
    // Close current dialog
    setShowEmailStyleDialog(false);
    
    // Close the main dialog completely to prevent background visibility
    onOpenChange(false);
    
    // Reopen dialogs in correct sequence
    setTimeout(() => {
      onOpenChange(true);
      
      setTimeout(() => {
        setShowGoalDialog(true);
      }, 50);
    }, 100);
  }, [setShowEmailStyleDialog, setShowGoalDialog, setIsProcessing, onOpenChange]);

  // Handle email style submission
  const handleEmailStyleSubmit = useCallback((style: EmailStyle) => {
    // Store the style value first
    setEmailStyle(style);
    
    // Update processing state
    setIsProcessing(true);
    
    // Hide current dialog
    setShowEmailStyleDialog(false);
    
    // Close the main dialog completely to prevent background visibility
    onOpenChange(false);
    
    // Determine and open the next dialog after a short delay
    setTimeout(() => {
      // First re-open the main container dialog
      onOpenChange(true);
      
      // Then after a tiny delay, show the next dialog
      setTimeout(() => {
        setShowEmailDialog(true);
        
        // Reset processing state after everything is shown
        setTimeout(() => {
          setIsProcessing(false);
        }, 100);
      }, 50);
    }, 100);
  }, [setEmailStyle, setShowEmailStyleDialog, setShowEmailDialog, setIsProcessing, onOpenChange]);

  // Handle going back from the social media platform dialog
  const handleSocialMediaPlatformBack = useCallback(() => {
    // Reset processing state
    setIsProcessing(false);
    
    // Close current dialog
    setShowSocialMediaPlatformDialog(false);
    
    // Close the main dialog completely to prevent background visibility
    onOpenChange(false);
    
    // Reopen dialogs in correct sequence
    setTimeout(() => {
      onOpenChange(true);
      
      setTimeout(() => {
        setShowGoalDialog(true);
      }, 50);
    }, 100);
  }, [setShowSocialMediaPlatformDialog, setShowGoalDialog, setIsProcessing, onOpenChange]);

  // Handle social media platform submission
  const handleSocialMediaPlatformSubmit = useCallback((platform: SocialMediaPlatform) => {
    // Store the platform value first
    setSocialMediaPlatform(platform);
    
    // Update processing state
    setIsProcessing(true);
    
    // Hide current dialog
    setShowSocialMediaPlatformDialog(false);
    
    // Close the main dialog completely to prevent background visibility
    onOpenChange(false);
    
    // Determine and open the next dialog after a short delay
    setTimeout(() => {
      // First re-open the main container dialog
      onOpenChange(true);
      
      // Then after a tiny delay, show the next dialog
      setTimeout(() => {
        setShowSocialDialog(true);
        
        // Reset processing state after everything is shown
        setTimeout(() => {
          setIsProcessing(false);
        }, 100);
      }, 50);
    }, 100);
  }, [
    setSocialMediaPlatform, setShowSocialMediaPlatformDialog, 
    setShowSocialDialog, setIsProcessing, onOpenChange
  ]);

  // Handle closing the script dialog
  const handleScriptDialogClose = useCallback(() => {
    setIsProcessing(false);  // Reset processing state
    setShowScriptDialog(false);
    // Close the parent dialog as well
    onOpenChange(false);
  }, [setShowScriptDialog, setIsProcessing, onOpenChange]);

  // Handle closing the email dialog
  const handleEmailDialogClose = useCallback(() => {
    setIsProcessing(false);  // Reset processing state
    setShowEmailDialog(false);
    // Close the parent dialog as well
    onOpenChange(false);
  }, [setShowEmailDialog, setIsProcessing, onOpenChange]);
  
  // Handle closing the social dialog
  const handleSocialDialogClose = useCallback(() => {
    setIsProcessing(false);  // Reset processing state
    setShowSocialDialog(false);
    // Close the parent dialog as well
    onOpenChange(false);
  }, [setShowSocialDialog, setIsProcessing, onOpenChange]);

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
