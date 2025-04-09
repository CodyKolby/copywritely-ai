import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from 'uuid';
import { SocialMediaPlatform } from '../SocialMediaPlatformDialog';

// Helper function to fetch target audience details
export async function fetchTargetAudience(audienceId: string) {
  try {
    console.log(`Fetching target audience with ID: ${audienceId}`);
    
    const { data, error } = await supabase
      .from('target_audiences')
      .select('*')
      .eq('id', audienceId)
      .single();

    if (error) throw error;
    
    console.log("Target audience fetched successfully:", data ? "yes" : "no");
    return data;
  } catch (error) {
    console.error('Error fetching target audience:', error);
    throw new Error('Failed to fetch target audience data');
  }
}

// Define a consistent return type for all script generation functions
interface ScriptGenerationResult {
  script: string;
  bestHook: string;
  allHooks: string[];
  currentHookIndex: number;
  totalHooks: number;
  adStructure: string;
  rawResponse?: string;
  debugInfo?: any;
  // Optional properties for social media posts
  cta?: string;
  theme?: string;
  form?: string;
}

// Main function to generate script
export const generateScript = async (
  templateId: string,
  targetAudienceId: string,
  advertisingGoal: string = '',
  hookIndex: number = 0,
  socialMediaPlatform?: { key: string; label: string }
): Promise<ScriptGenerationResult> => {
  try {
    console.log('Rozpoczęto generowanie skryptu:', {
      templateId,
      targetAudienceId,
      advertisingGoal,
      hookIndex,
      platform: socialMediaPlatform?.label
    });

    // Add a cache-busting timestamp to prevent caching issues
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

    // Prepare the request body for the PostHook agent
    const posthookRequestBody = {
      targetAudience,
      advertisingGoal,
      platform: socialMediaPlatform?.key || 'meta',
      cacheBuster
    };

    console.log('Wysyłanie żądania do PostHook:', posthookRequestBody);

    // Step 1: Generate hooks and theme with PostHook agent
    const posthookResponse = await fetch('https://jorbqjareswzdrsmepbv.supabase.co/functions/v1/posthook-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      body: JSON.stringify(posthookRequestBody),
    });

    if (!posthookResponse.ok) {
      console.error('PostHook API error:', await posthookResponse.text());
      throw new Error('Błąd podczas generowania hooków');
    }

    const posthookData = await posthookResponse.json();
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
      cacheBuster: `${cacheBuster}-${Date.now()}` // Add another timestamp to ensure no caching
    };

    console.log('Wysyłanie żądania do PostScript:', {
      ...postscriptRequestBody,
      targetAudience: '...abbreviated...',
      posthookOutput: {
        hooks: posthookData.hooks.length ? [posthookData.hooks[0].substring(0, 30) + '...'] : [],
        theme: posthookData.theme?.substring(0, 30) + '...'
      }
    });

    const postscriptResponse = await fetch('https://jorbqjareswzdrsmepbv.supabase.co/functions/v1/postscript-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      body: JSON.stringify(postscriptRequestBody),
    });

    if (!postscriptResponse.ok) {
      console.error('PostScript API error:', await postscriptResponse.text());
      throw new Error('Błąd podczas generowania skryptu');
    }

    const postscriptData = await postscriptResponse.json();
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
          timestamp: new Date().toISOString()
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
        timestamp: new Date().toISOString()
      }
    };
  } catch (error: any) {
    console.error('Error generating script:', error);
    throw error;
  }
};

// Save script as a project in the database
export async function saveScriptAsProject(
  scriptContent: string, 
  hookText: string, 
  templateId: string, 
  userId: string,
  socialMediaPlatform?: SocialMediaPlatform
) {
  try {
    const projectId = uuidv4();

    const title = 
      templateId === 'email' ? 'Email sprzedażowy' : 
      templateId === 'social' ? `Post na ${getSocialMediaPlatformName(socialMediaPlatform)}` : 
      templateId === 'ad' ? 'Reklama internetowa' : 
      'Skrypt';

    const projectData = {
      id: projectId,
      title: `${title}: ${hookText.substring(0, 30)}${hookText.length > 30 ? '...' : ''}`,
      content: scriptContent,
      hook: hookText,
      user_id: userId,
      type: templateId,
      status: 'Draft' as 'Draft' | 'Completed' | 'Reviewed',
      metadata: socialMediaPlatform ? { socialMediaPlatform } : null
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (error) {
      console.error('Error saving script as project:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in saveScriptAsProject:', error);
    throw error;
  }
}

// Helper to get a friendly platform name
function getSocialMediaPlatformName(platform?: SocialMediaPlatform): string {
  switch (platform) {
    case 'meta':
      return 'Meta (Facebook/Instagram)';
    case 'tiktok':
      return 'TikTok';
    case 'linkedin':
      return 'LinkedIn';
    default:
      return 'social media';
  }
}
