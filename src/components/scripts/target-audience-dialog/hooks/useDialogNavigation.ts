
import { useCallback } from "react";
import { EmailStyle } from "../../EmailStyleDialog";
import { SocialMediaPlatform } from "../../SocialMediaPlatformDialog";

export interface DialogNavigationDeps {
  setShowForm: (value: boolean) => void;
  setShowGoalDialog: (value: boolean) => void;
  setShowEmailStyleDialog: (value: boolean) => void;
  setShowSocialMediaPlatformDialog: (value: boolean) => void;
  setShowScriptDialog: (value: boolean) => void;
  setShowEmailDialog: (value: boolean) => void;
  setAdvertisingGoal: (value: string) => void;
  setEmailStyle: (value: EmailStyle | null) => void;
  setSocialMediaPlatform: (value: SocialMediaPlatform | null) => void;
  setIsProcessing: (value: boolean) => void;
  // Dependencies for transitions
  isTransitioning: boolean;
  transitionToDialog: (closeDialog: () => void, openDialog: () => void) => void;
}

export const useDialogNavigation = (deps: DialogNavigationDeps, templateId: string) => {
  // Back button handler for main flow
  const handleBack = useCallback(() => {
    console.log("Navigation: going back to main selection");
    deps.setIsProcessing(false);
    deps.setShowForm(false);
  }, [deps]);

  // Goal submission handler
  const handleGoalSubmit = useCallback((goal: string) => {
    console.log(`Goal submitted: ${goal}, template: ${templateId}`);
    // Set data
    deps.setAdvertisingGoal(goal);
    
    // Choose the next dialog based on template type - RESTORED ORIGINAL WORKFLOW
    if (templateId === 'social') {
      console.log("Social template: transitioning to social media platform dialog");
      deps.setShowGoalDialog(false);
      deps.setShowSocialMediaPlatformDialog(true);
    } else if (templateId === 'email') {
      console.log("Email template: transitioning to email style dialog");
      deps.setShowGoalDialog(false);
      deps.setShowEmailStyleDialog(true);
    } else {
      console.log("Other template: transitioning directly to script dialog");
      deps.setShowGoalDialog(false);
      deps.setShowScriptDialog(true);
    }
  }, [deps, templateId]);

  // Goal back button handler
  const handleGoalBack = useCallback(() => {
    console.log("Navigation: going back from goal dialog");
    deps.setShowGoalDialog(false);
    deps.setIsProcessing(false);
  }, [deps]);

  // Email style submission handler
  const handleEmailStyleSubmit = useCallback((style: EmailStyle) => {
    console.log(`Email style submitted: ${style}`);
    deps.setEmailStyle(style);
    
    // Transition to email dialog
    deps.setShowEmailStyleDialog(false);
    deps.setShowEmailDialog(true);
  }, [deps]);

  // Email style back button handler
  const handleEmailStyleBack = useCallback(() => {
    console.log("Navigation: going back from email style dialog");
    
    // Transition to goal dialog
    deps.setShowEmailStyleDialog(false);
    deps.setShowGoalDialog(true);
  }, [deps]);

  // Social media platform submission handler
  const handleSocialMediaPlatformSubmit = useCallback((platform: SocialMediaPlatform) => {
    console.log(`Social media platform submitted: ${platform}`);
    deps.setSocialMediaPlatform(platform);
    
    // Transition to script dialog
    deps.setShowSocialMediaPlatformDialog(false);
    deps.setShowScriptDialog(true);
  }, [deps]);

  // Social media platform back button handler
  const handleSocialMediaPlatformBack = useCallback(() => {
    console.log("Navigation: going back from social media platform dialog");
    
    // Transition to goal dialog
    deps.setShowSocialMediaPlatformDialog(false);
    deps.setShowGoalDialog(true);
  }, [deps]);

  // Script dialog close handler
  const handleScriptDialogClose = useCallback(() => {
    console.log("Navigation: closing script dialog");
    deps.setShowScriptDialog(false);
    deps.setIsProcessing(false);
  }, [deps]);

  // Email dialog close handler
  const handleEmailDialogClose = useCallback(() => {
    console.log("Navigation: closing email dialog");
    deps.setShowEmailDialog(false);
    deps.setIsProcessing(false);
  }, [deps]);

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
  };
};
