
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, ArrowRight } from 'lucide-react';

interface ActionButtonsProps {
  isSaving: boolean;
  projectSaved: boolean;
  projectId: string | null;
  isGeneratingNewContent: boolean;
  onSave: () => void;
  onViewProject?: () => void;
}

const ActionButtons = ({
  isSaving,
  projectSaved,
  projectId,
  isGeneratingNewContent,
  onSave,
  onViewProject
}: ActionButtonsProps) => {
  return (
    <div className="flex justify-end items-center gap-3 p-4 border-t border-gray-200">
      {!projectSaved ? (
        <Button 
          onClick={onSave}
          className="bg-copywrite-teal hover:bg-copywrite-teal-dark text-white"
          disabled={isSaving || isGeneratingNewContent}
        >
          {isSaving ? (
            <>
              <span className="animate-spin mr-2">&#10227;</span>
              Zapisywanie...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Zapisz post
            </>
          )}
        </Button>
      ) : projectId && onViewProject ? (
        <Button 
          onClick={onViewProject}
          className="bg-copywrite-teal hover:bg-copywrite-teal-dark text-white"
        >
          Przejdź do projektu
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
};

export default ActionButtons;
