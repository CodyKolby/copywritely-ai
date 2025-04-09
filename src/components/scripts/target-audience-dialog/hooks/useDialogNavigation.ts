
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
  const handleBack = () => {
    deps.setShowForm(false);
    deps.setIsProcessing(false);
  };

  // Goal submission handler
  const handleGoalSubmit = (goal: string) => {
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
  };

  // Goal back button handler
  const handleGoalBack = () => {
    deps.setShowGoalDialog(false);
    deps.setIsProcessing(false);
  };

  // Email style submission handler
  const handleEmailStyleSubmit = (style: EmailStyle) => {
    deps.setEmailStyle(style);
    deps.setIsProcessing(true);
    
    // Wykonaj płynne przejście do następnego dialogu
    deps.transitionToDialog(
      () => deps.setShowEmailStyleDialog(false),
      () => deps.setShowEmailDialog(true)
    );
  };

  // Email style back button handler
  const handleEmailStyleBack = () => {
    deps.setIsProcessing(true);
    
    // Wykonaj płynne przejście do poprzedniego dialogu
    deps.transitionToDialog(
      () => deps.setShowEmailStyleDialog(false),
      () => deps.setShowGoalDialog(true)
    );
  };

  // Social media platform submission handler
  const handleSocialMediaPlatformSubmit = (platform: SocialMediaPlatform) => {
    deps.setSocialMediaPlatform(platform);
    deps.setIsProcessing(true);
    
    // Wykonaj płynne przejście do następnego dialogu
    deps.transitionToDialog(
      () => deps.setShowSocialMediaPlatformDialog(false),
      () => deps.setShowScriptDialog(true)
    );
  };

  // Social media platform back button handler
  const handleSocialMediaPlatformBack = () => {
    deps.setIsProcessing(true);
    
    // Wykonaj płynne przejście do poprzedniego dialogu
    deps.transitionToDialog(
      () => deps.setShowSocialMediaPlatformDialog(false),
      () => deps.setShowGoalDialog(true)
    );
  };

  // Script dialog close handler
  const handleScriptDialogClose = () => {
    deps.setShowScriptDialog(false);
    deps.setIsProcessing(false);
  };

  // Email dialog close handler
  const handleEmailDialogClose = () => {
    deps.setShowEmailDialog(false);
    deps.setIsProcessing(false);
  };

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
