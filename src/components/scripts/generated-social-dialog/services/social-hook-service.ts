
import { supabase } from '@/integrations/supabase/client';

export interface SocialHookResponse {
  hooks: string[];
  theme?: string;
  form?: string;
  cta?: string;
  version?: string;
  promptUsed?: string;
  requestId?: string;
}

export const DEFAULT_SOCIAL_HOOK_PROMPT = `Jesteś ekspertem od marketingu w mediach społecznościowych. Twoim zadaniem jest przygotowanie hooków i tematyki.`;

export async function generateSocialHooks(
  targetAudienceData: any,
  advertisingGoal: string = '',
  platform: string = 'meta'
): Promise<SocialHookResponse> {
  console.log('Generating social media hooks...');
  
  try {
    // Add anti-caching measures
    const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const timestamp = new Date().toISOString();
    
    // Call the social-hook-agent edge function
    const { data, error } = await supabase.functions.invoke('social-hook-agent', {
      body: {
        targetAudience: targetAudienceData,
        advertisingGoal,
        platform,
        cacheBuster,
        timestamp
      }
    });
    
    if (error) {
      console.error('Error generating social hooks:', error);
      throw new Error(`Błąd podczas generowania hooków: ${error.message}`);
    }
    
    console.log('Social hooks generated successfully:', data);
    
    // Ensure the response has the expected structure
    const response: SocialHookResponse = {
      hooks: data.hooks || ["Nie udało się wygenerować hooków"],
      theme: data.theme || "Ogólna tematyka",
      form: data.form || "post tekstowy",
      cta: data.cta || "Sprawdź więcej",
      version: data.version,
      promptUsed: data.promptUsed,
      requestId: data.requestId
    };
    
    return response;
  } catch (err: any) {
    console.error('Failed to generate social hooks:', err);
    throw new Error(`Nie udało się wygenerować hooków: ${err.message}`);
  }
}
