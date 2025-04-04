
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Save, CheckCircle2, Eye } from 'lucide-react';

interface EmailToolbarProps {
  onSaveToProject: () => void;
  isSaving: boolean;
  projectSaved: boolean;
  onViewProject?: () => void;
}

const EmailToolbar = ({
  onSaveToProject,
  isSaving,
  projectSaved,
  onViewProject
}: EmailToolbarProps) => {
  return (
    <div className="flex items-center gap-2">
      {!projectSaved ? (
        <Button
          onClick={onSaveToProject}
          disabled={isSaving}
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Zapisywanie...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Zapisz w projektach</span>
            </>
          )}
        </Button>
      ) : (
        <>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 bg-green-50 text-green-600 border-green-200"
            disabled
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Zapisano</span>
          </Button>
          
          {onViewProject && (
            <Button
              onClick={onViewProject}
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5"
            >
              <Eye className="h-4 w-4" />
              <span>Otwórz projekt</span>
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default EmailToolbar;
