
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { SocialHookResponse } from './social-hook-service';

export interface SavedSocialProject {
  id: string;
  title: string;
  content: string;
  hook: string;
  platform: string;
  theme?: string;
  form?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export async function saveSocialToProject(
  content: string,
  hook: string,
  platform: string,
  userId: string,
  targetAudienceId: string,
  hookResponse?: SocialHookResponse,
  alternativeHooks?: string[]
): Promise<SavedSocialProject> {
  const projectId = uuidv4();
  
  const projectData = {
    id: projectId,
    title: `${platform} Post: ${hook.substring(0, 50)}`,
    content: content,
    hook: hook,
    platform: platform,
    user_id: userId,
    type: 'social_post',
    status: 'Draft' as 'Draft' | 'Completed' | 'Reviewed',
    target_audience_id: targetAudienceId,
    metadata: {
      theme: hookResponse?.theme,
      form: hookResponse?.form,
      cta: hookResponse?.cta,
      alternativeHooks: alternativeHooks || []
    }
  };
  
  // Save to database
  const { data, error } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: projectId,
    title: projectData.title,
    content: content,
    hook: hook,
    platform: platform,
    theme: hookResponse?.theme,
    form: hookResponse?.form,
    user_id: userId
  };
}
