
import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [postContent, setPostContent] = useState('');
  const [currentHook, setCurrentHook] = useState('');
  const [currentHookIndex, setCurrentHookIndex] = useState(0);
  const [totalHooks, setTotalHooks] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [isGeneratingNewScript, setIsGeneratingNewScript] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [projectSaved, setProjectSaved] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any | null>(null);
  const [autoSaveAttempted, setAutoSaveAttempted] = useState(false);
  
  const generationInProgress = useRef(false);
  const requestId = useRef(`${Date.now()}-${Math.random().toString(36).substring(2, 15)}`);
  const mountedRef = useRef(true);
  const retryCount = useRef(0);
  const maxRetries = 2;
  const lastRequestTimestamp = useRef(Date.now());

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setIsLoading(true);
      setError(null);
      setIsGeneratingNewScript(false);
      setIsSaving(false);
      retryCount.current = 0;
      lastRequestTimestamp.current = Date.now();
      setAutoSaveAttempted(false);
      setProjectSaved(false);
    }
  }, [open]);

  const generateScriptContent = async (hookIndex = 0, isRetry = false) => {
    if (generationInProgress.current) {
      console.log("Script generation already in progress, skipping duplicate request");
      return;
    }
    
    if (!open) {
      console.log("Dialog is not open, not generating script");
      return;
    }

    if (!targetAudienceId || !templateId) {
      console.error("Missing required parameters:", { targetAudienceId, templateId });
      setError(new Error("Brakuje wymaganych parametrów do wygenerowania skryptu."));
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    if (isRetry) {
      toast.info("Ponawiam generowanie skryptu...");
    }
    
    try {
      generationInProgress.current = true;
      
      lastRequestTimestamp.current = Date.now();
      const currentRequestId = `${lastRequestTimestamp.current}-${Math.random().toString(36).substring(2, 15)}`;
      requestId.current = currentRequestId;
      
      console.log("Starting script generation with params:", { 
        templateId, 
        targetAudienceId, 
        advertisingGoal,
        hookIndex,
        requestId: currentRequestId,
        timestamp: new Date(lastRequestTimestamp.current).toISOString()
      });

      const result = await generateScript(
        templateId, 
        targetAudienceId, 
        advertisingGoal,
        hookIndex,
        socialMediaPlatform
      );

      if (!mountedRef.current || requestId.current !== currentRequestId) {
        console.log("Component unmounted or newer request started, discarding results");
        return;
      }

      setGeneratedScript(result.script || '');
      setCurrentHook(result.bestHook || '');
      
      if (templateId === 'social' && result.script) {
        const introLength = result.bestHook ? result.bestHook.length : 0;
        
        if (result.script && introLength > 0) {
          const contentStartIndex = result.script.indexOf('\n\n', result.script.indexOf(result.bestHook) + introLength);
          
          if (contentStartIndex !== -1) {
            setPostContent(result.script.substring(contentStartIndex).trim());
          } else {
            setPostContent(result.script);
          }
        } else {
          setPostContent(result.script);
        }
      }
      
      setCurrentHookIndex(result.currentHookIndex);
      setTotalHooks(result.totalHooks);
      setDebugInfo(result.debugInfo || null);
      
      if (result.script === 'TESTSCRIPT4' || result.bestHook === 'TESTHOOK4') {
        console.log("SUCCESS: Got expected test values, confirming prompts are working correctly!");
        toast.success("Prompty zaktualizowane pomyślnie!");
      }
      
      console.log("Script generation completed successfully", {
        scriptLength: result.script?.length || 0,
        hookIndex: result.currentHookIndex,
        totalHooks: result.totalHooks,
        templateId,
        debugInfo: result.debugInfo
      });

      retryCount.current = 0;

    } catch (err: any) {
      if (mountedRef.current) {
        console.error("Error generating script:", err);
        
        if (retryCount.current < maxRetries && 
            (err.message?.includes('fetch') || err.message?.includes('network') || err.message?.includes('timeout'))) {
          retryCount.current++;
          console.log(`Automatically retrying (${retryCount.current}/${maxRetries})...`);
          toast.error(`Błąd połączenia. Automatyczne ponawianie (${retryCount.current}/${maxRetries})...`);
          
          setTimeout(() => {
            generateScriptContent(hookIndex, true);
          }, 1500);
          return;
        }
        
        setError(err);
        toast.error("Błąd podczas generowania skryptu");
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsGeneratingNewScript(false);
        generationInProgress.current = false;
      }
    }
  };

  useEffect(() => {
    if (open && targetAudienceId && templateId) {
      console.log("Dialog opened, generating initial script");
      generateScriptContent(0);
    }
  }, [open, targetAudienceId, templateId]);

  const handleRetry = () => {
    setError(null);
    lastRequestTimestamp.current = Date.now();
    generateScriptContent(currentHookIndex, true);
  };

  const handleGenerateWithNextHook = async () => {
    if (currentHookIndex >= totalHooks - 1) {
      toast.info("To już ostatni hook. Nie można wygenerować następnego wariantu.");
      return;
    }

    setIsGeneratingNewScript(true);
    lastRequestTimestamp.current = Date.now();
    await generateScriptContent(currentHookIndex + 1);
  };

  // Use useCallback to avoid dependency issues with useEffect
  const saveToProjectImpl = useCallback(async () => {
    if (!userId || !generatedScript) {
      console.log("Cannot save project - missing data:", {
        userId: !!userId,
        generatedScript: !!generatedScript
      });
      return null;
    }
    
    try {
      setIsSaving(true);
      
      const title = currentHook || "Nowy skrypt";
      
      console.log("Saving project with data:", {
        contentLength: generatedScript.length,
        title: title,
        templateId: templateId || 'unknown',
        userId: userId,
        platform: socialMediaPlatform?.key
      });
      
      const savedProject = await saveProjectWithContent(
        generatedScript,
        title,
        templateId || 'unknown',
        userId,
        socialMediaPlatform
      );
      
      if (savedProject && savedProject.id) {
        setProjectId(savedProject.id);
        setProjectSaved(true);
        toast.success("Skrypt zapisany w Twoich projektach");
        console.log("Project saved successfully with ID:", savedProject.id);
        return savedProject;
      } else {
        console.error("Save returned but without project ID");
        toast.error("Nie udało się zapisać projektu");
        return null;
      }
    } catch (err) {
      console.error("Error saving project:", err);
      toast.error("Nie udało się zapisać projektu");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [userId, generatedScript, currentHook, templateId, socialMediaPlatform]);

  const handleViewProject = async () => {
    if (projectId && projectSaved) {
      window.location.href = `/copy-editor/${projectId}`;
    } else if (!projectSaved && generatedScript && userId) {
      const savedProject = await saveToProjectImpl();
      if (savedProject && savedProject.id) {
        window.location.href = `/copy-editor/${savedProject.id}`;
      }
    } else {
      toast.error("Nie można otworzyć projektu - wystąpił problem");
    }
  };

  // Auto-save effect
  useEffect(() => {
    const performAutoSave = async () => {
      if (!isLoading && 
          !error && 
          generatedScript && 
          userId && 
          !projectSaved && 
          !autoSaveAttempted && 
          !isSaving) {
        console.log("Attempting auto-save of script");
        setAutoSaveAttempted(true);
        await saveToProjectImpl();
      }
    };
    
    if (open) {
      performAutoSave();
    }
  }, [isLoading, error, generatedScript, userId, projectSaved, autoSaveAttempted, isSaving, open, saveToProjectImpl]);

  return {
    isLoading,
    generatedScript,
    postContent,
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
    debugInfo
  };
};
