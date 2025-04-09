import { useState, useEffect, useRef } from 'react';
import { generateScript } from './utils/script-generator';
import { saveProjectWithContent } from './utils/project-utils';
import { SocialMediaPlatform } from '../SocialMediaPlatformDialog';
import { toast } from 'sonner';

export const useScriptGeneration = (
  open: boolean, 
  targetAudienceId: string | null,
  templateId: string | undefined,
  advertisingGoal: string,
  userId: string | undefined,
  socialMediaPlatform?: SocialMediaPlatform
) => {
  const [isLoading, setIsLoading] = useState(true);
  const [generatedScript, setGeneratedScript] = useState('');
  const [currentHook, setCurrentHook] = useState('');
  const [currentHookIndex, setCurrentHookIndex] = useState(0);
  const [totalHooks, setTotalHooks] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [isGeneratingNewScript, setIsGeneratingNewScript] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [projectSaved, setProjectSaved] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any | null>(null);
  
  // Use refs to prevent unnecessary re-renders and track generation state
  const generationInProgress = useRef(false);
  const requestId = useRef(`${Date.now()}-${Math.random().toString(36).substring(2, 15)}`);
  const mountedRef = useRef(true);

  // Clean up when the component is unmounted
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Reset state when dialog is closed
  useEffect(() => {
    if (!open) {
      // Keep project state but reset loading states
      setIsLoading(true);
      setError(null);
      setIsGeneratingNewScript(false);
      setIsSaving(false);
    }
  }, [open]);

  // Function to generate the script
  const generateScriptContent = async (hookIndex = 0, isRetry = false) => {
    // Prevent multiple concurrent generation requests
    if (generationInProgress.current) {
      console.log("Script generation already in progress, skipping duplicate request");
      return;
    }
    
    // If dialog is not open, don't continue
    if (!open) {
      console.log("Dialog is not open, not generating script");
      return;
    }

    // Guard against invalid inputs
    if (!targetAudienceId || !templateId) {
      console.error("Missing required parameters:", { targetAudienceId, templateId });
      setError(new Error("Brakuje wymaganych parametrów do wygenerowania skryptu."));
      setIsLoading(false);
      return;
    }
    
    // Set loading state
    setIsLoading(true);
    setError(null);
    if (isRetry) {
      toast.info("Ponawiam generowanie skryptu...");
    }
    
    try {
      // Set flag to prevent duplicate requests
      generationInProgress.current = true;
      
      // Generate unique request ID for this generation attempt
      const currentRequestId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      requestId.current = currentRequestId;
      
      console.log("Starting script generation with params:", { 
        templateId, 
        targetAudienceId, 
        advertisingGoal,
        hookIndex,
        requestId: currentRequestId
      });

      // Call the script generator
      const result = await generateScript(
        templateId, 
        targetAudienceId, 
        advertisingGoal,
        hookIndex,
        socialMediaPlatform
      );

      // If the component was unmounted or another request was started, don't update state
      if (!mountedRef.current || requestId.current !== currentRequestId) {
        console.log("Component unmounted or newer request started, discarding results");
        return;
      }

      // Update state with the generated script
      setGeneratedScript(result.script || '');
      setCurrentHook(result.bestHook || '');
      setCurrentHookIndex(result.currentHookIndex);
      setTotalHooks(result.totalHooks);
      setRawResponse(result.rawResponse || null);
      setDebugInfo(result.debugInfo || null);
      
      console.log("Script generation completed successfully", {
        scriptLength: result.script?.length || 0,
        hookIndex: result.currentHookIndex,
        totalHooks: result.totalHooks,
        templateId
      });

    } catch (err: any) {
      // Only update error state if this is still the current request
      if (mountedRef.current) {
        console.error("Error generating script:", err);
        setError(err);
        toast.error("Błąd podczas generowania skryptu");
      }
    } finally {
      // Reset loading states if component still mounted
      if (mountedRef.current) {
        setIsLoading(false);
        setIsGeneratingNewScript(false);
        generationInProgress.current = false;
      }
    }
  };

  // Generate script when the dialog opens
  useEffect(() => {
    if (open && targetAudienceId && templateId) {
      console.log("Dialog opened, generating initial script");
      generateScriptContent(0);
    }
  }, [open, targetAudienceId, templateId]);

  // Retry generating the script
  const handleRetry = () => {
    setError(null);
    generateScriptContent(currentHookIndex, true);
  };

  // Generate script with next hook
  const handleGenerateWithNextHook = async () => {
    // Don't attempt if we're at the end of the hooks
    if (currentHookIndex >= totalHooks - 1) {
      toast.info("To już ostatni hook. Nie można wygenerować następnego wariantu.");
      return;
    }

    setIsGeneratingNewScript(true);
    await generateScriptContent(currentHookIndex + 1);
  };

  // Save the script as a project
  const handleViewProject = async () => {
    if (!generatedScript || !userId || !targetAudienceId) {
      toast.error("Nie można zapisać projektu");
      return;
    }

    try {
      setIsSaving(true);
      
      // Use saveProjectWithContent instead of saveScriptProject
      const savedProject = await saveProjectWithContent(
        generatedScript,
        currentHook || "Nowy skrypt",
        templateId || 'unknown',
        userId,
        socialMediaPlatform
      );
      
      if (savedProject && savedProject.id) {
        setProjectId(savedProject.id);
        setProjectSaved(true);
        toast.success("Projekt zapisany pomyślnie");
      }
    } catch (err) {
      console.error("Error saving project:", err);
      toast.error("Nie udało się zapisać projektu");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isLoading,
    generatedScript,
    currentHook,
    currentHookIndex,
    totalHooks,
    error,
    isGeneratingNewScript,
    isSaving,
    projectSaved,
    projectId,
    handleRetry,
    handleGenerateWithNextHook,
    handleViewProject,
    rawResponse,
    debugInfo
  };
};
