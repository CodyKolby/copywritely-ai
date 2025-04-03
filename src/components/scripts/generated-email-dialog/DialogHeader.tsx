
import React from 'react';
import { DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface DialogHeaderProps {
  isLoading: boolean;
}

const DialogHeader = ({ isLoading }: DialogHeaderProps) => {
  return (
    <div className="p-6 border-b border-gray-100">
      <DialogTitle className="text-2xl font-semibold">
        {isLoading ? 'Generowanie emaila...' : 'Wygenerowany email'}
      </DialogTitle>
      <DialogDescription>
        {isLoading 
          ? 'To może potrwać kilka sekund, proszę czekać...' 
          : 'Możesz edytować temat i treść emaila bezpośrednio tutaj.'
        }
      </DialogDescription>
    </div>
  );
};

export default DialogHeader;
