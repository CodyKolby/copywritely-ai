
import React from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { ArrowRight, Loader2, Save, RefreshCw } from 'lucide-react';

interface ActionButtonsProps {
  isSaving: boolean;
  projectSaved: boolean;
  projectId: string | null;
  currentHookIndex: number;
  totalHooks: number;
  onGenerateNew: () => void;
  onViewProject: () => void;
  isGeneratingNewContent: boolean;
  onSave: () => void;
}

const ActionButtons = ({
  isSaving,
  projectSaved,
  projectId,
  currentHookIndex,
  totalHooks,
  onGenerateNew,
  onViewProject,
  isGeneratingNewContent,
  onSave
}: ActionButtonsProps) => {
  return (
    <DialogFooter className="bg-gray-50 border-t p-6 flex flex-row justify-between items-center">
      {/* Left side - Generate with new hook button */}
      <Button
        variant="outline"
        onClick={onGenerateNew}
        disabled={currentHookIndex >= totalHooks - 1 || isGeneratingNewContent}
        className="flex items-center gap-2"
      >
        {isGeneratingNewContent ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generowanie...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Wypróbuj następny hook
          </>
        )}
      </Button>

      {/* Right side - Save and View Project buttons */}
      <div className="flex gap-2">
        {!projectSaved ? (
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Zapisz jako projekt
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={onViewProject}
            disabled={!projectId}
            variant="default"
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            Przejdź do projektu
          </Button>
        )}
      </div>
    </DialogFooter>
  );
};

export default ActionButtons;
