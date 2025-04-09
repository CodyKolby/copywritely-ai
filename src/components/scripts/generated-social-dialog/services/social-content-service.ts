
import { supabase } from '@/integrations/supabase/client';
import { SocialHookResponse } from './social-hook-service';

export interface SocialContentResponse {
  content: string;
  selectedHook: string;
  theme?: string;
  form?: string;
  cta?: string;
  platform?: string;
  debugInfo?: {
    systemPromptUsed?: string;
    systemPromptLength?: number;
    timestamp?: string;
    requestId?: string;
    functionVersion?: string;
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
    platform
  });
  
  try {
    // Add anti-caching measures
    const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const timestamp = new Date().toISOString();
    
    // Ensure we have valid hook data
    if (!hookOutput || !hookOutput.hooks || hookOutput.hooks.length === 0) {
      console.error('Invalid hook output:', hookOutput);
      throw new Error('Brak prawidłowych danych o hookach');
    }
    
    // Log the hook data for debugging
    console.log('Hook data being sent to content agent:', {
      hooks: hookOutput.hooks,
      theme: hookOutput.theme,
      form: hookOutput.form,
      selectedHook: selectedHook || hookOutput.hooks[0]
    });
    
    // Call the social-content-agent edge function
    const { data, error } = await supabase.functions.invoke('social-content-agent', {
      body: {
        targetAudience: targetAudienceData,
        hookOutput,
        selectedHook,
        advertisingGoal,
        platform,
        cacheBuster,
        timestamp,
        test: process.env.NODE_ENV === 'development' // Add test flag in development
      }
    });
    
    if (error) {
      console.error('Error generating social content:', error);
      throw new Error(`Błąd podczas generowania treści postu: ${error.message}`);
    }
    
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
      selectedHook: data.selectedHook
    });
    
    return data as SocialContentResponse;
  } catch (err: any) {
    console.error('Failed to generate social content:', err);
    throw new Error(`Nie udało się wygenerować treści postu: ${err.message}`);
  }
}
