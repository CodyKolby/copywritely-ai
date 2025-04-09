
import { supabase } from '@/lib/supabase';
import { generateScript as generateScriptUtil } from './utils/script-generator';
import { saveProjectWithContent } from './utils/project-utils';
import type { ScriptGenerationResult, PosthookResponse, PostscriptResponse, SavedProject } from './utils/types';
import type { SocialMediaPlatform } from '../SocialMediaPlatformDialog';

// Re-export the types correctly using 'export type'
export type { ScriptGenerationResult, PosthookResponse, PostscriptResponse, SavedProject };

// Re-export the functions with clean names
export const generateScript = generateScriptUtil;

export const saveScriptAsProject = async (
  content: string,
  title: string,
  template_type: string,
  userId: string,
  socialMediaPlatform?: SocialMediaPlatform
): Promise<SavedProject | null> => {
  try {
    console.log('Saving script as project:', { 
      contentLength: content.length, 
      title, 
      template_type, 
      userId,
      platform: socialMediaPlatform?.key
    });

    // Create a new project in the database
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        title: title.substring(0, 255), // Ensure title is not too long
        content: content,
        user_id: userId,
        title_auto_generated: true,
        status: 'Draft'
      })
      .select('id, title, content, created_at')
      .single();

    if (error) {
      console.error('Error saving project to database:', error);
      throw new Error(`Failed to save project: ${error.message}`);
    }

    console.log('Successfully saved project:', project);

    return {
      id: project.id,
      title: project.title,
      content: project.content,
      created_at: project.created_at
    };
  } catch (error: any) {
    console.error('Error saving script as project:', error);
    throw error;
  }
};
