
import React from 'react';
import { DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface DialogHeaderProps {
  isLoading: boolean;
}

const DialogHeader = ({ isLoading }: DialogHeaderProps) => {
  // When loading, return nothing so no header shows
  if (isLoading) {
    return null;
  }
  
  // Only show header when not loading
  return (
    <div className="p-6 border-b border-gray-100">
      <DialogTitle className="text-2xl font-semibold">
        Wygenerowany email
      </DialogTitle>
      <DialogDescription>
        Możesz edytować temat i treść emaila bezpośrednio tutaj.
      </DialogDescription>
    </div>
  );
};

export default DialogHeader;
