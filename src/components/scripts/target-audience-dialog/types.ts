
import { FormValues } from '../target-audience-form/types';

export interface TargetAudience {
  id: string;
  name: string;
}

export interface TargetAudienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  userId: string;
  isPremium: boolean;
}
