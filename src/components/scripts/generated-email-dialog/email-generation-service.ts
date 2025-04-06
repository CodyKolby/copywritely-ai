
import { supabase } from '@/integrations/supabase/client';
import { EmailStyle } from '../EmailStyleDialog';

export interface NarrativeBlueprint {
  punktyemocjonalne: string;
  stylmaila: string;
  osnarracyjna: string;
  // Add debug fields
  subject1Debug?: string;
  subject2Debug?: string;
  debugFlag?: string;
}

// Default prompt template that can be customized
const DEFAULT_SUBJECT_LINE_PROMPT = `Twoim zadaniem jest utworzenie dwóch tytułów (subject lines), które oba mają brzmieć dokładnie tak "TEST1" oraz "TEST2"

subject1: [Pierwszy tytuł emaila]
subject2: [Drugi tytuł emaila]`;

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
  const timestamp = new Date().toISOString();
  console.log('Generating subject lines with request timestamp:', timestamp);
  try {
    // Create a formatted version of the survey data for the prompt
    const formattedSurveyData = JSON.stringify(targetAudienceData, null, 2);
    
    // Replace template variables with actual values
    let finalPrompt = DEFAULT_SUBJECT_LINE_PROMPT
      .replace('{{punktyemocjonalne}}', blueprint.punktyemocjonalne)
      .replace('{{stylmaila}}', blueprint.stylmaila)
      .replace('{{osnarracyjna}}', blueprint.osnarracyjna)
      .replace('{{surveyData}}', formattedSurveyData);
    
    // Add unique request identifiers to prevent caching
    const requestBody = {
      prompt: finalPrompt,
      debugMode: false, // Set to true to get debug responses without calling OpenAI
      _timestamp: Date.now(),
      _nonce: Math.random().toString(36).substring(2, 15)
    };
    
    console.log('Subject lines request payload size:', JSON.stringify(requestBody).length);
    console.log('Final prompt for subject lines (first 200 chars):', finalPrompt.substring(0, 200) + '...');
    
    // Using supabase.functions.invoke with explicit cache-busting headers
    const { data, error } = await supabase.functions.invoke('generate-subject-lines', {
      body: requestBody,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-No-Cache': Date.now().toString()
      }
    });
    
    if (error) {
      console.error('Error invoking generate-subject-lines:', error);
      throw new Error(`Error invoking generate-subject-lines: ${error.message}`);
    }
    
    console.log('Raw subject line data received:', data);
    
    // Ensure we have both subject lines from the edge function
    if (!data.subject1 || !data.subject2) {
      console.error('Missing subject lines in response:', data);
      throw new Error('Incomplete subject lines returned from API');
    }
    
    console.log('Subject lines generated successfully:');
    console.log('Subject 1:', data.subject1);
    console.log('Subject 2:', data.subject2);
    console.log('Response timestamp:', data.timestamp || 'not provided');
    console.log('Request ID:', data.requestId || 'not provided');
    
    // Return the subject lines exactly as received from the API
    return {
      subject1: data.subject1,
      subject2: data.subject2,
      timestamp: data.timestamp,
      requestId: data.requestId,
      rawOutput: data.rawOutput,
      rawPrompt: data.rawPrompt,
      debugInfo: {
        requestBody: JSON.stringify(requestBody).substring(0, 500) + '...',
        sentPrompt: finalPrompt
      }
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
