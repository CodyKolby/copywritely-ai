import { SocialMediaPlatform } from '../SocialMediaPlatformDialog';

export interface GeneratedScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetAudienceId: string;
  templateId: string;
  advertisingGoal?: string;
  socialMediaPlatform?: SocialMediaPlatform;
}

export interface ScriptGenerationResult {
  script: string;
  bestHook: string;
  allHooks: string[];
  currentHookIndex: number;
  totalHooks: number;
  adStructure: string;
  rawResponse?: string;
  debugInfo?: any;
  // Optional properties for social media posts
  cta?: string;
  theme?: string;
  form?: string;
}
