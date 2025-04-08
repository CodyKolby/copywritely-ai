
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from 'uuid';
import { SocialMediaPlatform } from '../SocialMediaPlatformDialog';

// Helper function to fetch target audience details
export async function fetchTargetAudience(audienceId: string) {
  try {
    const { data, error } = await supabase
      .from('target_audiences')
      .select('*')
      .eq('id', audienceId)
      .single();

    if (error) throw error;
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
    console.log(`Generating script for template: ${templateId}, audience: ${audienceId}, goal: ${advertisingGoal}`);

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
    const { data: hooksData } = await supabase.functions.invoke('ai-agents/hook-angle-generator', {
      body: {
        targetAudience: audienceWithGoal,
        templateType: templateId,
      }
    });

    if (!hooksData || !Array.isArray(hooksData.hooks) || hooksData.hooks.length === 0) {
      throw new Error('Failed to generate hooks');
    }

    // Calculate the actual hook index to use
    const actualHookIndex = Math.min(hookIndex, hooksData.hooks.length - 1);
    const selectedHook = hooksData.hooks[actualHookIndex];

    // Generate the main script with second agent
    const { data: scriptData } = await supabase.functions.invoke('ai-agents/script-generator', {
      body: {
        targetAudience: audienceWithGoal,
        templateType: templateId,
        selectedHook,
      }
    });

    if (!scriptData || !scriptData.script) {
      throw new Error('Failed to generate script');
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

// Function to generate social media posts
async function generateSocialMediaPost(
  targetAudience: any, 
  advertisingGoal: string, 
  hookIndex: number = 0, 
  platform: SocialMediaPlatform = 'meta'
) {
  try {
    console.log(`Generating social media post for platform: ${platform}`);
    
    // First use PosthookAgent to generate hooks and theme
    const { data: posthookData, error: posthookError } = await supabase.functions.invoke('ai-agents/posthook-agent', {
      body: {
        targetAudience,
        advertisingGoal,
        platform
      }
    });

    if (posthookError) {
      console.error('Error calling posthook-agent:', posthookError);
      throw new Error(`Failed to generate social media hooks: ${posthookError.message}`);
    }

    if (!posthookData || !posthookData.hooks || posthookData.hooks.length === 0) {
      console.error('Invalid response from posthook-agent:', posthookData);
      throw new Error('Failed to generate social media hooks: Invalid response format');
    }

    console.log('PosthookAgent response:', posthookData);

    // Calculate the actual hook index to use
    const actualHookIndex = Math.min(hookIndex, posthookData.hooks.length - 1);
    const selectedHook = posthookData.hooks[actualHookIndex];

    // Then use PostscriptAgent to generate the full content
    const { data: postscriptData, error: postscriptError } = await supabase.functions.invoke('ai-agents/postscript-agent', {
      body: {
        targetAudience,
        advertisingGoal,
        platform,
        posthookOutput: posthookData
      }
    });

    if (postscriptError) {
      console.error('Error calling postscript-agent:', postscriptError);
      throw new Error(`Failed to generate social media content: ${postscriptError.message}`);
    }

    if (!postscriptData || !postscriptData.content) {
      console.error('Invalid response from postscript-agent:', postscriptData);
      throw new Error('Failed to generate social media content: Invalid response format');
    }

    console.log('PostscriptAgent response:', postscriptData);

    return {
      script: postscriptData.content,
      bestHook: selectedHook,
      allHooks: posthookData.hooks,
      currentHookIndex: actualHookIndex,
      totalHooks: posthookData.hooks.length,
      cta: postscriptData.cta,
      theme: posthookData.theme,
      form: posthookData.form
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
