
import { useState, useEffect, useRef } from 'react';
import { generateScript, saveScriptAsProject } from './script-utils';
import { toast } from 'sonner';
import { SocialMediaPlatform } from '../SocialMediaPlatformDialog';
import { ScriptGenerationResult } from './types';

// Store generation state in session storage for persistence
const STORAGE_KEY = 'script_generation_state';

// Flag to prevent multiple simultaneous generation attempts
let isGenerating = false;

interface StoredGenerationState {
  generatedScript: string;
  currentHook: string;
  allHooks: string[];
  currentHookIndex: number;
  totalHooks: number;
  rawResponse?: string;
  debugInfo?: any;
  templateId: string;
  targetAudienceId: string;
  advertisingGoal: string;
  timestamp: number;
}

const getStoredState = (templateId: string, targetAudienceId: string): StoredGenerationState | null => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const state = JSON.parse(stored) as StoredGenerationState;
    
    // Only return if it's for the same script generation attempt
    if (state.templateId === templateId && state.targetAudienceId === targetAudienceId) {
      // Check if state is still valid (less than 30 minutes old)
      const isValid = Date.now() - state.timestamp < 30 * 60 * 1000;
      return isValid ? state : null;
    }
    
    return null;
  } catch (e) {
    console.error('Error retrieving stored generation state:', e);
    return null;
  }
};

const storeGenerationState = (state: Partial<StoredGenerationState> & { templateId: string; targetAudienceId: string }) => {
  try {
    const fullState: StoredGenerationState = {
      generatedScript: state.generatedScript || '',
      currentHook: state.currentHook || '',
      allHooks: state.allHooks || [],
      currentHookIndex: state.currentHookIndex || 0,
      totalHooks: state.totalHooks || 0,
      rawResponse: state.rawResponse,
      debugInfo: state.debugInfo,
      templateId: state.templateId,
      targetAudienceId: state.targetAudienceId,
      advertisingGoal: state.advertisingGoal || '',
      timestamp: Date.now()
    };
    
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fullState));
  } catch (e) {
    console.error('Error storing generation state:', e);
  }
};

