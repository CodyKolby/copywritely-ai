
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
    
    // Log the hook data for debugging
    console.log('Hook data being sent to content agent:', {
      hooks: hookOutput.hooks,
      theme: hookOutput.theme,
      form: hookOutput.form,
      selectedHook: selectedHook || hookOutput.hooks[0],
      version: hookOutput.version,
      promptSource: hookOutput.promptSource
    });
    
    // Get authentication token
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token || '';
    
    // Use the most direct URL possible with clear cache busting appended to URL
    const contentDirectUrl = `https://jorbqjareswzdrsmepbv.supabase.co/functions/v1/social-content-agent?_nocache=${Date.now()}-${randomValue}`;
    
    console.log(`Sending request to social-content-agent at ${timestamp}`);
    console.log(`Direct URL with cache busting: ${contentDirectUrl}`);
    
    // Call with aggressive anti-cache headers
    const contentResponse = await fetch(contentDirectUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Cache-Buster': cacheBuster,
        'X-Timestamp': timestamp,
        'X-Random': randomValue,
        'X-No-Cache': 'true',
        'X-Client-Info': `v1.8.0-${Date.now()}`
      },
      body: JSON.stringify({
        targetAudience: targetAudienceData,
        hookOutput,
        selectedHook,
        advertisingGoal,
        platform,
        cacheBuster,
        timestamp,
        randomValue,
        testMode: process.env.NODE_ENV === 'development',
        forcePromptRefresh: true,
        clientVersion: 'v1.8.0'
      })
    });
    
    // Log response headers for debugging
    console.log('Content Response headers:', Object.fromEntries(contentResponse.headers.entries()));
    console.log('Content Response status:', contentResponse.status);
    
    if (!contentResponse.ok) {
      const errorText = await contentResponse.text();
      console.error('Error response from social-content-agent:', errorText);
      throw new Error(`Błąd podczas generowania treści postu: Status ${contentResponse.status} - ${errorText.substring(0, 100)}`);
    }
    
    const data = await contentResponse.json();
    
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
