
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';
import { SavedProject } from './types';

export const saveProjectWithContent = async (
  content: string,
  title: string,
  type: string,
  userId: string,
  platform?: SocialMediaPlatform
): Promise<SavedProject | null> => {
  console.log('PROJECT UTILS: Starting saveProjectWithContent with params:', { 
    contentLength: content?.length, 
    title, 
    type, 
    userId,
    platform: platform?.key 
  });
  
  try {
    if (!content || !title || !userId) {
      const error = 'Missing required data for saving project';
      console.error('PROJECT UTILS: ' + error, { 
        content: !!content, 
        contentLength: content?.length,
        title: !!title, 
        userId: !!userId 
      });
      toast.error('Nie udało się zapisać projektu: brakujące dane');
      throw new Error(error);
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
    
    console.log('PROJECT UTILS: Inserting project into database:', { 
      title, 
      contentLength: content.length, 
      userId,
      type: projectType, 
      subtype: projectSubtype, 
      platform: platform?.key
    });
    
    // Additional logging before database operation
    console.log('PROJECT UTILS: Final project data before save:', {
      titleTruncated: title.substring(0, 50),
      contentFirstChars: content.substring(0, 100) + '...',
      type: projectType,
      subtype: projectSubtype
    });
    
    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          title: title.substring(0, 255), // Ensure title is not too long
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
      console.error('PROJECT UTILS: Error saving project:', error);
      toast.error(`Nie udało się zapisać projektu: ${error.message}`);
      throw new Error(`Failed to save project: ${error.message}`);
    }

    console.log('PROJECT UTILS: Project saved successfully:', data);
    toast.success('Projekt został zapisany');
    
    return data as SavedProject;
  } catch (err: any) {
    console.error('PROJECT UTILS: Exception during save:', err);
    toast.error(`Nie udało się zapisać projektu: ${err.message || 'nieznany błąd'}`);
    throw err;
  }
};
