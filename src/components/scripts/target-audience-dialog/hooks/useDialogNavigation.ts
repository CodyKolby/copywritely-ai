
import { EmailStyle } from '../../EmailStyleDialog';
import { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';

interface DialogNavigationDeps {
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

export const useDialogNavigation = (
  deps: DialogNavigationDeps,
  templateId: string
) => {
  const handleBack = () => {
    deps.setShowForm(false);
    deps.setIsProcessing(false);
  };

  // Po wyborze reklamy, przechodzimy do okna PAS lub do wyboru stylu/platformy
  const handleGoalSubmit = (goal: string) => {
    deps.setAdvertisingGoal(goal);
    deps.setShowGoalDialog(false);
    
    if (templateId === 'email') {
      deps.setShowEmailStyleDialog(true);
    } else if (templateId === 'social') {
      deps.setShowSocialMediaPlatformDialog(true);
    } else {
      deps.setShowScriptDialog(true);
    }
    
    deps.setIsProcessing(false);
  };

  const handleGoalBack = () => {
    deps.setShowGoalDialog(false);
    deps.setIsProcessing(false);
  };

  const handleEmailStyleSubmit = (style: EmailStyle) => {
    deps.setEmailStyle(style);
    deps.setShowEmailStyleDialog(false);
    deps.setShowEmailDialog(true);
    deps.setIsProcessing(false);
  };

  const handleEmailStyleBack = () => {
    deps.setShowEmailStyleDialog(false);
    deps.setShowGoalDialog(true);
    deps.setIsProcessing(false);
  };
  
  const handleSocialMediaPlatformSubmit = (platform: SocialMediaPlatform) => {
    deps.setSocialMediaPlatform(platform);
    deps.setShowSocialMediaPlatformDialog(false);
    deps.setShowScriptDialog(true);
    deps.setIsProcessing(false);
  };
  
  const handleSocialMediaPlatformBack = () => {
    deps.setShowSocialMediaPlatformDialog(false);
    deps.setShowGoalDialog(true);
    deps.setIsProcessing(false);
  };

  const handleScriptDialogClose = () => {
    deps.setShowScriptDialog(false);
    deps.setIsProcessing(false);
  };

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
    handleEmailDialogClose
  };
};
