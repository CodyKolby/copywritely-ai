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
    const timestamp = new Date().toISOString();
    
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
      // Social media posts workflow using social-hook-agent and social-content-agent
      return generateSocialMediaPost(
        targetAudience,
        advertisingGoal,
        hookIndex,
        socialMediaPlatform,
        accessToken,
        cacheBuster,
        timestamp
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

// Function for generating social media posts using the new social workflow
async function generateSocialMediaPost(
  targetAudience: any,
  advertisingGoal: string,
  hookIndex: number,
  socialMediaPlatform?: SocialMediaPlatform,
  accessToken?: string,
  cacheBuster?: string,
  timestamp?: string
): Promise<ScriptGenerationResult> {
  console.log('Używam nowego workflow dla postów w social media');
  
  // Step 1: Generate hooks and theme with SocialHookAgent
  const currentTimestamp = timestamp || new Date().toISOString();
  const randomValue = Math.random().toString(36).substring(2, 15);
  const currentCacheBuster = cacheBuster || `${Date.now()}-${randomValue}`;
  
  const socialHookRequestBody = {
    targetAudience,
    advertisingGoal,
    platform: socialMediaPlatform?.key || 'meta',
    cacheBuster: currentCacheBuster,
    timestamp: currentTimestamp,
    randomValue: randomValue,
    test: process.env.NODE_ENV === 'development'
  };

  console.log('Wysyłanie żądania do SocialHookAgent z parametrami:', {
    targetAudienceId: targetAudience?.id,
    advertisingGoal,
    platform: socialMediaPlatform?.key || 'meta',
    hookIndex,
    cacheBuster: currentCacheBuster
  });

  // CRITICAL: Force no-cache by appending a unique timestamp to the URL
  const socialHookUrl = `https://jorbqjareswzdrsmepbv.supabase.co/functions/v1/social-hook-agent?_nocache=${Date.now()}-${randomValue}`;
  
  try {
    console.log('Calling social-hook-agent with URL:', socialHookUrl);
    
    const socialHookResponse = await fetch(socialHookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Authorization': `Bearer ${accessToken}`,
        'X-Cache-Buster': currentCacheBuster,
        'X-Timestamp': currentTimestamp,
        'X-Random': randomValue,
        'X-No-Cache': 'true'
      },
      body: JSON.stringify(socialHookRequestBody),
    });

    // Log detailed response information for debugging
    console.log('SocialHook Response Status:', socialHookResponse.status);
    console.log('SocialHook Response Headers:', Object.fromEntries(socialHookResponse.headers.entries()));
    
    if (!socialHookResponse.ok) {
      const errorText = await socialHookResponse.text();
      console.error('SocialHook API error:', errorText);
      
      // Try to parse as JSON if possible
      try {
        const errorJson = JSON.parse(errorText);
        console.error('SocialHook API error JSON:', errorJson);
        throw new Error(`Błąd podczas generowania hooków: ${errorJson.error || `Status ${socialHookResponse.status}`}`);
      } catch (e) {
        // If not JSON or parsing error, just use the text
        throw new Error(`Błąd podczas generowania hooków: Status ${socialHookResponse.status} - ${errorText.substring(0, 100)}`);
      }
    }

    const socialHookData = await socialHookResponse.json();
    console.log('Step 1 Complete: SocialHook response:', socialHookData);
    
    // Enhanced validation for hook data
    if (!socialHookData) {
      throw new Error('Otrzymano pustą odpowiedź z serwisu generowania hooków');
    }
    
    // Check for error in the response
    if (socialHookData.error) {
      throw new Error(`Błąd z serwisu hooków: ${socialHookData.error}`);
    }
    
    // Check if we got valid hooks
    if (!socialHookData.hooks || socialHookData.hooks.length === 0) {
      console.error('No hooks returned from social-hook-agent:', socialHookData);
      throw new Error('Nie udało się wygenerować hooków - brak lub pusta tablica hooków');
    }
    
    // Log detailed information about the hooks
    console.log('Generated hooks details:', {
      count: socialHookData.hooks.length,
      hooks: socialHookData.hooks,
      theme: socialHookData.theme,
      form: socialHookData.form,
      promptSource: socialHookData.promptSource,
      version: socialHookData.version
    });

    // Select the hook based on the provided index, defaulting to the first one if out of bounds
    const selectedHookIndex = hookIndex >= 0 && hookIndex < socialHookData.hooks.length ? hookIndex : 0;
    const selectedHook = socialHookData.hooks[selectedHookIndex];

    // Step 2: Generate the script with SocialContent agent
    const newTimestamp = new Date().toISOString();
    const newRandomValue = Math.random().toString(36).substring(2, 15);
    const newCacheBuster = `${Date.now()}-${newRandomValue}`;
    
    const socialContentRequestBody = {
      targetAudience,
      advertisingGoal,
      platform: socialMediaPlatform?.key || 'meta',
      hookOutput: socialHookData,
      selectedHook: selectedHook,
      cacheBuster: newCacheBuster, 
      timestamp: newTimestamp,
      randomValue: newRandomValue
    };

    console.log('Wysyłanie żądania do SocialContentAgent:', {
      ...socialContentRequestBody,
      targetAudience: '...abbreviated...',
      hookOutput: {
        hooks: socialHookData.hooks.length ? [socialHookData.hooks[0].substring(0, 30) + '...'] : [],
        theme: socialHookData.theme?.substring(0, 30) + '...'
      }
    });

    // Use a fresh copy of the access token to ensure it's not expired
    const { data: { session: refreshedSession } } = await supabase.auth.getSession();
    const refreshedAccessToken = refreshedSession?.access_token || accessToken;

    // CRITICAL: Force no-cache by appending a unique timestamp to the URL
    const socialContentUrl = `https://jorbqjareswzdrsmepbv.supabase.co/functions/v1/social-content-agent?_nocache=${Date.now()}`;
    
    const socialContentResponse = await fetch(socialContentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Authorization': `Bearer ${refreshedAccessToken}`,
        'X-Cache-Buster': newCacheBuster,
        'X-Timestamp': newTimestamp,
        'X-Random': newRandomValue,
        'X-No-Cache': 'true'
      },
      body: JSON.stringify(socialContentRequestBody),
    });

    if (!socialContentResponse.ok) {
      const errorText = await socialContentResponse.text();
      console.error('SocialContent API error:', errorText);
      throw new Error(`Błąd podczas generowania treści posta: ${errorText}`);
    }

    const socialContentData = await socialContentResponse.json();
    console.log('Step 2 Complete: SocialContentAgent full response:', socialContentData);

    if (!socialContentData || !socialContentData.content) {
      throw new Error('Nie udało się wygenerować treści posta');
    }

    return {
      script: socialContentData.content,
      bestHook: selectedHook,
      allHooks: socialHookData.hooks,
      currentHookIndex: selectedHookIndex,
      totalHooks: socialHookData.hooks.length,
      cta: socialHookData.cta || '',
      theme: socialHookData.theme || '',
      form: socialHookData.form || '',
      adStructure: 'social',
      debugInfo: {
        socialHookVersion: socialHookData.version || 'unknown',
        socialHookPromptUsed: socialHookData.promptUsed || 'unknown',
        socialHookDeploymentId: socialHookData.deploymentId || 'unknown',
        socialHookRequestId: socialHookData.requestId || 'unknown',
        socialContentDebugInfo: socialContentData.debugInfo
      }
    };
  } catch (error: any) {
    console.error('Error in generateSocialMediaPost:', error);
    // Provide more detailed error information for debugging
    throw new Error(`Błąd generowania posta: ${error.message}`);
  }
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
  const response = await fetch(`https://jorbqjareswzdrsmepbv.supabase.co/functions/v1/generate-script?_nocache=${Date.now()}`, {
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
