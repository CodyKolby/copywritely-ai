
import { useCallback } from 'react';
import { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';
import { EmailStyle } from '../../EmailStyleDialog';

export interface DialogNavigationParams {
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
  setIsProcessing: (processing: boolean) => void;
  isTransitioning: boolean;
  transitionToDialog: (closeDialog: () => void, openDialog: () => void) => void;
}

export const useDialogNavigation = (params: DialogNavigationParams, templateId: string | undefined) => {
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
    isTransitioning,
    transitionToDialog,
  } = params;

  // Step back from goal to audience
  const handleGoalBack = useCallback(() => {
    if (isTransitioning) return;
    console.log('handleGoalBack called');
    
    transitionToDialog(
      () => setShowGoalDialog(false),
      () => setShowForm(true)
    );
  }, [isTransitioning, transitionToDialog, setShowGoalDialog, setShowForm]);
  
  // Submit goal and move to appropriate next dialog
  const handleGoalSubmit = useCallback((goal: string) => {
    if (isTransitioning) return;
    console.log(`handleGoalSubmit called with goal: ${goal} and templateId: ${templateId}`);
    setIsProcessing(true);
    
    setAdvertisingGoal(goal);
    console.log(`Cel reklamy: ${goal}, templateId: ${templateId}`);
    
    // Determine next dialog based on template
    if (templateId === 'email') {
      console.log('Routing to email style dialog');
      transitionToDialog(
        () => setShowGoalDialog(false),
        () => setShowEmailStyleDialog(true)
      );
    } else if (templateId === 'social') {
      console.log('Routing to social media platform dialog');
      transitionToDialog(
        () => setShowGoalDialog(false),
        () => setShowSocialMediaPlatformDialog(true)
      );
    } else {
      // For AD templates and other templates, go directly to script dialog
      console.log("For template", templateId, "going directly to script dialog");
      transitionToDialog(
        () => setShowGoalDialog(false),
        () => setShowScriptDialog(true)
      );
    }
  }, [
    isTransitioning,
    setIsProcessing,
    setAdvertisingGoal,
    templateId,
    transitionToDialog,
    setShowGoalDialog,
    setShowEmailStyleDialog,
    setShowSocialMediaPlatformDialog,
    setShowScriptDialog
  ]);
  
  // Step back from email style to goal
  const handleEmailStyleBack = useCallback(() => {
    if (isTransitioning) return;
    console.log('handleEmailStyleBack called');
    
    transitionToDialog(
      () => setShowEmailStyleDialog(false),
      () => setShowGoalDialog(true)
    );
  }, [isTransitioning, transitionToDialog, setShowEmailStyleDialog, setShowGoalDialog]);
  
  // Submit email style and go to email dialog
  const handleEmailStyleSubmit = useCallback((style: EmailStyle) => {
    if (isTransitioning) return;
    console.log('handleEmailStyleSubmit called with style:', style);
    setIsProcessing(true);
    
    setEmailStyle(style);
    console.log(`Wybrany styl emaila: ${style}`);
    
    transitionToDialog(
      () => setShowEmailStyleDialog(false),
      () => setShowEmailDialog(true)
    );
  }, [isTransitioning, setIsProcessing, setEmailStyle, transitionToDialog, setShowEmailStyleDialog, setShowEmailDialog]);
  
  // Step back from social media platform to goal
  const handleSocialMediaPlatformBack = useCallback(() => {
    if (isTransitioning) return;
    console.log('handleSocialMediaPlatformBack called');
    
    transitionToDialog(
      () => setShowSocialMediaPlatformDialog(false),
      () => setShowGoalDialog(true)
    );
  }, [isTransitioning, transitionToDialog, setShowSocialMediaPlatformDialog, setShowGoalDialog]);
  
  // Submit social media platform and go to social dialog
  const handleSocialMediaPlatformSubmit = useCallback((platform: SocialMediaPlatform) => {
    if (isTransitioning) return;
    console.log('handleSocialMediaPlatformSubmit called with platform:', platform);
    setIsProcessing(true);
    
    setSocialMediaPlatform(platform);
    console.log(`Wybrana platforma social media: ${platform.label}`);
    
    transitionToDialog(
      () => setShowSocialMediaPlatformDialog(false),
      () => setShowSocialDialog(true)
    );
  }, [isTransitioning, setIsProcessing, setSocialMediaPlatform, transitionToDialog, setShowSocialMediaPlatformDialog, setShowSocialDialog]);

  // Close script dialog
  const handleScriptDialogClose = useCallback(() => {
    console.log('handleScriptDialogClose called');
    setShowScriptDialog(false);
  }, [setShowScriptDialog]);
  
  // Close email dialog
  const handleEmailDialogClose = useCallback(() => {
    console.log('handleEmailDialogClose called');
    setShowEmailDialog(false);
  }, [setShowEmailDialog]);
  
  // Close social dialog
  const handleSocialDialogClose = useCallback(() => {
    console.log('handleSocialDialogClose called');
    setShowSocialDialog(false);
  }, [setShowSocialDialog]);

  // Common navigation - back from form to audience selection
  const handleBack = useCallback(() => {
    if (isTransitioning) return;
    console.log('handleBack called');
    
    setShowForm(false);
  }, [isTransitioning, setShowForm]);

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
    handleSocialDialogClose
  };
};
