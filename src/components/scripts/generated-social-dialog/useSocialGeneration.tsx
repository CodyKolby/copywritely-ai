
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { generateSocialHooks, SocialHookResponse } from './services/social-hook-service';
import { generateSocialContent } from './services/social-content-service';
import { saveSocialToProject } from './services/social-project-service';
import { supabase } from '@/integrations/supabase/client';
import { SocialGenerationHookReturn, UseSocialGenerationProps } from './social-generation-types';
import { SocialMediaPlatform } from '../SocialMediaPlatformDialog';

export const useSocialGeneration = ({
  open,
  targetAudienceId,
  templateId,
  advertisingGoal,
  platform,
  userId
}: UseSocialGenerationProps): SocialGenerationHookReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [projectSaved, setProjectSaved] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [hookResponse, setHookResponse] = useState<SocialHookResponse | null>(null);
  const [isGeneratingNewContent, setIsGeneratingNewContent] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any | null>(null);
  
  const generationInProgress = useRef(false);
  const requestId = useRef(`${Date.now()}-${Math.random().toString(36).substring(2, 15)}`);
  const mountedRef = useRef(true);
  const retryCount = useRef(0);
  const maxRetries = 2;
  
  const navigate = useNavigate();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  useEffect(() => {
    if (open && targetAudienceId && !generatedContent) {
      generateSocialPost();
    }
  }, [open, targetAudienceId]);

  const resetState = () => {
    setError(null);
    setGeneratedContent('');
    setProjectSaved(false);
    setProjectId(null);
    setHookResponse(null);
    setDebugInfo(null);
    setIsGeneratingNewContent(false);
    retryCount.current = 0;
  };

  const generateSocialPost = async (isRetry = false) => {
    if (generationInProgress.current) {
      console.log("Social post generation already in progress, skipping duplicate request");
      return;
    }
    
    if (!open) {
      console.log("Dialog is not open, not generating social post");
      return;
    }

    if (!targetAudienceId) {
      setError('Brak ID grupy docelowej');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    if (isRetry) {
      toast.info("Ponawiam generowanie posta...");
    }
    
    try {
      generationInProgress.current = true;
      requestId.current = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      console.log("Starting social post generation with params:", { 
        targetAudienceId, 
        advertisingGoal,
        platform: platform?.key || 'meta',
        requestId: requestId.current
      });

      // Fetch the target audience data
      const { data: targetAudienceData, error: targetAudienceError } = await supabase
        .from('target_audiences')
        .select('*')
        .eq('id', targetAudienceId)
        .single();

      if (targetAudienceError) {
        throw new Error(`Nie udało się pobrać danych grupy docelowej: ${targetAudienceError.message}`);
      }

      console.log('Target audience data fetched:', targetAudienceData.name || 'Unnamed');

      // Step 1: Generate hooks with social-hook-agent
      const hooksResponse = await generateSocialHooks(
        targetAudienceData,
        advertisingGoal,
        platform?.key || 'meta'
      );
      
      console.log('Received hooks response:', hooksResponse);
      
      setHookResponse(hooksResponse);
      
      // Store debug info
      setDebugInfo({
        hooks: hooksResponse,
        platform: platform,
        targetAudience: targetAudienceData.id
      });
      
      // Step 2: Generate content with social-content-agent using the first hook
      const selectedHook = hooksResponse.hooks[0];
      
      const contentResponse = await generateSocialContent(
        targetAudienceData,
        hooksResponse,
        selectedHook,
        advertisingGoal,
        platform?.key || 'meta'
      );
      
      console.log('Received social content:', {
        contentLength: contentResponse.content?.length || 0,
        selectedHook: contentResponse.selectedHook
      });
      
      // Set the generated content
      setGeneratedContent(contentResponse.content);
      
      // Update debug info with content generation details
      setDebugInfo(prev => ({
        ...prev,
        content: contentResponse.debugInfo
      }));

      retryCount.current = 0;

    } catch (err: any) {
      if (mountedRef.current) {
        console.error("Error generating social post:", err);
        
        if (retryCount.current < maxRetries && 
            (err.message?.includes('fetch') || err.message?.includes('network') || err.message?.includes('timeout'))) {
          retryCount.current++;
          console.log(`Automatically retrying (${retryCount.current}/${maxRetries})...`);
          toast.error(`Błąd połączenia. Automatyczne ponawianie (${retryCount.current}/${maxRetries})...`);
          
          setTimeout(() => {
            generateSocialPost(true);
          }, 1500);
          return;
        }
        
        setError(err.message);
        toast.error("Błąd podczas generowania posta");
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsGeneratingNewContent(false);
        generationInProgress.current = false;
      }
    }
  };

  const handleRetry = () => {
    setError(null);
    generateSocialPost(true);
  };

  const saveToProject = async () => {
    if (!userId || !generatedContent || !targetAudienceId) {
      toast.error("Nie można zapisać projektu");
      return;
    }

    setIsSaving(true);

    try {
      const currentHook = hookResponse?.hooks[0] || '';
      const platformName = platform?.label || 'Meta';
      
      const savedProject = await saveSocialToProject(
        generatedContent,
        currentHook,
        platformName,
        userId,
        targetAudienceId,
        hookResponse || undefined,
        hookResponse?.hooks || []
      );
      
      setProjectId(savedProject.id);
      setProjectSaved(true);
      toast.success("Post zapisany w projektach");

    } catch (err: any) {
      console.error("Error saving social post to projects:", err);
      toast.error("Nie udało się zapisać posta");
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewProject = () => {
    if (projectId) {
      navigate(`/copy-editor/${projectId}`);
    }
  };

  return {
    isLoading,
    error,
    generatedContent,
    isSaving,
    projectSaved,
    projectId,
    hookResponse,
    isGeneratingNewContent,
    handleRetry,
    saveToProject,
    handleViewProject,
    setGeneratedContent
  };
};
