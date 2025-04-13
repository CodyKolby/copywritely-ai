
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import EmailStyleDialogComponent from '../../EmailStyleDialog';
import { EmailStyle } from '../../EmailStyleDialog';

interface EmailStyleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (style: EmailStyle) => void;
  onBack: () => void;
  isProcessing: boolean;
}

const EmailStyleDialog = ({
  open,
  onOpenChange,
  onSubmit,
  onBack,
  isProcessing,
}: EmailStyleDialogProps) => {
  return (
    <Dialog 
      open={open} 
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <EmailStyleDialogComponent
          onSubmit={onSubmit}
          onBack={onBack}
          onCancel={onOpenChange}
          isProcessing={isProcessing}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EmailStyleDialog;
