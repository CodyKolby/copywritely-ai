
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FileText } from 'lucide-react';
import LoadingState from './generated-script-dialog/LoadingState';
import ScriptDisplay from './generated-script-dialog/ScriptDisplay';
import { generateSampleScript } from './generated-script-dialog/script-utils';
import { GeneratedScriptDialogProps } from './generated-script-dialog/types';

const GeneratedScriptDialog = ({
  open,
  onOpenChange,
  targetAudienceId,
  templateId,
}: GeneratedScriptDialogProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [generatedScript, setGeneratedScript] = useState<string>('');

  useEffect(() => {
    if (open && targetAudienceId) {
      // Symulacja ładowania danych - w przyszłości zastąp rzeczywistym API
      setIsLoading(true);
      const timer = setTimeout(() => {
        // Tymczasowo generujemy przykładowy skrypt
        const sampleScript = generateSampleScript(templateId);
        setGeneratedScript(sampleScript);
        setIsLoading(false);
      }, 3000); // 3 sekundy opóźnienia
      
      return () => clearTimeout(timer);
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
        ) : (
          <ScriptDisplay script={generatedScript} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GeneratedScriptDialog;
