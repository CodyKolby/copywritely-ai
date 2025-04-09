
import { EmailStyle } from '../EmailStyleDialog';
import { SocialMediaPlatform } from '../SocialMediaPlatformDialog';

export interface TargetAudienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  userId: string;
  isPremium: boolean;
}

// Alias for TargetAudienceDialogProps for backward compatibility
export type TargetAudienceDialogOptions = TargetAudienceDialogProps;

export type AudienceChoice = 'existing' | 'new' | null;

export interface TargetAudience {
  id: string;
  name: string;
  created_at?: string;
  user_id?: string;
}

export interface UseTargetAudienceDialogReturn {
  isLoading: boolean;
  showForm: boolean;
  audienceChoice: AudienceChoice;
  selectedAudienceId: string | null;
  existingAudiences: TargetAudience[];
  showScriptDialog: boolean;
  showEmailDialog: boolean;
  showSocialDialog: boolean;
  showGoalDialog: boolean;
  showEmailStyleDialog: boolean;
  showSocialMediaPlatformDialog: boolean;
  advertisingGoal: string;
  emailStyle: string;
  socialMediaPlatform: SocialMediaPlatform | undefined;
  isProcessing: boolean;
  isTransitioning: boolean;
  handleChoiceSelection: (choice: AudienceChoice) => void;
  handleExistingAudienceSelect: (id: string) => void;
  handleContinue: () => void;
  handleCreateNewAudience: () => void;
  handleFormSubmit: (audienceId: string) => void;
  handleBack: () => void;
  handleGoalSubmit: (goal: string) => void;
  handleGoalBack: () => void;
  handleEmailStyleSubmit: (style: EmailStyle) => void;
  handleEmailStyleBack: () => void;
  handleSocialMediaPlatformSubmit: (platform: SocialMediaPlatform) => void;
  handleSocialMediaPlatformBack: () => void;
  handleScriptDialogClose: () => void;
  handleEmailDialogClose: () => void;
  handleSocialDialogClose: () => void;
  resetState: () => void;
}
