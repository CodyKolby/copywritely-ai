
import { supabase } from '@/integrations/supabase/client';
import { NarrativeBlueprint } from './narrative-blueprint-service';

export async function saveEmailToProject(
  projectId: string, 
  generatedSubject: string,
  generatedEmail: string,
  userId: string,
  targetAudienceId: string,
  narrativeBlueprint?: NarrativeBlueprint,
  alternativeSubject?: string
) {
  if (!projectId || !generatedSubject || !generatedEmail || !userId || !targetAudienceId) {
    console.error('Missing required data for saving email', {
      projectId: !!projectId,
      generatedSubject: !!generatedSubject, 
      generatedEmail: !!generatedEmail,
      userId: !!userId,
      targetAudienceId: !!targetAudienceId
    });
    throw new Error('Missing required data for saving email');
  }

  console.log('Saving email to project:', {
    projectId,
    subjectLength: generatedSubject.length,
    emailLength: generatedEmail.length,
    userId,
    targetAudienceId
  });

  const projectData = {
    id: projectId,
    title: `Email: ${generatedSubject.substring(0, 50)}`,
    content: generatedEmail,
    subject: generatedSubject,
    user_id: userId,
    type: 'email',
    subtype: 'email',
    status: 'Draft' as 'Draft' | 'Completed' | 'Reviewed', // Explicitly cast as enum type
    target_audience_id: targetAudienceId
  };
  
  // If we have a narrative blueprint, include it in the metadata
  if (narrativeBlueprint) {
    Object.assign(projectData, {
      metadata: {
        narrativeBlueprint: {
          punktyEmocjonalne: narrativeBlueprint.punktyemocjonalne,
          specyfikaMaila: narrativeBlueprint.specyfikamaila,
          osNarracyjna: narrativeBlueprint.osnarracyjna
        },
        alternativeSubject: alternativeSubject
      }
    });
  }
  
  // Save to database
  const { data, error } = await supabase
    .from('projects')
    .insert(projectData);
  
  if (error) {
    console.error('Error saving email project:', error);
    throw error;
  }
  
  console.log('Email project saved successfully');
  return projectId;
}
