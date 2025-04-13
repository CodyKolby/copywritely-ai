
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import TargetAudienceForm from '../../TargetAudienceForm';

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => Promise<void>;
  onBack: () => void;
}

const FormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  onBack,
}: FormDialogProps) => {
  return (
    <Dialog 
      open={open} 
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <TargetAudienceForm 
          onSubmit={onSubmit}
          onCancel={onOpenChange}
          onBack={onBack}
        />
      </DialogContent>
    </Dialog>
  );
};

export default FormDialog;
