
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FileText } from 'lucide-react';
import LoadingState from './generated-script-dialog/LoadingState';
import ScriptDisplay from './generated-script-dialog/ScriptDisplay';
import { generateScript, saveScriptAsProject } from './generated-script-dialog/script-utils';
import { GeneratedScriptDialogProps } from './generated-script-dialog/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';

const GeneratedScriptDialog = ({
  open,
  onOpenChange,
  targetAudienceId,
  templateId,
  advertisingGoal = '',
}: GeneratedScriptDialogProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [currentHook, setCurrentHook] = useState<string>('');
  const [allHooks, setAllHooks] = useState<string[]>([]);
  const [currentHookIndex, setCurrentHookIndex] = useState<number>(0);
  const [totalHooks, setTotalHooks] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [verifiedAudienceId, setVerifiedAudienceId] = useState<string | null>(null);
  const [generationCount, setGenerationCount] = useState<number>(0);
  const [isGeneratingNewScript, setIsGeneratingNewScript] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [projectSaved, setProjectSaved] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const verifyAndGenerateScript = async () => {
      if (!open || !targetAudienceId) return;
      
      setIsLoading(true);
      setError(null);
      setProjectSaved(false);
      
      try {
        console.log("Weryfikacja ID grupy docelowej:", targetAudienceId);
        console.log("Cel reklamy:", advertisingGoal);
        console.log("Generowanie skryptu #", generationCount + 1, "z hookiem o indeksie:", currentHookIndex);
        
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
          const result = await generateScript(templateId, fallbackId, advertisingGoal, currentHookIndex);
          if (isMounted) {
            setGeneratedScript(result.script);
            setCurrentHook(result.bestHook || '');
            setAllHooks(result.allHooks || []);
            setCurrentHookIndex(result.currentHookIndex || 0);
            setTotalHooks(result.totalHooks || 0);
            setIsLoading(false);
            setGenerationCount(prevCount => prevCount + 1);
            setIsGeneratingNewScript(false);
          }
        } else {
          console.log("Grupa docelowa zweryfikowana:", audience.id);
          if (isMounted) setVerifiedAudienceId(audience.id);
          
          // Generujemy skrypt
          const result = await generateScript(templateId, audience.id, advertisingGoal, currentHookIndex);
          if (isMounted) {
            setGeneratedScript(result.script);
            setCurrentHook(result.bestHook || '');
            setAllHooks(result.allHooks || []);
            setCurrentHookIndex(result.currentHookIndex || 0);
            setTotalHooks(result.totalHooks || 0);
            setIsLoading(false);
            setGenerationCount(prevCount => prevCount + 1);
            setIsGeneratingNewScript(false);
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
          setIsGeneratingNewScript(false);
        }
      }
    };
    
    if (open && (isLoading || isGeneratingNewScript)) {
      verifyAndGenerateScript();
    }
    
    return () => {
      isMounted = false;
    };
  }, [open, targetAudienceId, templateId, advertisingGoal, currentHookIndex, isGeneratingNewScript, generationCount]);

  const handleSaveProject = async () => {
    if (!user || !generatedScript || isSaving || projectSaved) return;
    
    setIsSaving(true);
    
    try {
      const savedProject = await saveScriptAsProject(
        generatedScript,
        currentHook,
        templateId,
        user.id
      );
      
      if (savedProject) {
        setProjectSaved(true);
        toast.success('Skrypt zapisany', {
          description: 'Skrypt został zapisany w Twoich projektach.',
          dismissible: true
        });
      } else {
        toast.error('Nie udało się zapisać skryptu', {
          description: 'Spróbuj ponownie później.',
          dismissible: true
        });
      }
    } catch (error) {
      console.error('Błąd zapisywania projektu:', error);
      toast.error('Nie udało się zapisać skryptu', {
        description: 'Wystąpił błąd podczas zapisywania projektu.',
        dismissible: true
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetry = async () => {
    setIsLoading(true);
    setError(null);
    setProjectSaved(false);
    
    try {
      const result = await generateScript(templateId, verifiedAudienceId || targetAudienceId, advertisingGoal, currentHookIndex);
      setGeneratedScript(result.script);
      setCurrentHook(result.bestHook || '');
      setAllHooks(result.allHooks || []);
      setCurrentHookIndex(result.currentHookIndex || 0);
      setTotalHooks(result.totalHooks || 0);
      setIsLoading(false);
      setGenerationCount(prevCount => prevCount + 1);
    } catch (err) {
      console.error('Error during retry:', err);
      setError('Nie udało się wygenerować skryptu. Spróbuj ponownie później.');
      setIsLoading(false);
    }
  };

  const handleGenerateWithNextHook = () => {
    if (currentHookIndex + 1 < totalHooks) {
      setCurrentHookIndex(currentHookIndex + 1);
      setIsGeneratingNewScript(true);
      setProjectSaved(false);
      console.log(`Generuję nowy skrypt z hookiem o indeksie ${currentHookIndex + 1}`);
    } else {
      toast.info('Wykorzystano już wszystkie dostępne hooki');
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
            {currentHookIndex + 1 < totalHooks && !isLoading && !isGeneratingNewScript && (
              <span className="block mt-1 text-copywrite-teal">
                Nie pasuje? Wygeneruj nowy skrypt z innym hookiem startowym.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading || isGeneratingNewScript ? (
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
          <>
            <ScriptDisplay 
              script={generatedScript} 
              bestHook={currentHook} 
              hookIndex={currentHookIndex}
              totalHooks={totalHooks}
            />
            
            <div className="flex justify-between mt-4">
              <button
                onClick={handleSaveProject}
                className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                  projectSaved
                    ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                disabled={isSaving || projectSaved}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Zapisywanie...</span>
                  </>
                ) : projectSaved ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                    <span>Zapisano</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    <span>Zapisz w projektach</span>
                  </>
                )}
              </button>
              
              {currentHookIndex + 1 < totalHooks && (
                <button 
                  onClick={handleGenerateWithNextHook}
                  className="px-4 py-2 bg-copywrite-teal text-white rounded-md hover:bg-copywrite-teal-dark flex items-center gap-2"
                  disabled={isGeneratingNewScript}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 21h5v-5" />
                  </svg>
                  Wygeneruj nowy skrypt
                </button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GeneratedScriptDialog;
