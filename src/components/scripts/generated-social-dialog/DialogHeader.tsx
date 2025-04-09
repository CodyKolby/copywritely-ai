
import React from 'react';
import { DialogHeader as UIDialogHeader, DialogTitle } from '@/components/ui/dialog';
import HookSelector from './HookSelector';

interface DialogHeaderProps {
  currentHookIndex: number;
  totalHooks: number;
  isLoading: boolean;
  isGeneratingNewContent: boolean;
  onHookSelect?: (index: number) => void;
}

const DialogHeader = ({
  currentHookIndex,
  totalHooks,
  isLoading,
  isGeneratingNewContent,
  onHookSelect
}: DialogHeaderProps) => {
  return (
    <UIDialogHeader className="bg-gray-50 border-b p-6">
      <div className="flex justify-between items-center">
        <DialogTitle className="text-xl font-semibold">
          Post w social media
        </DialogTitle>
        
        {!isLoading && !isGeneratingNewContent && totalHooks > 1 && onHookSelect && (
          <HookSelector 
            currentIndex={currentHookIndex}
            totalHooks={totalHooks}
            onHookSelect={onHookSelect}
          />
        )}
      </div>
    </UIDialogHeader>
  );
};

export default DialogHeader;
