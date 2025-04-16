
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import TargetAudienceForm from '../../TargetAudienceForm';

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => Promise<string | undefined>;
  onBack: () => void;
}

const FormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  onBack,
}: FormDialogProps) => {
  // Create a wrapper function to adapt the signature
  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleFormSubmit = async (values: any) => {
    console.log("FormDialog - handling form submit with values:", values);
    // Return the result of onSubmit
    return await onSubmit(values);
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <TargetAudienceForm 
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          onBack={onBack}
        />
      </DialogContent>
    </Dialog>
  );
};

export default FormDialog;
