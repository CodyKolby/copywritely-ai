
import { useState, useEffect } from 'react';
import { generateScript, saveScriptAsProject } from './script-utils';
import { toast } from 'sonner';

export const useScriptGeneration = (
  open: boolean,
  targetAudienceId: string,
  templateId: string,
  advertisingGoal: string = '',
  userId: string | undefined
) => {
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
        
        // If we have a verified audience ID, use it; otherwise, use the target audience ID
        const audienceId = verifiedAudienceId || targetAudienceId;
        
        // Generate the script
        const result = await generateScript(templateId, audienceId, advertisingGoal, currentHookIndex);
        
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
  }, [open, targetAudienceId, templateId, advertisingGoal, currentHookIndex, isGeneratingNewScript, generationCount, verifiedAudienceId]);

  const handleSaveProject = async () => {
    if (!userId || !generatedScript || isSaving || projectSaved) return;
    
    setIsSaving(true);
    
    try {
      const savedProject = await saveScriptAsProject(
        generatedScript,
        currentHook,
        templateId,
        userId
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

  return {
    isLoading,
    generatedScript,
    currentHook,
    allHooks,
    currentHookIndex,
    totalHooks,
    error,
    isGeneratingNewScript,
    isSaving,
    projectSaved,
    handleSaveProject,
    handleRetry,
    handleGenerateWithNextHook
  };
};
