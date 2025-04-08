
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

// Main function to generate script
export async function generateScript(
  templateId: string,
  audienceId: string,
  advertisingGoal: string = '',
  hookIndex: number = 0,
  socialMediaPlatform?: SocialMediaPlatform
) {
  try {
    console.log(`Generating script for template: ${templateId}, audience: ${audienceId}, goal: ${advertisingGoal}, platform: ${socialMediaPlatform || 'undefined'}`);

    // Fetch target audience first
    const targetAudience = await fetchTargetAudience(audienceId);
    if (!targetAudience) {
      throw new Error('Target audience not found');
    }

    // Add the advertising goal to the target audience data
    const audienceWithGoal = {
      ...targetAudience,
      advertisingGoal
    };

    // For social media posts, use the specialized agents
    if (templateId === 'social') {
      return await generateSocialMediaPost(audienceWithGoal, advertisingGoal, hookIndex, socialMediaPlatform);
    }

    // For other templates, call the hook-angle-generator and script-generator
    // Generate hooks and angles with first agent
    console.log("Calling hook-angle-generator function");
    const { data: hooksData, error: hooksError } = await supabase.functions.invoke('ai-agents/hook-angle-generator', {
      body: {
        targetAudience: audienceWithGoal,
        templateType: templateId,
      }
    });

    if (hooksError) {
      console.error('Error calling hook-angle-generator:', hooksError);
      throw new Error(`Failed to generate hooks: ${hooksError.message}`);
    }

    if (!hooksData || !Array.isArray(hooksData.hooks) || hooksData.hooks.length === 0) {
      console.error('Invalid response from hook-angle-generator:', hooksData);
      throw new Error('Failed to generate hooks: Invalid response format');
    }

    // Calculate the actual hook index to use
    const actualHookIndex = Math.min(hookIndex, hooksData.hooks.length - 1);
    const selectedHook = hooksData.hooks[actualHookIndex];
    console.log(`Selected hook at index ${actualHookIndex}: ${selectedHook}`);

    // Generate the main script with second agent
    console.log("Calling script-generator function");
    const { data: scriptData, error: scriptError } = await supabase.functions.invoke('ai-agents/script-generator', {
      body: {
        targetAudience: audienceWithGoal,
        templateType: templateId,
        selectedHook,
      }
    });

    if (scriptError) {
      console.error('Error calling script-generator:', scriptError);
      throw new Error(`Failed to generate script: ${scriptError.message}`);
    }

    if (!scriptData || !scriptData.script) {
      console.error('Invalid response from script-generator:', scriptData);
      throw new Error('Failed to generate script: Invalid response format');
    }

    // Return the complete result
    return {
      script: scriptData.script,
      bestHook: selectedHook,
      allHooks: hooksData.hooks,
      currentHookIndex: actualHookIndex,
      totalHooks: hooksData.hooks.length
    };
  } catch (error) {
    console.error('Error in generateScript:', error);
    throw error;
  }
}

