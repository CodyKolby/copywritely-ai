
import { SocialMediaPlatform } from '../SocialMediaPlatformDialog';

export interface GeneratedScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetAudienceId: string;
  templateId: string;
  advertisingGoal: string;
  socialMediaPlatform?: SocialMediaPlatform;
}

export interface ScriptDisplayProps {
  script: string;
  bestHook?: string; 
  hookIndex?: number;
  totalHooks?: number;
  adStructure: 'PAS' | 'generic' | 'social';
}
