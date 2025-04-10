
import { supabase } from '@/integrations/supabase/client';

export interface SocialHookResponse {
  hooks: string[];
  theme?: string;
  form?: string;
  cta?: string;
  version?: string;
  promptUsed?: string;
  requestId?: string;
  error?: string;
  debug?: any;
  promptSource?: string;
  deploymentId?: string;
}

export const DEFAULT_SOCIAL_HOOK_PROMPT = `Jesteś ekspertem od marketingu w mediach społecznościowych. Twoim zadaniem jest przygotowanie hooków i tematyki.`;

export async function generateSocialHooks(
  targetAudienceData: any,
  advertisingGoal: string = '',
  platform: string = 'meta'
): Promise<SocialHookResponse> {
  console.log('Generating social media hooks with parameters:', {
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
    
    // Get authentication token from Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token || '';
    
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
        clientVersion: 'v1.9.0'
      }
    });

    if (error) {
      console.error('Error from supabase.functions.invoke social-hook-agent:', error);
      throw new Error(`Błąd podczas generowania hooków: ${error.message}`);
    }
    
    // Log the full response including all metadata
    console.log('Social hooks generated successfully. Full response:', data);
    console.log('Version from response:', data.version);
    console.log('Deployment ID from response:', data.deploymentId);
    console.log('Prompt source from response:', data.promptSource);
    console.log('All hooks:', data.hooks);
    console.log('Debug info from response:', data.debug);
    
    // Make sure we have only 1 hook
    if (data && data.hooks && data.hooks.length > 1) {
      console.log('Multiple hooks detected in response, keeping only the first one');
      data.hooks = [data.hooks[0]];
    }
    
    // Check for environment variables that might be overriding our settings
    console.log('Environment variables check:', {
      NODE_ENV: process.env.NODE_ENV,
      VITE_APP_VERSION: process.env.VITE_APP_VERSION,
    });
    
    // Validate response data
    if (!data) {
      throw new Error('Otrzymano pustą odpowiedź z serwisu generowania hooków');
    }
    
    // Check for error in the response
    if (data.error) {
      throw new Error(`Błąd z serwisu hooków: ${data.error}`);
    }
    
    // Validate hook data
    if (!data.hooks || data.hooks.length === 0) {
      console.error('No hooks in response:', data);
      throw new Error('Brak wygenerowanych hooków w odpowiedzi');
    }
    
    // Ensure the response has the expected structure
    const hookResponse: SocialHookResponse = {
      hooks: data.hooks || ["Nie udało się wygenerować hooków"],
      theme: data.theme || "Ogólna tematyka",
      form: data.form || "post tekstowy",
      cta: data.cta || "Sprawdź więcej",
      version: data.version || "unknown",
      promptUsed: data.promptUsed || "unknown",
      requestId: data.requestId || "unknown",
      promptSource: data.promptSource || "unknown",
      deploymentId: data.deploymentId || "unknown",
      debug: data.debug || {}
    };
    
    return hookResponse;
  } catch (err: any) {
    console.error('Failed to generate social hooks:', err);
    throw new Error(`Nie udało się wygenerować hooków: ${err.message}`);
  }
}
