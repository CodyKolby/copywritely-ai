
import { supabase } from '@/integrations/supabase/client';
import type { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';
import { SavedProject } from './types';

export const saveProjectWithContent = async (
  content: string,
  title: string,
  type: string,
  userId: string,
  platform?: SocialMediaPlatform
): Promise<SavedProject | null> => {
  try {
    if (!content || !title || !userId) {
      console.error('Missing required data for saving project', { content: !!content, title, userId });
      throw new Error('Missing required data for saving project');
    }
    
    // Determine the correct project type based on the template type
    let projectType = 'script';
    let projectSubtype = 'ad';
    
    if (type === 'email') {
      projectType = 'email';
      projectSubtype = 'email';
    } else if (type === 'social') {
      projectType = 'social';
      projectSubtype = 'social';
    } else {
      // Default to ad script
      projectType = 'script';
      projectSubtype = 'ad';
    }
    
    console.log('Saving project with data:', { 
      title, 
      contentLength: content.length, 
      userId,
      type: projectType, 
      subtype: projectSubtype, 
      platform: platform?.key
    });
    
    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          title,
          content,
          user_id: userId,
          type: projectType,
          subtype: projectSubtype,
          platform: platform?.key || null
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving project:', error);
      throw new Error(`Failed to save project: ${error.message}`);
    }

    console.log('Project saved successfully:', data);
    return data as SavedProject;
  } catch (err) {
    console.error('Exception saving project:', err);
    throw err;
  }
};
