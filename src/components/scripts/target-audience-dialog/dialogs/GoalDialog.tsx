
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import AdvertisingGoalDialog from '../../AdvertisingGoalDialog';

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (goal: string) => void;
  onBack: () => void;
  isProcessing: boolean;
}

const GoalDialog = ({
  open,
  onOpenChange,
  onSubmit,
  onBack,
  isProcessing,
}: GoalDialogProps) => {
  // Create a wrapper function to adapt the signature
  const handleCancel = () => {
    onOpenChange(false);
  };

  // Create a submission handler that wraps onSubmit
  const handleSubmit = (goal: string) => {
    console.log("GoalDialog - submitting goal:", goal);
    // Call the provided onSubmit function
    onSubmit(goal);
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        {open && (
          <AdvertisingGoalDialog 
            onSubmit={handleSubmit}
            onBack={onBack}
            onCancel={handleCancel}
            isProcessing={isProcessing}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GoalDialog;