// Function to generate social media posts with improved error handling
async function generateSocialMediaPost(
  targetAudience: any, 
  advertisingGoal: string, 
  hookIndex: number = 0, 
  platform: SocialMediaPlatform = 'meta'
) {
  try {
    console.log(`Generating social media post for platform: ${platform}`);
    
    // First use PosthookAgent to generate hooks and theme
    console.log("Calling posthook-agent edge function");
    
    // Add retry mechanism for posthook-agent call
    let posthookResponse;
    let posthookRetryCount = 0;
    const maxRetries = 3;
    
    while (posthookRetryCount < maxRetries) {
      try {
        console.log(`Posthook attempt ${posthookRetryCount + 1}/${maxRetries}`);
        
        posthookResponse = await supabase.functions.invoke('ai-agents/posthook-agent', {
          body: {
            targetAudience,
            advertisingGoal,
            platform
          }
        });
        
        console.log(`Posthook attempt ${posthookRetryCount + 1} response:`, 
          posthookResponse.error ? `Error: ${posthookResponse.error.message}` : "Success");
        
        if (!posthookResponse.error) break;
        
        console.warn(`Retry ${posthookRetryCount + 1}/${maxRetries} for posthook-agent:`, posthookResponse.error);
        posthookRetryCount++;
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (e) {
        console.error(`Posthook attempt ${posthookRetryCount + 1}/${maxRetries} failed:`, e);
        posthookRetryCount++;
        
        if (posthookRetryCount >= maxRetries) throw e;
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    if (!posthookResponse || posthookResponse.error) {
      console.error('All attempts to call posthook-agent failed:', posthookResponse?.error);
      throw new Error(`Failed to generate social media hooks after ${maxRetries} attempts: ${posthookResponse?.error?.message || 'Unknown error'}`);
    }

    const posthookData = posthookResponse.data;
    console.log('PosthookAgent full response:', posthookData);

    if (!posthookData) {
      console.error('Empty response from posthook-agent');
      throw new Error('Failed to generate social media hooks: Empty response');
    }
    
    // Create fallback hooks if missing or invalid
    let hooks = ["Nie udało się wygenerować automatycznego hooka"];
    let theme = "Ogólna tematyka";
    let form = "post tekstowy";
    
    if (posthookData.hooks && Array.isArray(posthookData.hooks) && posthookData.hooks.length > 0) {
      hooks = posthookData.hooks;
    } else {
      console.error('Invalid hooks in response from posthook-agent:', posthookData);
    }
    
    theme = posthookData.theme || theme;
    form = posthookData.form || form;
    
    console.log('Using hooks:', hooks);

    // Calculate the actual hook index to use
    const actualHookIndex = Math.min(hookIndex, hooks.length - 1);
    const selectedHook = hooks[actualHookIndex];
    console.log(`Selected hook at index ${actualHookIndex}: ${selectedHook}`);

    // Then use PostscriptAgent to generate the full content
    console.log("Calling postscript-agent edge function");
    
    // Add retry mechanism for postscript-agent call
    let postscriptResponse;
    let postscriptRetryCount = 0;
    
    while (postscriptRetryCount < maxRetries) {
      try {
        console.log(`Postscript attempt ${postscriptRetryCount + 1}/${maxRetries}`);
        
        postscriptResponse = await supabase.functions.invoke('ai-agents/postscript-agent', {
          body: {
            targetAudience,
            advertisingGoal,
            platform,
            posthookOutput: {
              hooks,
              theme,
              form
            }
          }
        });
        
        console.log(`Postscript attempt ${postscriptRetryCount + 1} response:`, 
          postscriptResponse.error ? `Error: ${postscriptResponse.error.message}` : "Success");
        
        if (!postscriptResponse.error) break;
        
        console.warn(`Retry ${postscriptRetryCount + 1}/${maxRetries} for postscript-agent:`, postscriptResponse.error);
        postscriptRetryCount++;
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (e) {
        console.error(`Postscript attempt ${postscriptRetryCount + 1}/${maxRetries} failed:`, e);
        postscriptRetryCount++;
        
        if (postscriptRetryCount >= maxRetries) throw e;
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    if (!postscriptResponse || postscriptResponse.error) {
      console.error('All attempts to call postscript-agent failed:', postscriptResponse?.error);
      // Fallback to just using the hook as content if postscript-agent fails
      return {
        script: selectedHook + "\n\nTreść postu nie została wygenerowana z powodu błędu.",
        bestHook: selectedHook,
        allHooks: hooks,
        currentHookIndex: actualHookIndex,
        totalHooks: hooks.length,
        cta: "Skontaktuj się z nami, aby dowiedzieć się więcej.",
        theme: theme,
        form: form
      };
    }

    const postscriptData = postscriptResponse.data;
    console.log('PostscriptAgent full response:', postscriptData);

    // Create fallback content if missing or invalid response
    let content = selectedHook + "\n\nTreść postu nie została wygenerowana.";
    let cta = "Skontaktuj się z nami, aby dowiedzieć się więcej.";
    
    if (postscriptData && postscriptData.content) {
      content = postscriptData.content;
    } else {
      console.error('Missing content in response from postscript-agent:', postscriptData);
    }
    
    if (postscriptData && postscriptData.cta) {
      cta = postscriptData.cta;
    }

    return {
      script: content,
      bestHook: selectedHook,
      allHooks: hooks,
      currentHookIndex: actualHookIndex,
      totalHooks: hooks.length,
      cta: cta,
      theme: theme,
      form: form
    };
  } catch (error) {
    console.error('Error in generateSocialMediaPost:', error);
    throw error;
  }
}

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
