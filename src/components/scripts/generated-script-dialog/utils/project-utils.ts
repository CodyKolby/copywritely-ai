
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
    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          title,
          content,
          user_id: userId,
          type,
          platform: platform?.key || null
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving project:', error);
      throw new Error(`Failed to save project: ${error.message}`);
    }

    return data as SavedProject;
  } catch (err) {
    console.error('Exception saving project:', err);
    throw err;
  }
};
