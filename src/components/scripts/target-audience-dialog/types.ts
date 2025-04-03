
export interface TargetAudienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  userId: string;
  isPremium: boolean;
}

export interface TargetAudienceDialogOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  userId: string;
  isPremium: boolean;
}

export interface TargetAudience {
  id: string;
  name: string;
}
