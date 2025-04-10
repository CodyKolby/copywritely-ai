
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
    platform
  });
  
  try {
    // Add anti-caching measures with timestamp to force fresh execution
    const timestamp = new Date().toISOString();
    const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Get authentication token
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token || '';
    
    // Use a direct URL to avoid any proxy caching
    const directUrl = `https://jorbqjareswzdrsmepbv.supabase.co/functions/v1/social-hook-agent?_nocache=${timestamp}`;
    
    console.log(`Sending request to social-hook-agent at ${timestamp} with cache buster: ${cacheBuster}`);
    
    // Call with aggressive anti-cache headers
    const fetchResponse = await fetch(directUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Cache-Buster': cacheBuster,
        'X-Timestamp': timestamp
      },
      body: JSON.stringify({
        targetAudience: targetAudienceData,
        advertisingGoal,
        platform,
        cacheBuster,
        timestamp,
        testMode: process.env.NODE_ENV === 'development' // Add test flag in development
      })
    });
    
    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      console.error('Error response from social-hook-agent:', errorText);
      throw new Error(`Błąd podczas generowania hooków: Status ${fetchResponse.status} - ${errorText.substring(0, 100)}`);
    }
    
    const data = await fetchResponse.json();
    
    // Validate response data
    if (!data) {
      throw new Error('Otrzymano pustą odpowiedź z serwisu generowania hooków');
    }
    
    // Check for error in the response
    if (data.error) {
      throw new Error(`Błąd z serwisu hooków: ${data.error}`);
    }
    
    // Log the full response for debugging
    console.log('Social hooks generated successfully:', data);
    console.log('Debug info from hook agent:', data.debug);
    
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
      version: data.version,
      promptUsed: data.promptUsed,
      requestId: data.requestId,
      debug: data.debug
    };
    
    return hookResponse;
  } catch (err: any) {
    console.error('Failed to generate social hooks:', err);
    throw new Error(`Nie udało się wygenerować hooków: ${err.message}`);
  }
}
