
import { supabase } from '@/integrations/supabase/client';
import { SocialHookResponse } from './social-hook-service';

export interface SaveSocialProjectResult {
  id: string;
  success: boolean;
}

export async function saveSocialToProject(
  content: string,
  finalIntro: string,
  platform: string,
  userId: string,
  targetAudienceId: string,
  hookResponse?: SocialHookResponse
): Promise<SaveSocialProjectResult> {
  try {
    console.log('Saving social post to projects with:', {
      contentLength: content.length,
      finalIntroLength: finalIntro?.length || 0,
      platform,
      userId,
      targetAudienceId
    });
    
    // Create a title from the first 50 characters of content
    const titleText = content.substring(0, 50).trim();
    const title = titleText + (titleText.length >= 50 ? '...' : '');
    
    // Store metadata about the post generation
    const metadata = {
      platform,
      finalIntro,
      targetAudienceId,
      generatedAt: new Date().toISOString(),
      promptSource: hookResponse?.promptSource || 'unknown',
      promptVersion: hookResponse?.version || 'unknown',
      deploymentId: hookResponse?.deploymentId || 'unknown'
    };
    
    // Save to projects table
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        title: title,
        content: content,
        template_id: 'social',
        metadata: metadata,
        target_audience_id: targetAudienceId
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error saving social post to projects:', error);
      throw new Error(`Błąd zapisu do bazy danych: ${error.message}`);
    }
    
    console.log('Social post saved successfully with ID:', data.id);
    
    return {
      id: data.id,
      success: true
    };
  } catch (err: any) {
    console.error('Failed to save social post:', err);
    throw new Error(`Nie udało się zapisać posta: ${err.message}`);
  }
}
