
import React from 'react';
import { DialogHeader as UIDialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FileText } from 'lucide-react';

interface DialogHeaderProps {
  currentHookIndex: number;
  totalHooks: number;
  isLoading: boolean;
  isGeneratingNewScript: boolean;
}

const DialogHeader: React.FC<DialogHeaderProps> = ({ 
  currentHookIndex, 
  totalHooks, 
  isLoading,
  isGeneratingNewScript
}) => {
  return (
    <UIDialogHeader className="p-6">
      <DialogTitle className="flex items-center gap-2">
        <FileText className="h-5 w-5" />
        <span>Wygenerowany Skrypt</span>
      </DialogTitle>
      <DialogDescription className="px-1 mt-1">
        Oto skrypt wygenerowany na podstawie informacji o Twojej grupie docelowej.
        Możesz go skopiować lub pobrać do dalszej edycji.
        {currentHookIndex + 1 < totalHooks && !isLoading && !isGeneratingNewScript && (
          <span className="block mt-2 text-copywrite-teal">
            Nie pasuje? Wygeneruj nowy skrypt z innym hookiem startowym.
          </span>
        )}
      </DialogDescription>
    </UIDialogHeader>
  );
};

export default DialogHeader;
