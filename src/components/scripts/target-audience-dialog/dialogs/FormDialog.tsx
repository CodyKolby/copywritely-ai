
import React, { useEffect } from 'react';
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
  // Reset scroll position when form opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        const dialogContent = document.querySelector('.max-h-[90vh]');
        if (dialogContent) {
          dialogContent.scrollTop = 0;
        }
      }, 100);
    }
  }, [open]);

  // Create a wrapper function to adapt the signature
  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleFormSubmit = async (values: any) => {
    console.log("FormDialog - handling form submit with values:", values);
    try {
      // Return the result of onSubmit
      const audienceId = await onSubmit(values);
      
      if (!audienceId) {
        console.log("Form submission completed but no audience ID was returned");
      } else {
        console.log("Form submission successful with audience ID:", audienceId);
      }
      
      return audienceId;
    } catch (error) {
      console.error("Form submission error in FormDialog:", error);
      return undefined;
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        {open && (
          <TargetAudienceForm 
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
            onBack={onBack}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FormDialog;
