
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
  // Dodane nowe zależności
  isTransitioning: boolean;
  transitionToDialog: (closeDialog: () => void, openDialog: () => void) => void;
}

export const useDialogNavigation = (deps: DialogNavigationDeps, templateId: string) => {
  // Back button handler for main flow
  const handleBack = useCallback(() => {
    console.log("Navigation: going back to main selection");
    deps.setShowForm(false);
    deps.setIsProcessing(false);
  }, [deps]);

  // Goal submission handler
  const handleGoalSubmit = useCallback((goal: string) => {
    console.log(`Goal submitted: ${goal}, template: ${templateId}`);
    // Ustaw dane
    deps.setAdvertisingGoal(goal);
    deps.setIsProcessing(true);
    
    // Wykonaj przejście do odpowiedniego dialogu bazując na typie szablonu
    const closeCurrentDialog = () => deps.setShowGoalDialog(false);
    
    let openNextDialog;
    if (templateId === 'social') {
      openNextDialog = () => deps.setShowSocialMediaPlatformDialog(true);
    } else if (templateId === 'email') {
      openNextDialog = () => deps.setShowEmailStyleDialog(true);
    } else {
      openNextDialog = () => deps.setShowScriptDialog(true);
    }
    
    deps.transitionToDialog(closeCurrentDialog, openNextDialog);
  }, [deps, templateId]);

  // Goal back button handler
  const handleGoalBack = useCallback(() => {
    console.log("Navigation: going back from goal dialog");
    deps.setIsProcessing(true);
    
    deps.transitionToDialog(
      () => deps.setShowGoalDialog(false),
      () => deps.setIsProcessing(false)
    );
  }, [deps]);

  // Email style submission handler
  const handleEmailStyleSubmit = useCallback((style: EmailStyle) => {
    console.log(`Email style submitted: ${style}`);
    deps.setEmailStyle(style);
    deps.setIsProcessing(true);
    
    // Wykonaj płynne przejście do następnego dialogu
    deps.transitionToDialog(
      () => deps.setShowEmailStyleDialog(false),
      () => deps.setShowEmailDialog(true)
    );
  }, [deps]);

  // Email style back button handler
  const handleEmailStyleBack = useCallback(() => {
    console.log("Navigation: going back from email style dialog");
    deps.setIsProcessing(true);
    
    // Wykonaj płynne przejście do poprzedniego dialogu
    deps.transitionToDialog(
      () => deps.setShowEmailStyleDialog(false),
      () => deps.setShowGoalDialog(true)
    );
  }, [deps]);

  // Social media platform submission handler
  const handleSocialMediaPlatformSubmit = useCallback((platform: SocialMediaPlatform) => {
    console.log(`Social media platform submitted: ${platform}`);
    deps.setSocialMediaPlatform(platform);
    deps.setIsProcessing(true);
    
    // Wykonaj płynne przejście do następnego dialogu
    deps.transitionToDialog(
      () => deps.setShowSocialMediaPlatformDialog(false),
      () => deps.setShowScriptDialog(true)
    );
  }, [deps]);

  // Social media platform back button handler
  const handleSocialMediaPlatformBack = useCallback(() => {
    console.log("Navigation: going back from social media platform dialog");
    deps.setIsProcessing(true);
    
    // Wykonaj płynne przejście do poprzedniego dialogu
    deps.transitionToDialog(
      () => deps.setShowSocialMediaPlatformDialog(false),
      () => deps.setShowGoalDialog(true)
    );
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
