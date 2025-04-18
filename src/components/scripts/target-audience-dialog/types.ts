
import { EmailStyle } from '../EmailStyleDialog';
import { SocialMediaPlatform } from '../SocialMediaPlatformDialog';

export interface TargetAudienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  userId: string;
  isPremium: boolean;
}

export type AudienceChoice = 'existing' | 'new' | null;

export interface TargetAudience {
  id: string;
  name: string;
  created_at?: string;
  user_id?: string;
  age_range?: string;
  gender?: string;
}

// Adding the UseTargetAudienceDialogReturn interface
export interface UseTargetAudienceDialogReturn {
  isLoading: boolean;
  showForm: boolean;
  audienceChoice: AudienceChoice;
  selectedAudienceId: string | null;
  existingAudiences: any[];
  showScriptDialog: boolean;
  showEmailDialog: boolean;
  showSocialDialog: boolean;
  showGoalDialog: boolean;
  showEmailStyleDialog: boolean;
  showSocialMediaPlatformDialog: boolean;
  advertisingGoal: string;
  emailStyle: EmailStyle;
  socialMediaPlatform: SocialMediaPlatform | undefined;
  isProcessing: boolean;
  isTransitioning?: boolean;
  handleChoiceSelection: (choice: AudienceChoice) => void;
  handleExistingAudienceSelect: (id: string) => void;
  handleContinue: () => void;
  handleCreateNewAudience: () => void;
  handleFormSubmit: (values: any) => Promise<string | undefined>; // Changed to return a string | undefined
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
  handleDeleteAudience?: (audienceId: string) => Promise<void>;
  validatePremiumStatus?: () => Promise<boolean>; // Added this property
}
