
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FileText } from 'lucide-react';
import LoadingState from './generated-script-dialog/LoadingState';
import ScriptDisplay from './generated-script-dialog/ScriptDisplay';
import { generateScript } from './generated-script-dialog/script-utils';
import { GeneratedScriptDialogProps } from './generated-script-dialog/types';
import { toast } from 'sonner';

const GeneratedScriptDialog = ({
  open,
  onOpenChange,
  targetAudienceId,
  templateId,
}: GeneratedScriptDialogProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && targetAudienceId) {
      setIsLoading(true);
      setError(null);
      
      generateScript(templateId, targetAudienceId)
        .then(script => {
          setGeneratedScript(script);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Error generating script:', err);
          setError('Nie udało się wygenerować skryptu. Spróbuj ponownie później.');
          toast.error('Błąd generowania skryptu', {
            description: 'Wystąpił problem podczas tworzenia skryptu. Spróbuj ponownie później.',
            dismissible: true
          });
          setIsLoading(false);
        });
    }
  }, [open, targetAudienceId, templateId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span>Wygenerowany Skrypt</span>
          </DialogTitle>
          <DialogDescription>
            Oto skrypt wygenerowany na podstawie informacji o Twojej grupie docelowej.
            Możesz go skopiować lub pobrać do dalszej edycji.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-red-500">{error}</p>
            <button 
              onClick={() => {
                setIsLoading(true);
                setError(null);
                generateScript(templateId, targetAudienceId)
                  .then(script => {
                    setGeneratedScript(script);
                    setIsLoading(false);
                  })
                  .catch(() => {
                    setError('Nie udało się wygenerować skryptu. Spróbuj ponownie później.');
                    setIsLoading(false);
                  });
              }}
              className="mt-4 px-4 py-2 bg-copywrite-teal text-white rounded-md hover:bg-copywrite-teal-dark"
            >
              Spróbuj ponownie
            </button>
          </div>
        ) : (
          <ScriptDisplay script={generatedScript} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GeneratedScriptDialog;
