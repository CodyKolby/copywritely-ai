
import { supabase } from '@/integrations/supabase/client';
import { EmailStyle } from '../EmailStyleDialog';

export interface NarrativeBlueprint {
  punktyemocjonalne: string;
  stylmaila: string;
  osnarracyjna: string;
}

export async function generateNarrativeBlueprint(targetAudienceData: any, emailStyle: EmailStyle, advertisingGoal: string): Promise<NarrativeBlueprint> {
  console.log('Generating narrative blueprint...');
  try {
    const { data, error } = await supabase.functions.invoke('narrative-blueprint', {
      body: {
        surveyData: targetAudienceData,
        emailStyle,
        advertisingGoal
      }
    });
    
    if (error) throw new Error(`Error invoking narrative-blueprint: ${error.message}`);
    
    console.log('Narrative blueprint generated successfully:', data);
    return data as NarrativeBlueprint;
  } catch (err: any) {
    console.error('Failed to generate narrative blueprint:', err);
    throw new Error('Nie udało się wygenerować blueprint narracyjnego');
  }
}

export async function generateSubjectLines(blueprint: NarrativeBlueprint, targetAudienceData: any) {
  console.log('Generating subject lines...');
  try {
    const { data, error } = await supabase.functions.invoke('generate-subject-lines', {
      body: {
        narrativeBlueprint: blueprint,
        surveyData: targetAudienceData
      }
    });
    
    if (error) throw new Error(`Error invoking generate-subject-lines: ${error.message}`);
    
    console.log('Subject lines generated successfully:');
    console.log('Subject 1:', data.subject1);
    console.log('Subject 2:', data.subject2);
    
    return {
      subject1: data.subject1,
      subject2: data.subject2
    };
  } catch (err: any) {
    console.error('Failed to generate subject lines:', err);
    throw new Error('Nie udało się wygenerować tytułów maila');
  }
}

export async function saveEmailToProject(
  projectId: string, 
  generatedSubject: string,
  generatedEmail: string,
  userId: string,
  targetAudienceId: string,
  narrativeBlueprint?: NarrativeBlueprint,
  alternativeSubject?: string
) {
  const projectData = {
    id: projectId,
    title: `Email: ${generatedSubject.substring(0, 50)}`,
    content: generatedEmail,
    subject: generatedSubject,
    user_id: userId,
    type: 'email',
    status: 'Draft' as 'Draft' | 'Completed' | 'Reviewed', // Explicitly cast as enum type
    target_audience_id: targetAudienceId
  };
  
  // If we have a narrative blueprint, include it in the metadata
  if (narrativeBlueprint) {
    Object.assign(projectData, {
      metadata: {
        narrativeBlueprint: {
          punktyEmocjonalne: narrativeBlueprint.punktyemocjonalne,
          stylMaila: narrativeBlueprint.stylmaila,
          osNarracyjna: narrativeBlueprint.osnarracyjna
        },
        alternativeSubject: alternativeSubject
      }
    });
  }
  
  // Save to database
  const { error } = await supabase
    .from('projects')
    .insert(projectData);
  
  if (error) throw error;
  
  return projectId;
}
