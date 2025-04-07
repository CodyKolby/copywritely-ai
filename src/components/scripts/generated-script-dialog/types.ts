
import { SocialMediaPlatform } from '../SocialMediaPlatformDialog';

export interface GeneratedScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetAudienceId: string;
  templateId: string;
  advertisingGoal?: string;
  socialMediaPlatform?: SocialMediaPlatform;
}
