
import { supabase } from '@/lib/supabase';
import type { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';
import type { SavedProject } from './types';

export const saveProjectWithContent = async (
  content: string,
  title: string,
  template_type: string,
  userId: string,
  socialMediaPlatform?: SocialMediaPlatform
): Promise<SavedProject | null> => {
  try {
    console.log('Saving project content with utils:', { 
      contentLength: content.length, 
      title, 
      template_type, 
      userId,
      platform: socialMediaPlatform?.key
    });

    // Create project object with metadata about platform
    let fullContent = content;
    
    // If it's a social media post, add metadata
    if (template_type === 'social' && socialMediaPlatform) {
      fullContent = `${content}\n\n---\nPlatforma: ${socialMediaPlatform.label}`;
    }

    // Create a new project in the database
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        title: title.length > 0 ? title.substring(0, 255) : 'Nowy projekt',
        content: fullContent,
        user_id: userId,
        title_auto_generated: true,
        status: 'Draft'
      })
      .select('id, title, content, created_at')
      .single();

    if (error) {
      console.error('Error creating project in project-utils:', error);
      throw new Error(`Failed to save project: ${error.message}`);
    }

    console.log('Project saved successfully in project-utils:', project);

    return {
      id: project.id,
      title: project.title,
      content: project.content,
      created_at: project.created_at
    };
  } catch (error: any) {
    console.error('Error in saveProjectWithContent:', error);
    throw error;
  }
};
