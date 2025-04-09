
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
    return await saveProjectWithContent(content, title, template_type, userId, socialMediaPlatform);
  } catch (error) {
    console.error('Error saving script as project:', error);
    throw error;
  }
};
