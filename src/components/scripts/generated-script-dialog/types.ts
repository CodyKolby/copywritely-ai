
import { SocialMediaPlatform } from '../SocialMediaPlatformDialog';
import { ScriptGenerationResult } from './utils/types';

export interface GeneratedScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetAudienceId: string;
  templateId: string;
  advertisingGoal?: string;
  socialMediaPlatform?: SocialMediaPlatform;
}

export { ScriptGenerationResult };
