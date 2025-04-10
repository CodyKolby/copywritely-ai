
import { supabase } from '@/integrations/supabase/client';

export interface SocialHookResponse {
  finalIntro: string;
  version?: string;
  promptUsed?: string;
  requestId?: string;
  error?: string;
  debug?: any;
  promptSource?: string;
  deploymentId?: string;
}

export const DEFAULT_SOCIAL_HOOK_PROMPT = `Jesteś ekspertem od marketingu w mediach społecznościowych. Twoim zadaniem jest przygotowanie przyciągającego intro do posta.`;

export async function generateSocialHooks(
  targetAudienceData: any,
  advertisingGoal: string = '',
  platform: string = 'meta'
): Promise<SocialHookResponse> {
  console.log('Generating social media intro with parameters:', {
    targetAudienceId: targetAudienceData?.id,
    goalLength: advertisingGoal?.length || 0,
    platform,
    timestamp: new Date().toISOString()
  });
  
  try {
    // Add extremely strong anti-caching measures with multiple random values
    const timestamp = new Date().toISOString();
    const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const randomValue = Math.random().toString(36).substring(2, 15);
    
    // CRITICAL: Use Supabase function invoke instead of direct fetch
    // This ensures proper authentication and CORS handling
    console.log(`Invoking social-hook-agent function with cacheBuster: ${cacheBuster}`);
    const { data, error } = await supabase.functions.invoke('social-hook-agent', {
      body: {
        targetAudience: targetAudienceData,
        advertisingGoal,
        platform,
        cacheBuster,
        timestamp,
        randomValue,
        forcePromptRefresh: true, 
        testMode: process.env.NODE_ENV === 'development',
        clientVersion: 'v1.9.1'
      }
    });

    if (error) {
      console.error('Error from supabase.functions.invoke social-hook-agent:', error);
      throw new Error(`Błąd podczas generowania intro: ${error.message}`);
    }
    
    // Log the full response including all metadata
    console.log('Social intro generated successfully. Full response:', data);
    console.log('Version from response:', data.version);
    console.log('Deployment ID from response:', data.deploymentId);
    console.log('Prompt source from response:', data.promptSource);
    console.log('Final intro:', data.finalIntro);
    console.log('Debug info from response:', data.debug);
    
    // Check for environment variables that might be overriding our settings
    console.log('Environment variables check:', {
      NODE_ENV: process.env.NODE_ENV,
      VITE_APP_VERSION: process.env.VITE_APP_VERSION,
    });
    
    // Validate response data
    if (!data) {
      throw new Error('Otrzymano pustą odpowiedź z serwisu generowania intro');
    }
    
    // Check for error in the response
    if (data.error) {
      throw new Error(`Błąd z serwisu intro: ${data.error}`);
    }
    
    // Validate intro data
    if (!data.finalIntro) {
      console.error('No intro in response:', data);
      throw new Error('Brak wygenerowanego intro w odpowiedzi');
    }
    
    // Ensure the response has the expected structure
    const hookResponse: SocialHookResponse = {
      finalIntro: data.finalIntro || "Czy wiesz, że...",
      version: data.version || "unknown",
      promptUsed: data.promptUsed || "unknown",
      requestId: data.requestId || "unknown",
      promptSource: data.promptSource || "unknown",
      deploymentId: data.deploymentId || "unknown",
      debug: data.debug || {}
    };
    
    return hookResponse;
  } catch (err: any) {
    console.error('Failed to generate social intro:', err);
    throw new Error(`Nie udało się wygenerować intro: ${err.message}`);
  }
}
