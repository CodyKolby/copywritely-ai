
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
    timestamp?: string;
    requestId?: string;
    functionVersion?: string;
  };
}

export const DEFAULT_SOCIAL_CONTENT_PROMPT = `Jesteś ekspertem od tworzenia treści na social media.`;

export async function generateSocialContent(
  targetAudienceData: any,
  hookOutput: SocialHookResponse,
  selectedHook: string | null,
  advertisingGoal: string = '',
  platform: string = 'meta'
): Promise<SocialContentResponse> {
  console.log('Generating social media content...');
  
  try {
    // Add anti-caching measures
    const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const timestamp = new Date().toISOString();
    
    // Call the social-content-agent edge function
    const { data, error } = await supabase.functions.invoke('social-content-agent', {
      body: {
        targetAudience: targetAudienceData,
        hookOutput,
        selectedHook,
        advertisingGoal,
        platform,
        cacheBuster,
        timestamp
      }
    });
    
    if (error) {
      console.error('Error generating social content:', error);
      throw new Error(`Błąd podczas generowania treści postu: ${error.message}`);
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
