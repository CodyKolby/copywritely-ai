
import { supabase } from '@/integrations/supabase/client';
import { NarrativeBlueprint } from './narrative-blueprint-service';
import { toast } from 'sonner';

export async function saveEmailToProject(
  projectId: string, 
  generatedSubject: string,
  generatedEmail: string,
  userId: string,
  targetAudienceId: string,
  narrativeBlueprint?: NarrativeBlueprint,
  alternativeSubject?: string
): Promise<string> {
  console.log('EMAIL PROJECT SERVICE: Starting saveEmailToProject with params:', { 
    projectId, 
    subjectLength: generatedSubject?.length, 
    emailLength: generatedEmail?.length, 
    userId, 
    targetAudienceId,
    hasNarrativeBlueprint: !!narrativeBlueprint,
    hasAlternativeSubject: !!alternativeSubject
  });
  
  if (!projectId || !generatedSubject || !generatedEmail || !userId || !targetAudienceId) {
    const error = 'Missing required data for saving email';
    console.error('EMAIL PROJECT SERVICE: ' + error, {
      projectId: !!projectId,
      generatedSubject: !!generatedSubject, 
      generatedEmail: !!generatedEmail,
      userId: !!userId,
      targetAudienceId: !!targetAudienceId
    });
    toast.error('Nie udało się zapisać maila: brakujące dane');
    throw new Error(error);
  }

  try {
    console.log('EMAIL PROJECT SERVICE: Preparing project data for insert');

    // Ensure we have a valid alternative subject that's different from the primary subject
    const validAlternativeSubject = alternativeSubject && 
      alternativeSubject !== generatedSubject && 
      !alternativeSubject.startsWith('Alternative:') 
        ? alternativeSubject 
        : `Alternatywny tytuł dla: ${generatedSubject}`;

    const projectData: any = {
      id: projectId,
      title: `Email: ${generatedSubject.substring(0, 50)}`,
      content: generatedEmail,
      subject: generatedSubject,
      user_id: userId,
      type: 'email',
      subtype: 'email',
      status: 'Draft' as 'Draft' | 'Completed' | 'Reviewed',
      target_audience_id: targetAudienceId
    };
    
    // Always include metadata object with alternativeSubject
    projectData.metadata = {
      alternativeSubject: validAlternativeSubject
    };
    
    // If we have a narrative blueprint, include it in the metadata
    if (narrativeBlueprint) {
      projectData.metadata = {
        ...projectData.metadata,
        narrativeBlueprint: {
          punktyEmocjonalne: narrativeBlueprint.punktyemocjonalne,
          specyfikaMaila: narrativeBlueprint.specyfikamaila,
          osNarracyjna: narrativeBlueprint.osnarracyjna
        }
      };
    }
    
    console.log('EMAIL PROJECT SERVICE: Inserting project into database:', {
      projectId,
      title: projectData.title,
      type: projectData.type,
      userId: projectData.user_id,
      alternativeSubject: projectData.metadata.alternativeSubject
    });
    
    // Additional logging for data integrity check
    console.log('EMAIL PROJECT SERVICE: Checking data integrity before save', {
      hasId: !!projectData.id,
      titleLength: projectData.title.length,
      contentLength: projectData.content.length,
      hasUserId: !!projectData.user_id,
      hasTargetAudienceId: !!projectData.target_audience_id,
      hasMetadata: !!projectData.metadata
    });
    
    // Save to database
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData);
    
    if (error) {
      console.error('EMAIL PROJECT SERVICE: Error saving email project:', error);
      toast.error(`Nie udało się zapisać maila: ${error.message}`);
      throw error;
    }
    
    console.log('EMAIL PROJECT SERVICE: Email project saved successfully');
    toast.success('Email został zapisany w Twoich projektach');
    return projectId;
  } catch (error: any) {
    console.error('EMAIL PROJECT SERVICE: Exception during save:', error);
    toast.error(`Nie udało się zapisać maila: ${error.message || 'nieznany błąd'}`);
    throw error;
  }
}
