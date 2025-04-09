
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/lib/supabase";
import { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';

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
export function getSocialMediaPlatformName(platform?: SocialMediaPlatform): string {
  switch (platform?.key) {
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
