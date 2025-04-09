
import { supabase } from '@/lib/supabase';
import type { SavedProject } from './types';
import type { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';

/**
 * Save a script as a new project
 */
export const saveProjectWithContent = async (
  content: string,
  title: string,
  template_type: string,
  userId: string,
  socialMediaPlatform?: SocialMediaPlatform
): Promise<SavedProject | null> => {
  try {
    console.log('Saving project with content:', {
      contentLength: content.length,
      titleLength: title.length,
      template_type,
      userId,
      platform: socialMediaPlatform?.label || 'N/A'
    });

    if (!content || !title || !userId) {
      console.error('Missing required data for project creation');
      throw new Error('Missing required data');
    }

    // Set project metadata
    const projectData = {
      user_id: userId,
      title,
      content,
      template_type,
      // Save social media platform if specified
      platform: socialMediaPlatform?.key || null,
      metadata: {
        source: 'script-generator',
        platformInfo: socialMediaPlatform ? {
          key: socialMediaPlatform.key,
          label: socialMediaPlatform.label,
          description: socialMediaPlatform.description
        } : null
      }
    };

    // Insert project into database
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select('id, title, content, created_at')
      .single();

    if (error) {
      console.error('Error saving project:', error);
      throw new Error(`Błąd podczas zapisywania projektu: ${error.message}`);
    }

    console.log('Project saved successfully:', data);
    return data as SavedProject;
  } catch (error) {
    console.error('Error in saveProjectWithContent:', error);
    throw error;
  }
};

/**
 * Get a project by ID
 */
export const getProjectById = async (projectId: string): Promise<SavedProject | null> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, content, created_at')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      return null;
    }

    return data as SavedProject;
  } catch (error) {
    console.error('Error in getProjectById:', error);
    return null;
  }
};
