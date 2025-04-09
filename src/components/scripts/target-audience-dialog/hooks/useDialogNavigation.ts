
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
}

export const useDialogNavigation = (deps: DialogNavigationDeps, templateId: string) => {
  // Back button handler for main flow
  const handleBack = () => {
    deps.setShowForm(false);
    deps.setIsProcessing(false);
  };

  // Goal submission handler
  const handleGoalSubmit = (goal: string) => {
    // Ustaw dane i zmień stan przetwarzania
    deps.setAdvertisingGoal(goal);
    deps.setShowGoalDialog(false);
    deps.setIsProcessing(false); // Reset processing state
    
    // Ustaw odpowiedni dialog bazując na typie szablonu
    setTimeout(() => {
      // Based on template type, show different dialogs
      if (templateId === 'social') {
        deps.setShowSocialMediaPlatformDialog(true);
      } else if (templateId === 'email') {
        deps.setShowEmailStyleDialog(true);
      } else {
        // For ad templates or any other type
        deps.setShowScriptDialog(true);
      }
    }, 100);
  };

  // Goal back button handler
  const handleGoalBack = () => {
    deps.setShowGoalDialog(false);
    deps.setIsProcessing(false); // Reset processing state
  };

  // Email style submission handler
  const handleEmailStyleSubmit = (style: EmailStyle) => {
    deps.setEmailStyle(style);
    deps.setShowEmailStyleDialog(false);
    deps.setIsProcessing(false); // Reset processing state
    
    // Pokazuj dialog email z opóźnieniem
    setTimeout(() => {
      deps.setShowEmailDialog(true);
    }, 100);
  };

  // Email style back button handler
  const handleEmailStyleBack = () => {
    deps.setShowEmailStyleDialog(false);
    deps.setIsProcessing(false); // Reset processing state
    
    // Pokazuj dialog celu z opóźnieniem
    setTimeout(() => {
      deps.setShowGoalDialog(true);
    }, 100);
  };

  // Social media platform submission handler
  const handleSocialMediaPlatformSubmit = (platform: SocialMediaPlatform) => {
    deps.setSocialMediaPlatform(platform);
    deps.setShowSocialMediaPlatformDialog(false);
    deps.setIsProcessing(false); // Reset processing state
    
    // Pokazuj dialog skryptu z opóźnieniem
    setTimeout(() => {
      deps.setShowScriptDialog(true);
    }, 100);
  };

  // Social media platform back button handler
  const handleSocialMediaPlatformBack = () => {
    deps.setShowSocialMediaPlatformDialog(false);
    deps.setIsProcessing(false); // Reset processing state
    
    // Pokazuj dialog celu z opóźnieniem
    setTimeout(() => {
      deps.setShowGoalDialog(true);
    }, 100);
  };

  // Script dialog close handler
  const handleScriptDialogClose = () => {
    deps.setShowScriptDialog(false);
    deps.setIsProcessing(false); // Reset processing state
  };

  // Email dialog close handler
  const handleEmailDialogClose = () => {
    deps.setShowEmailDialog(false);
    deps.setIsProcessing(false); // Reset processing state
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
