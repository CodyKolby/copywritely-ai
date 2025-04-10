
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
    // Add anti-caching measures
    const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const timestamp = new Date().toISOString();
    
    // Log the request details for debugging
    console.log('Sending request to social-hook-agent with cache buster:', cacheBuster);
    
    // Call the social-hook-agent edge function with direct URL to avoid caching
    const directUrl = `https://jorbqjareswzdrsmepbv.supabase.co/functions/v1/social-hook-agent?_nocache=${Date.now()}`;
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token || '';
    
    const fetchResponse = await fetch(directUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
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
        test: process.env.NODE_ENV === 'development' // Add test flag in development
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
      requestId: data.requestId
    };
    
    return hookResponse;
  } catch (err: any) {
    console.error('Failed to generate social hooks:', err);
    throw new Error(`Nie udało się wygenerować hooków: ${err.message}`);
  }
}
