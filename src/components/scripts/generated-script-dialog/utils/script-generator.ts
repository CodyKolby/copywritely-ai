
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

    // Use template specific generators
    if (templateId === 'social') {
      return generateSocialMedia(
        targetAudience,
        advertisingGoal,
        socialMediaPlatform,
        accessToken
      );
    } else {
      // Default to online ad script for other templates
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
async function generateSocialMedia(
  targetAudience: any,
  advertisingGoal: string,
  socialMediaPlatform?: SocialMediaPlatform,
  accessToken?: string
): Promise<ScriptGenerationResult> {
  console.log('Używam workflow dla postów na social media');
  
  // Get a fresh access token
  const { data: { session } } = await supabase.auth.getSession();
  const freshAccessToken = session?.access_token || accessToken || '';

  if (!freshAccessToken) {
    throw new Error('Nie można uzyskać tokenu dostępu');
  }

  const platform = socialMediaPlatform?.label || 'Meta (Facebook/Instagram)';
  const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  
  try {
    // Step 1: Generate intro with social-intro-agent
    console.log('Generowanie intro dla postu na platformę:', platform);
    const introResponse = await fetch(`https://jorbqjareswzdrsmepbv.supabase.co/functions/v1/social-intro-agent?_nocache=${cacheBuster}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freshAccessToken}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      body: JSON.stringify({
        targetAudience,
        advertisingGoal,
        platform,
        cacheBuster
      }),
    });
    
    if (!introResponse.ok) {
      const errorText = await introResponse.text();
      console.error('Social Intro API error:', errorText);
      throw new Error(`Błąd podczas generowania intro: ${errorText}`);
    }
    
    const introData = await introResponse.json();
    const generatedIntro = introData.intro;
    
    console.log('Wygenerowano intro:', generatedIntro.substring(0, 50) + '...');
    
    // Step 2: Generate the full post with social-post-agent
    console.log('Generowanie pełnej treści postu na platformę:', platform);
    const postResponse = await fetch(`https://jorbqjareswzdrsmepbv.supabase.co/functions/v1/social-post-agent?_nocache=${cacheBuster}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freshAccessToken}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      body: JSON.stringify({
        targetAudience,
        advertisingGoal,
        intro: generatedIntro,
        platform,
        cacheBuster
      }),
    });
    
    if (!postResponse.ok) {
      const errorText = await postResponse.text();
      console.error('Social Post API error:', errorText);
      throw new Error(`Błąd podczas generowania pełnego postu: ${errorText}`);
    }
    
    const postData = await postResponse.json();
    const fullPost = postData.post;
    
    console.log('Wygenerowano pełny post:', fullPost.substring(0, 50) + '...');
    
    return {
      script: fullPost,
      bestHook: generatedIntro,
      allHooks: [generatedIntro],
      currentHookIndex: 0,
      totalHooks: 1,
      adStructure: 'social',
      rawResponse: fullPost,
      debugInfo: null
    };
  } catch (error) {
    console.error('Error generating social media post:', error);
    throw error;
  }
}

// Function for generating online ad scripts
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
