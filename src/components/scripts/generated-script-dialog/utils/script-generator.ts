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

    // Different workflow for social media posts vs online ads (PAS)
    if (templateId === 'social') {
      // Social media posts workflow using posthook and postscript agents
      return generateSocialMediaPost(
        targetAudience,
        advertisingGoal,
        hookIndex,
        socialMediaPlatform,
        accessToken,
        cacheBuster
      );
    } else {
      // For online ads (PAS) and other templates, use the generate-script function
      return generateOnlineAdScript(
        targetAudience,
        advertisingGoal,
        hookIndex,
        templateId,
        accessToken
      );
    }
  } catch (error: any) {
    console.error('Error generating script:', error);
    throw error;
  }
};

// Function for generating social media posts
async function generateSocialMediaPost(
  targetAudience: any,
  advertisingGoal: string,
  hookIndex: number,
  socialMediaPlatform?: SocialMediaPlatform,
  accessToken?: string,
  cacheBuster?: string
): Promise<ScriptGenerationResult> {
  console.log('Używam workflow dla postów w social media');
  
  // Step 1: Generate hooks and theme with PostHook agent
  const timestamp = new Date().toISOString();
  const randomValue = Math.random().toString(36).substring(2, 15);
  
  const posthookRequestBody = {
    targetAudience,
    advertisingGoal,
    platform: socialMediaPlatform?.key || 'meta',
    cacheBuster: cacheBuster || `${Date.now()}`,
    timestamp: timestamp,
    randomValue: randomValue
  };

  console.log('Wysyłanie żądania do PostHook:', {
    ...posthookRequestBody,
    targetAudience: '...abbreviated...'
  });

  // Use the full URL with direct project ID reference to avoid any subdomain resolution issues
  const posthookResponse = await fetch('https://jorbqjareswzdrsmepbv.supabase.co/functions/v1/posthook-agent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Authorization': `Bearer ${accessToken}`,
      'X-Cache-Buster': `${Date.now()}-${randomValue}`,
      'X-Timestamp': timestamp,
      'X-Random': randomValue
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
  
  // Check if we got version info to confirm we're using the updated function
  if (posthookData.version) {
    console.log(`Using PostHook agent version: ${posthookData.version}, prompt: ${posthookData.promptUsed}`);
  }

  if (!posthookData || !posthookData.hooks || posthookData.hooks.length === 0) {
    throw new Error('Nie udało się wygenerować hooków');
  }

  // Select the hook based on the provided index, defaulting to the first one if out of bounds
  const selectedHookIndex = hookIndex >= 0 && hookIndex < posthookData.hooks.length ? hookIndex : 0;
  const selectedHook = posthookData.hooks[selectedHookIndex];

  // Step 2: Generate the script with PostScript agent
  const newTimestamp = new Date().toISOString();
  const newRandomValue = Math.random().toString(36).substring(2, 15);
  const newCacheBuster = `${Date.now()}-${newRandomValue}`;
  
  const postscriptRequestBody = {
    targetAudience,
    advertisingGoal,
    platform: socialMediaPlatform?.key || 'meta',
    posthookOutput: posthookData,
    cacheBuster: newCacheBuster, 
    timestamp: newTimestamp,
    randomValue: newRandomValue
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

  // Use the full URL with direct project ID reference to avoid any subdomain resolution issues
  const postscriptResponse = await fetch('https://jorbqjareswzdrsmepbv.supabase.co/functions/v1/postscript-agent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Authorization': `Bearer ${refreshedAccessToken}`,
      'X-Cache-Buster': newCacheBuster,
      'X-Timestamp': newTimestamp,
      'X-Random': newRandomValue
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

  return {
    script: postscriptData.content,
    bestHook: selectedHook,
    allHooks: posthookData.hooks,
    currentHookIndex: selectedHookIndex,
    totalHooks: posthookData.hooks.length,
    cta: posthookData.cta || '',
    theme: posthookData.theme || '',
    form: posthookData.form || '',
    adStructure: 'social',
    debugInfo: {
      posthookVersion: posthookData.version,
      posthookPromptUsed: posthookData.promptUsed,
      postscriptDebugInfo: postscriptData.debugInfo
    }
  };
}

// Function for generating online ad scripts using hook-generator and pas-script-generator
async function generateOnlineAdScript(
  targetAudience: any,
  advertisingGoal: string,
  hookIndex: number,
  templateId: string,
  accessToken?: string
): Promise<ScriptGenerationResult> {
  console.log('Używam workflow dla reklam internetowych (PAS)');

  // Get a fresh access token
  const { data: { session } } = await supabase.auth.getSession();
  const freshAccessToken = session?.access_token || accessToken || '';

  if (!freshAccessToken) {
    throw new Error('Nie można uzyskać tokenu dostępu');
  }

  // Call the generate-script function
  const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const response = await fetch(`https://jorbqjareswzdrsmepbv.supabase.co/functions/v1/generate-script`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${freshAccessToken}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
    body: JSON.stringify({
      templateId,
      targetAudienceId: targetAudience.id,
      advertisingGoal,
      hookIndex,
      debugInfo: true,
      cacheBuster
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Generate Script API error:', errorText);
    throw new Error(`Błąd podczas generowania skryptu: ${errorText}`);
  }

  const data = await response.json();
  console.log('Online Ad Script Generated Response:', {
    script: data.script?.substring(0, 50) + '...',
    hooks: data.allHooks ? data.allHooks.length : 0,
    hookIndex: data.currentHookIndex
  });

  return {
    script: data.script,
    bestHook: data.bestHook,
    allHooks: data.allHooks || [],
    currentHookIndex: data.currentHookIndex,
    totalHooks: data.allHooks ? data.allHooks.length : 0,
    adStructure: 'PAS',
    rawResponse: data.script,
    debugInfo: null
  };
}
