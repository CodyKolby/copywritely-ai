
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, MessageSquarePlus } from 'lucide-react';

interface ActionButtonsProps {
  isSaving: boolean;
  projectSaved: boolean;
  projectId?: string | null;
  currentHookIndex: number;
  totalHooks: number;
  onGenerateNew: () => void;
  onViewProject?: () => void;
  isGeneratingNewScript: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  isSaving,
  projectSaved,
  projectId,
  currentHookIndex,
  totalHooks,
  onGenerateNew,
  onViewProject,
  isGeneratingNewScript
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
      <div className="text-sm text-gray-500">
        {isSaving && (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Zapisywanie...</span>
          </div>
        )}
        {projectSaved && !isSaving && (
          <div className="text-green-600 flex items-center gap-2">
            <span>Skrypt został automatycznie zapisany w projektach</span>
          </div>
        )}
      </div>
      
      <div className="flex gap-2 ml-auto">
        {currentHookIndex + 1 < totalHooks && (
          <Button
            onClick={onGenerateNew}
            variant="outline"
            disabled={isGeneratingNewScript}
            className="border-copywrite-teal text-copywrite-teal"
          >
            {isGeneratingNewScript ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generowanie...
              </>
            ) : (
              <>
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                Generuj inny
              </>
            )}
          </Button>
        )}
        
        {projectSaved && projectId && (
          <Button onClick={onViewProject} className="bg-copywrite-teal">
            <span>Edytuj w projektach</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ActionButtons;
