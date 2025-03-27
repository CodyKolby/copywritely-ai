
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FileText } from 'lucide-react';
import LoadingState from './generated-script-dialog/LoadingState';
import ScriptDisplay from './generated-script-dialog/ScriptDisplay';
import { generateScript } from './generated-script-dialog/script-utils';
import { GeneratedScriptDialogProps } from './generated-script-dialog/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const GeneratedScriptDialog = ({
  open,
  onOpenChange,
  targetAudienceId,
  templateId,
}: GeneratedScriptDialogProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [verifiedAudienceId, setVerifiedAudienceId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const verifyAndGenerateScript = async () => {
      if (!open || !targetAudienceId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Weryfikacja ID grupy docelowej:", targetAudienceId);
        
        // Sprawdzamy, czy grupa docelowa istnieje w bazie
        const { data: audience, error: fetchError } = await supabase
          .from('target_audiences')
          .select('*')
          .eq('id', targetAudienceId)
          .maybeSingle();
        
        if (fetchError) {
          console.error("Błąd podczas weryfikacji grupy docelowej:", fetchError);
          if (isMounted) setError("Nie udało się zweryfikować grupy docelowej");
          return;
        }
        
        if (!audience) {
          console.log("Grupa docelowa nie istnieje, używamy zastępczego ID");
          // Używamy losowego ID dla jasności w logach
          const fallbackId = targetAudienceId || crypto.randomUUID();
          if (isMounted) setVerifiedAudienceId(fallbackId);
          
          // Generujemy skrypt lokalnie
          const script = await generateScript(templateId, fallbackId);
          if (isMounted) {
            setGeneratedScript(script);
            setIsLoading(false);
          }
        } else {
          console.log("Grupa docelowa zweryfikowana:", audience.id);
          if (isMounted) setVerifiedAudienceId(audience.id);
          
          // Generujemy skrypt
          const script = await generateScript(templateId, audience.id);
          if (isMounted) {
            setGeneratedScript(script);
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('Error during script generation:', err);
        if (isMounted) {
          setError('Wystąpił nieoczekiwany błąd podczas generowania skryptu.');
          toast.error('Błąd generowania skryptu', {
            description: 'Spróbuj ponownie lub użyj innej grupy docelowej.',
            dismissible: true
          });
          setIsLoading(false);
        }
      }
    };
    
    verifyAndGenerateScript();
    
    return () => {
      isMounted = false;
    };
  }, [open, targetAudienceId, templateId]);

  const handleRetry = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const script = await generateScript(templateId, verifiedAudienceId || targetAudienceId);
      setGeneratedScript(script);
      setIsLoading(false);
    } catch (err) {
      console.error('Error during retry:', err);
      setError('Nie udało się wygenerować skryptu. Spróbuj ponownie później.');
      setIsLoading(false);
    }
  };

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
              onClick={handleRetry}
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
