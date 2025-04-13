
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import SocialMediaPlatformDialog from '../../SocialMediaPlatformDialog';
import { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';

interface SocialMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (platform: SocialMediaPlatform) => void;
  onBack: () => void;
  isProcessing: boolean;
}

const SocialMediaDialog = ({
  open,
  onOpenChange,
  onSubmit,
  onBack,
  isProcessing,
}: SocialMediaDialogProps) => {
  return (
    <Dialog 
      open={open} 
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <SocialMediaPlatformDialog
          open={true}
          onOpenChange={() => {}}
          onSelect={onSubmit}
          onBack={onBack}
          onCancel={onOpenChange}
          isProcessing={isProcessing}
        />
      </DialogContent>
    </Dialog>
  );
};

export default SocialMediaDialog;
