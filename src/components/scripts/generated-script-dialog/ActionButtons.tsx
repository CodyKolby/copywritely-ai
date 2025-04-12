
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, MessageSquarePlus, Copy, Check } from 'lucide-react';

interface ActionButtonsProps {
  isSaving: boolean;
  projectSaved: boolean;
  projectId?: string | null;
  currentHookIndex: number;
  totalHooks: number;
  onGenerateNew: () => void;
  onViewProject?: () => void;
  isGeneratingNewScript: boolean;
  onCopyToClipboard?: () => void;
  copied?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  isSaving,
  projectSaved,
  projectId,
  currentHookIndex,
  totalHooks,
  onGenerateNew,
  onViewProject,
  isGeneratingNewScript,
  onCopyToClipboard,
  copied = false
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-b-lg p-4 border-t border-gray-100">
      <div>
        {onCopyToClipboard && (
          <Button
            onClick={onCopyToClipboard}
            variant="outline"
            className="border-gray-300 hover:bg-gray-100 text-gray-700"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                <span>Skopiowano</span>
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                <span>Kopiuj do schowka</span>
              </>
            )}
          </Button>
        )}
      </div>
      
      <div className="flex gap-2 ml-auto">
        {isSaving && (
          <div className="flex items-center gap-2 text-amber-600 mr-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Zapisywanie...</span>
          </div>
        )}
        
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
        
        {projectSaved && projectId && onViewProject && (
          <Button onClick={onViewProject} className="bg-copywrite-teal text-white hover:bg-copywrite-teal-dark">
            <Copy className="mr-2 h-4 w-4" />
            <span>Kopiuj</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default ActionButtons;
