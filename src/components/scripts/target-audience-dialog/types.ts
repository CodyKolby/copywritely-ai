
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
