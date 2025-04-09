
import type { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';
import { ScriptGenerationResult, PosthookResponse, PostscriptResponse } from './types';
import { supabase } from "@/integrations/supabase/client";

// Main function to generate script
export const generateScript = async (
  templateId: string,
  targetAudienceId: string,
  advertisingGoal: string = '',
  hookIndex: number = 0,
  socialMediaPlatform?: SocialMediaPlatform
): Promise<ScriptGenerationResult> => {
  try {
    console.log('Rozpoczęto generowanie skryptu:', {
      templateId,
      targetAudienceId,
      advertisingGoal,
      hookIndex,
      platform: socialMediaPlatform?.label || 'Meta'
    });

    // Add a strong cache-busting timestamp to prevent caching issues
    const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    
    // Fetch the target audience data first
    const { data: targetAudience, error: audienceError } = await supabase
      .from('target_audiences')
      .select('*')
      .eq('id', targetAudienceId)
      .single();

    if (audienceError || !targetAudience) {
      console.error('Error fetching target audience:', audienceError);
      throw new Error(`Nie znaleziono grupy docelowej: ${audienceError?.message || 'Unknown error'}`);
    }

    console.log('Pobrano dane grupy docelowej:', targetAudience);

    // Get the access token
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token || '';
    
    if (!accessToken) {
      throw new Error('Użytkownik nie jest zalogowany.');
    }

    // Prepare the request body for the PostHook agent
    const posthookRequestBody = {
      targetAudience,
      advertisingGoal,
      platform: socialMediaPlatform?.key || 'meta',
      cacheBuster,
      timestamp: new Date().toISOString()
    };

    console.log('Wysyłanie żądania do PostHook:', posthookRequestBody);

    // Step 1: Generate hooks and theme with PostHook agent
    const posthookResponse = await fetch('https://jorbqjareswzdrsmepbv.supabase.co/functions/v1/posthook-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(posthookRequestBody),
    });

    if (!posthookResponse.ok) {
      const errorText = await posthookResponse.text();
      console.error('PostHook API error:', errorText);
      throw new Error(`Błąd podczas generowania hooków: ${errorText}`);
    }

    const posthookData: PosthookResponse = await posthookResponse.json();
    console.log('Step 1 Complete: PostHook response:', posthookData);

    if (!posthookData || !posthookData.hooks || posthookData.hooks.length === 0) {
      throw new Error('Nie udało się wygenerować hooków');
    }

    // Select the hook based on the provided index, defaulting to the first one if out of bounds
    const selectedHookIndex = hookIndex >= 0 && hookIndex < posthookData.hooks.length ? hookIndex : 0;
    const selectedHook = posthookData.hooks[selectedHookIndex];

    // Step 2: Generate the script with PostScript agent
    const postscriptRequestBody = {
      targetAudience,
      advertisingGoal,
      platform: socialMediaPlatform?.key || 'meta',
      posthookOutput: posthookData,
      cacheBuster: `${cacheBuster}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`, // Add another timestamp and random value to ensure no caching
      timestamp: new Date().toISOString()
    };

    console.log('Wysyłanie żądania do PostScript:', {
      ...postscriptRequestBody,
      targetAudience: '...abbreviated...',
      posthookOutput: {
        hooks: posthookData.hooks.length ? [posthookData.hooks[0].substring(0, 30) + '...'] : [],
        theme: posthookData.theme?.substring(0, 30) + '...'
      }
    });

    // Use a fresh copy of the access token to ensure it's not expired
    const { data: { session: refreshedSession } } = await supabase.auth.getSession();
    const refreshedAccessToken = refreshedSession?.access_token || accessToken;

    const postscriptResponse = await fetch('https://jorbqjareswzdrsmepbv.supabase.co/functions/v1/postscript-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Authorization': `Bearer ${refreshedAccessToken}`,
        'X-Timestamp': new Date().toISOString(),
        'X-Random': Math.random().toString()
      },
      body: JSON.stringify(postscriptRequestBody),
    });

    if (!postscriptResponse.ok) {
      const errorText = await postscriptResponse.text();
      console.error('PostScript API error:', errorText);
      throw new Error(`Błąd podczas generowania skryptu: ${errorText}`);
    }

    const postscriptData: PostscriptResponse = await postscriptResponse.json();
    console.log('Step 2 Complete: PostscriptAgent full response:', postscriptData);

    if (!postscriptData || !postscriptData.content) {
      throw new Error('Nie udało się wygenerować treści skryptu');
    }

    // For social media posts, structure is different
    if (templateId === 'social') {
      return {
        script: postscriptData.content,
        bestHook: selectedHook,
        allHooks: posthookData.hooks,
        currentHookIndex: selectedHookIndex,
        totalHooks: posthookData.hooks.length,
        cta: posthookData.cta || '',
        theme: posthookData.theme || '',
        form: posthookData.form || '',
        rawResponse: postscriptData.rawResponse || postscriptData.content,
        adStructure: 'social',
        debugInfo: {
          ...postscriptData.debugInfo,
          posthookData: JSON.stringify(posthookData),
          postscriptData: JSON.stringify(postscriptData),
          systemPromptUsed: postscriptData.debugInfo?.systemPromptUsed || 'Not available',
          timestamp: new Date().toISOString(),
          requestTimestamp: new Date().toISOString()
        }
      };
    }

    // For regular scripts
    return {
      script: postscriptData.content,
      bestHook: selectedHook,
      allHooks: posthookData.hooks,
      currentHookIndex: selectedHookIndex,
      totalHooks: posthookData.hooks.length,
      adStructure: 'PAS',
      rawResponse: postscriptData.rawResponse || postscriptData.content,
      debugInfo: {
        ...postscriptData.debugInfo,
        posthookData: JSON.stringify(posthookData),
        postscriptData: JSON.stringify(postscriptData),
        systemPromptUsed: postscriptData.debugInfo?.systemPromptUsed || 'Not available',
        timestamp: new Date().toISOString(),
        requestTimestamp: new Date().toISOString()
      }
    };
  } catch (error: any) {
    console.error('Error generating script:', error);
    throw error;
  }
};
