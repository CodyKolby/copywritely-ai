
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { generateScript } from './utils/script-generator';
import { saveProjectWithContent } from './utils/project-utils';
import { SocialMediaPlatform } from '../SocialMediaPlatformDialog';

export const useScriptGeneration = (
  open: boolean, 
  targetAudienceId: string | null,
  templateId: string | undefined,
  advertisingGoal: string,
  userId: string | undefined,
  socialMediaPlatform?: SocialMediaPlatform,
  existingProject?: {
    id: string;
    title: string;
    content: string;
  }
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

  // Handle existingProject if provided
  useEffect(() => {
    if (existingProject && open) {
      console.log("SCRIPT GENERATION: Loading existing project:", existingProject.id);
      setGeneratedScript(existingProject.content);
      setCurrentHook(existingProject.title);
      setProjectId(existingProject.id);
      setProjectSaved(true);
      setIsLoading(false);
      setAutoSaveAttempted(true);
    }
  }, [existingProject, open]);

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
      console.log("SCRIPT GENERATION: Generation already in progress, skipping duplicate request");
      return;
    }
    
    if (!open) {
      console.log("SCRIPT GENERATION: Dialog is not open, not generating script");
      return;
    }

    if (!targetAudienceId || !templateId) {
      console.error("SCRIPT GENERATION: Missing required parameters:", { targetAudienceId, templateId });
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
      
      console.log("SCRIPT GENERATION: Starting script generation with params:", { 
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
        console.log("SCRIPT GENERATION: Component unmounted or newer request started, discarding results");
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
      
      console.log("SCRIPT GENERATION: Script generation completed successfully", {
        scriptLength: result.script?.length || 0,
        hookIndex: result.currentHookIndex,
        totalHooks: result.totalHooks,
        templateId
      });

      retryCount.current = 0;

    } catch (err: any) {
      if (mountedRef.current) {
        console.error("SCRIPT GENERATION: Error generating script:", err);
        
        if (retryCount.current < maxRetries && 
            (err.message?.includes('fetch') || err.message?.includes('network') || err.message?.includes('timeout'))) {
          retryCount.current++;
          console.log(`SCRIPT GENERATION: Automatically retrying (${retryCount.current}/${maxRetries})...`);
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
    // Don't generate script if we're using an existing project
    if (open && targetAudienceId && templateId && !existingProject) {
      console.log("SCRIPT GENERATION: Dialog opened, generating initial script");
      generateScriptContent(0);
    }
  }, [open, targetAudienceId, templateId, existingProject]);

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
    // Skip saving if we're viewing an existing project
    if (existingProject) {
      console.log("SCRIPT GENERATION: Using existing project, skipping save");
      return null;
    }
    
    console.log("SCRIPT GENERATION: Starting saveToProjectImpl with data:", {
      hasUserId: !!userId,
      hasGeneratedScript: !!generatedScript,
      scriptLength: generatedScript?.length || 0
    });
    
    if (!userId || !generatedScript) {
      console.log("SCRIPT GENERATION: Cannot save project - missing data");
      return null;
    }
    
    try {
      setIsSaving(true);
      
      const title = currentHook || "Nowy skrypt";
      const content = templateId === 'social' ? (postContent || generatedScript) : generatedScript;
      
      console.log("SCRIPT GENERATION: Saving project with data:", {
        contentLength: content.length,
        title: title,
        templateId: templateId || 'unknown',
        userId: userId,
        platform: socialMediaPlatform?.key
      });
      
      const savedProject = await saveProjectWithContent(
        content,
        title,
        templateId || 'unknown',
        userId,
        socialMediaPlatform
      );
      
      if (savedProject && savedProject.id) {
        setProjectId(savedProject.id);
        setProjectSaved(true);
        console.log("SCRIPT GENERATION: Project saved successfully with ID:", savedProject.id);
        return savedProject;
      } else {
        console.error("SCRIPT GENERATION: Save returned but without project ID");
        return null;
      }
    } catch (err) {
      console.error("SCRIPT GENERATION: Error saving project:", err);
      // Toast is handled in the saveProjectWithContent function
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [userId, generatedScript, currentHook, templateId, socialMediaPlatform, postContent, existingProject]);

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

  // Auto-save effect - this is critical for ensuring scripts are saved
  // Don't auto-save for existing projects
  useEffect(() => {
    const performAutoSave = async () => {
      // Skip auto-save for existing projects
      if (existingProject) {
        return;
      }
      
      if (!isLoading && 
          !error && 
          generatedScript && 
          userId && 
          !projectSaved && 
          !autoSaveAttempted && 
          !isSaving) {
        console.log("SCRIPT GENERATION: Attempting auto-save of script");
        setAutoSaveAttempted(true);
        await saveToProjectImpl();
      }
    };
    
    if (open && !existingProject) {
      console.log("SCRIPT GENERATION: Checking conditions for auto-save:", {
        isLoading,
        hasError: !!error,
        hasScript: !!generatedScript,
        scriptLength: generatedScript?.length || 0,
        hasUserId: !!userId,
        projectSaved,
        autoSaveAttempted,
        isSaving
      });
      performAutoSave();
    }
  }, [isLoading, error, generatedScript, userId, projectSaved, autoSaveAttempted, isSaving, open, saveToProjectImpl, existingProject]);

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
