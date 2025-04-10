
import { supabase } from '@/integrations/supabase/client';
import { SocialHookResponse } from './social-hook-service';

export interface SocialContentResponse {
  content: string;
  selectedHook: string;
  theme?: string;
  form?: string;
  cta?: string;
  platform?: string;
  promptSource?: string;
  version?: string;
  deploymentId?: string;
  requestId?: string;
  debugInfo?: {
    systemPromptUsed?: string;
    systemPromptLength?: number;
    timestamp?: string;
    requestId?: string;
    functionVersion?: string;
    promptFullText?: string;
    selectedHookText?: string;
    receivedHooks?: string[];
  };
  error?: string;
}

export const DEFAULT_SOCIAL_CONTENT_PROMPT = `Jesteś ekspertem od tworzenia treści na social media.`;

export async function generateSocialContent(
  targetAudienceData: any,
  hookOutput: SocialHookResponse,
  selectedHook: string | null,
  advertisingGoal: string = '',
  platform: string = 'meta'
): Promise<SocialContentResponse> {
  console.log('Generating social media content with parameters:', {
    targetAudienceId: targetAudienceData?.id,
    hooksAvailable: hookOutput?.hooks?.length || 0,
    selectedHook: selectedHook,
    goalLength: advertisingGoal?.length || 0,
    platform,
    timestamp: new Date().toISOString()
  });
  
  try {
    // Add aggressive anti-caching measures
    const timestamp = new Date().toISOString();
    const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const randomValue = Math.random().toString(36).substring(2, 15);
    
    // Ensure we have valid hook data
    if (!hookOutput || !hookOutput.hooks || hookOutput.hooks.length === 0) {
      console.error('Invalid hook output:', hookOutput);
      throw new Error('Brak prawidłowych danych o hookach');
    }
    
    // NEW: Ensure we only pass the first hook (even if there are more)
    const simplifiedHookOutput = {
      ...hookOutput,
      hooks: hookOutput.hooks.length > 0 ? [hookOutput.hooks[0]] : hookOutput.hooks,
      version: hookOutput.version || 'v1.9.0',
      promptSource: hookOutput.promptSource || 'HARDCODED_IN_CODE'
    };
    
    // Log the hook data for debugging
    console.log('Hook data being sent to content agent:', {
      hooks: simplifiedHookOutput.hooks,
      theme: simplifiedHookOutput.theme,
      form: simplifiedHookOutput.form,
      selectedHook: selectedHook || simplifiedHookOutput.hooks[0],
      version: simplifiedHookOutput.version,
      promptSource: simplifiedHookOutput.promptSource
    });
    
    // CRITICAL: Use Supabase functions.invoke instead of direct fetch
    // This ensures proper authentication and CORS handling
    console.log(`Invoking social-content-agent function with cacheBuster: ${cacheBuster}`);
    const { data, error } = await supabase.functions.invoke('social-content-agent', {
      body: {
        targetAudience: targetAudienceData,
        hookOutput: simplifiedHookOutput,
        selectedHook: selectedHook || (simplifiedHookOutput.hooks && simplifiedHookOutput.hooks.length > 0 ? simplifiedHookOutput.hooks[0] : null),
        advertisingGoal,
        platform,
        cacheBuster,
        timestamp,
        randomValue,
        testMode: process.env.NODE_ENV === 'development',
        forcePromptRefresh: true,
        clientVersion: 'v1.9.0'
      }
    });
    
    if (error) {
      console.error('Error from supabase.functions.invoke social-content-agent:', error);
      throw new Error(`Błąd podczas generowania treści postu: ${error.message}`);
    }
    
    // Log the full response including all metadata
    console.log('Social content generated successfully. Full response:', data);
    console.log('Content version from response:', data.version);
    console.log('Content deployment ID from response:', data.deploymentId);
    console.log('Content prompt source from response:', data.promptSource);
    console.log('Content debug info from response:', data.debugInfo);
    
    // Validate response data
    if (!data) {
      throw new Error('Otrzymano pustą odpowiedź z serwisu generowania treści');
    }
    
    // Check for error in the response
    if (data.error) {
      throw new Error(`Błąd z serwisu treści: ${data.error}`);
    }
    
    // Validate content
    if (!data.content) {
      console.error('No content in response:', data);
      throw new Error('Brak wygenerowanej treści w odpowiedzi');
    }
    
    console.log('Social content generated successfully', {
      contentLength: data.content?.length || 0,
      selectedHook: data.selectedHook,
      promptSource: data.promptSource,
      version: data.version
    });
    
    return data as SocialContentResponse;
  } catch (err: any) {
    console.error('Failed to generate social content:', err);
    throw new Error(`Nie udało się wygenerować treści postu: ${err.message}`);
  }
}
