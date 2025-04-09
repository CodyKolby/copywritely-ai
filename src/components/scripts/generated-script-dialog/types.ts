
import type { SocialMediaPlatform } from '../SocialMediaPlatformDialog';
import type { ScriptGenerationResult } from './utils/types';

export interface GeneratedScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetAudienceId: string;
  templateId: string;
  advertisingGoal?: string;
  socialMediaPlatform?: SocialMediaPlatform;
}

export type { ScriptGenerationResult };