export const useScriptGeneration = (
  open: boolean,
  targetAudienceId: string,
  templateId: string,
  advertisingGoal: string = '',
  userId: string | undefined,
  socialMediaPlatform?: SocialMediaPlatform
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
  const [projectId, setProjectId] = useState<string | null>(null);
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [rawResponse, setRawResponse] = useState<string | undefined>(undefined);
  const [debugInfo, setDebugInfo] = useState<any | undefined>(undefined);
  const [generationAttempts, setGenerationAttempts] = useState<number>(0);
  
  // Use ref to track component mount state
  const isMounted = useRef(true);
  // Generation lock with timestamp to prevent multiple generations
  const generationLockRef = useRef({ locked: false, timestamp: 0 });

  // Set mounted state on component mount/unmount
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load from session storage on initial render
  useEffect(() => {
    if (open && targetAudienceId && templateId) {
      const storedState = getStoredState(templateId, targetAudienceId);
      
      if (storedState) {
        console.log("Restoring script generation state from session storage");
        setGeneratedScript(storedState.generatedScript);
        setCurrentHook(storedState.currentHook);
        setAllHooks(storedState.allHooks);
        setCurrentHookIndex(storedState.currentHookIndex);
        setTotalHooks(storedState.totalHooks);
        setRawResponse(storedState.rawResponse);
        setDebugInfo(storedState.debugInfo);
        setIsLoading(false);
        setGenerationCount(prev => prev + 1);
        setIsGeneratingNewScript(false);
        
        // Attempt to save if userId is available
        if (userId && storedState.generatedScript && !projectSaved) {
          saveScriptToProject(storedState.generatedScript, storedState.currentHook, userId);
        }
      }
    }
  }, [open, targetAudienceId, templateId, userId]);

  useEffect(() => {
    const abortController = new AbortController();
    
    const verifyAndGenerateScript = async () => {
      // Skip if component is unmounted or dialog not open
      if (!isMounted.current || !open || !targetAudienceId) return;
      
      // Check if we have stored data first
      const storedState = getStoredState(templateId, targetAudienceId);
      if (storedState && !isGeneratingNewScript) {
        console.log("Using stored script generation state");
        return;
      }
      
      // Check if generation is locked and timeout hasn't passed
      const currentTime = Date.now();
      const lockTimeout = 10000; // 10 seconds
      if (generationLockRef.current.locked && 
          currentTime - generationLockRef.current.timestamp < lockTimeout) {
        console.log("Generation is locked, skipping duplicate request");
        return;
      }
      
      // Global lock to prevent multiple generations
      if (isGenerating) {
        console.log("Generation already in progress, skipping");
        return;
      }
      
      console.log("Starting script generation");
      setIsLoading(true);
      setError(null);
      setProjectSaved(false);
      setProjectId(null);
      setSaveAttempted(false);
      
      // Set locks
      isGenerating = true;
      generationLockRef.current = { locked: true, timestamp: currentTime };
      
      try {
        console.log("Starting script generation for template:", templateId);
        console.log("Weryfikacja ID grupy docelowej:", targetAudienceId);
        console.log("Cel reklamy:", advertisingGoal);
        
        // Log additional information for specific templates
        if (templateId === 'social' && socialMediaPlatform) {
          console.log("Platforma social media:", socialMediaPlatform);
        }
        
        if (templateId === 'ad') {
          console.log("Generowanie reklamy internetowej z PAS workflow");
        }
        
        console.log("Generowanie skryptu #", generationCount + 1, "z hookiem o indeksie:", currentHookIndex);
        
        // If we have a verified audience ID, use it; otherwise, use the target audience ID
        const audienceId = verifiedAudienceId || targetAudienceId;
        
        // Add abort signal
        const signal = abortController.signal;
        
        // Increase generation attempts counter
        setGenerationAttempts(prev => prev + 1);
        
        // Only attempt 3 times
        if (generationAttempts > 3) {
          throw new Error("Przekroczono maksymalną liczbę prób generowania skryptu (3)");
        }
        
        // Generate the script with type assertion to ensure consistent return type
        const result = await generateScript(
          templateId, 
          audienceId, 
          advertisingGoal, 
          currentHookIndex, 
          socialMediaPlatform
        ) as ScriptGenerationResult;
        
        if (isMounted.current) {
          // Store the result to session storage
          storeGenerationState({
            generatedScript: result.script,
            currentHook: result.bestHook || '',
            allHooks: result.allHooks || [],
            currentHookIndex: result.currentHookIndex || 0,
            totalHooks: result.totalHooks || 0,
            rawResponse: result.rawResponse,
            debugInfo: result.debugInfo,
            templateId,
            targetAudienceId,
            advertisingGoal
          });
          
          setGeneratedScript(result.script);
          setCurrentHook(result.bestHook || '');
          setAllHooks(result.allHooks || []);
          setCurrentHookIndex(result.currentHookIndex || 0);
          setTotalHooks(result.totalHooks || 0);
          // Save raw response and debug info
          setRawResponse(result.rawResponse);
          setDebugInfo(result.debugInfo);
          setIsLoading(false);
          setGenerationCount(prevCount => prevCount + 1);
          setIsGeneratingNewScript(false);
          setGenerationAttempts(0); // Reset attempts counter on success
          
          console.log("Script generation successful");
          
          // Automatycznie zapisz skrypt po wygenerowaniu
          if (userId && result.script) {
            saveScriptToProject(result.script, result.bestHook || '', userId);
          }
        }
      } catch (err: any) {
        console.error('Error during script generation:', err);
        if (isMounted.current) {
          // Only set error if all attempts have failed
          if (generationAttempts >= 3) {
            setError('Wystąpił nieoczekiwany błąd podczas generowania skryptu. Zbyt wiele prób generowania.');
            toast.error('Błąd generowania skryptu', {
              description: 'Przekroczono liczbę prób generowania. Spróbuj ponownie za kilka minut.',
              dismissible: true
            });
          } else {
            // Toast for interim errors
            toast.error('Problem z generowaniem skryptu', {
              description: 'Ponawiam próbę...',
              dismissible: true
            });
            
            // Try again after a short delay
            setTimeout(() => {
              if (isMounted.current) {
                setIsGeneratingNewScript(true);
              }
            }, 3000);
          }
          
          setIsLoading(false);
        }
      } finally {
        // Release locks
        isGenerating = false;
        
        // Release lock after 10 seconds to allow for retries if needed
        setTimeout(() => {
          generationLockRef.current.locked = false;
        }, 10000);
      }
    };
    
    if (open && (isLoading || isGeneratingNewScript)) {
      verifyAndGenerateScript();
    }
    
    return () => {
      abortController.abort();
    };
  }, [open, targetAudienceId, templateId, advertisingGoal, socialMediaPlatform, currentHookIndex, isGeneratingNewScript, generationCount, verifiedAudienceId, userId, generationAttempts, isLoading]);

  const saveScriptToProject = async (scriptContent: string, hookText: string, uid: string) => {
    if (!scriptContent || isSaving || projectSaved || saveAttempted) return;
    
    setSaveAttempted(true);
    setIsSaving(true);
    
    try {
      console.log('Przygotowanie zapisu skryptu:', {
        contentLength: scriptContent.length,
        hookLength: hookText.length,
        templateId,
        userId: uid
      });

      const result = await saveScriptAsProject(
        scriptContent,
        hookText,
        templateId,
        uid,
        socialMediaPlatform
      );
      
      if (result && result.id) {
        console.log('Skrypt zapisany pomyślnie:', result);
        setProjectSaved(true);
        setProjectId(result.id);
        toast.success('Skrypt zapisany', {
          description: 'Skrypt został automatycznie zapisany w Twoich projektach.',
          dismissible: true
        });
      } else {
        console.error('Niepoprawna odpowiedź po zapisie:', result);
        setProjectSaved(false);
        setProjectId(null);
        toast.error('Nie udało się zapisać skryptu', {
          description: 'Spróbuj ponownie później.',
          dismissible: true
        });
      }
    } catch (error: any) {
      console.error('Błąd zapisywania projektu:', error);
      setProjectSaved(false);
      setProjectId(null);
      toast.error('Nie udało się zapisać skryptu', {
        description: error?.message || 'Wystąpił błąd podczas zapisywania projektu.',
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
    setProjectId(null);
    setGenerationAttempts(0); // Reset attempts counter
    setIsGeneratingNewScript(true);
  };

  const handleGenerateWithNextHook = () => {
    if (currentHookIndex + 1 < totalHooks) {
      setCurrentHookIndex(currentHookIndex + 1);
      setIsGeneratingNewScript(true);
      setProjectSaved(false);
      setProjectId(null);
      setGenerationAttempts(0); // Reset attempts counter
      console.log(`Generuję nowy skrypt z hookiem o indeksie ${currentHookIndex + 1}`);
    } else {
      toast.info('Wykorzystano już wszystkie dostępne hooki');
    }
  };

  const handleViewProject = () => {
    if (projectId) {
      // Store current state before navigating away
      if (generatedScript) {
        storeGenerationState({
          generatedScript,
          currentHook,
          allHooks,
          currentHookIndex,
          totalHooks,
          rawResponse,
          debugInfo,
          templateId,
          targetAudienceId,
          advertisingGoal
        });
      }
      
      window.location.href = `/copy-editor/${projectId}`;
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
    projectId,
    rawResponse,
    debugInfo,
    handleRetry,
    handleGenerateWithNextHook,
    handleViewProject
  };
};
