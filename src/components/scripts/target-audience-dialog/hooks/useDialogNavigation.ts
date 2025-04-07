
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
}

export const useDialogNavigation = (
  deps: DialogNavigationDeps,
  templateId: string
) => {
  const handleBack = () => {
    deps.setShowForm(false);
  };

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
  };

  const handleGoalBack = () => {
    deps.setShowGoalDialog(false);
  };

  const handleEmailStyleSubmit = (style: EmailStyle) => {
    deps.setEmailStyle(style);
    deps.setShowEmailStyleDialog(false);
    deps.setShowEmailDialog(true);
  };

  const handleEmailStyleBack = () => {
    deps.setShowEmailStyleDialog(false);
    deps.setShowGoalDialog(true);
  };
  
  const handleSocialMediaPlatformSubmit = (platform: SocialMediaPlatform) => {
    deps.setSocialMediaPlatform(platform);
    deps.setShowSocialMediaPlatformDialog(false);
    deps.setShowScriptDialog(true);
  };
  
  const handleSocialMediaPlatformBack = () => {
    deps.setShowSocialMediaPlatformDialog(false);
    deps.setShowGoalDialog(true);
  };

  const handleScriptDialogClose = () => {
    deps.setShowScriptDialog(false);
  };

  const handleEmailDialogClose = () => {
    deps.setShowEmailDialog(false);
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
