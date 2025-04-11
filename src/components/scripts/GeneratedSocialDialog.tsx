
import React, { useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useScriptGeneration } from './generated-script-dialog/useScriptGeneration';
import { useAuth } from '@/contexts/auth/AuthContext';

interface GeneratedSocialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetAudienceId: string;
  templateId: string;
  advertisingGoal: string;
  platform?: { label: string; key: string };
}

const GeneratedSocialDialog: React.FC<GeneratedSocialDialogProps> = ({
  open,
  onOpenChange,
  targetAudienceId,
  templateId,
  advertisingGoal,
  platform,
}) => {
  const { user } = useAuth();

  const {
    generatedScript,
  } = useScriptGeneration(open, targetAudienceId, templateId, advertisingGoal, user?.id, platform);

  const dialogKey = `${templateId}-${targetAudienceId}-${platform?.key || 'unknown'}-${open ? 'open' : 'closed'}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={dialogKey}>
      <DialogContent 
        className="max-w-[700px] p-0 rounded-xl overflow-hidden bg-white max-h-[85vh]"
      >
        <DialogTitle className="p-4 border-b border-gray-100 text-lg font-medium">
          Wygenerowany post dla {platform?.label || 'mediów społecznościowych'}
        </DialogTitle>

        <div className="p-6 overflow-auto max-h-[60vh] whitespace-pre-line">
          {generatedScript || 'Brak wygenerowanego posta.'}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GeneratedSocialDialog;