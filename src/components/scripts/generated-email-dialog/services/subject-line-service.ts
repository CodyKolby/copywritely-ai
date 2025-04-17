
import { getSupabaseAnonKey, getSupabaseURL } from '@/utils/helpers';
import { templateReplacer } from '@/utils/template-replacer';

/**
 * Response type for subject line generation
 */
export interface SubjectLinesResponse {
  subject1: string;
  subject2: string;
  debugInfo?: any;
}

/**
 * Default prompt for subject line generation
 */
export const DEFAULT_SUBJECT_LINE_PROMPT = `
You are an expert email subject line writer. You will be given data from a survey, and narrative data about the survey results.
You will also be given an email style to adhere to.

You must return 3 different email subject lines that are highly engaging and click-worthy.

Here is the survey data:
{{surveyData}}

Here is the narrative data:
{{narrativeData}}

Here is the email style:
{{emailStyle}}
`;

const BASE_PROMPT = DEFAULT_SUBJECT_LINE_PROMPT;

/**
 * Generates subject lines based on provided data
 */
export const generateSubjectLines = async (
  surveyData: any, 
  narrativeData: any, 
  emailStyle: string
): Promise<SubjectLinesResponse> => {
  if (!surveyData || !narrativeData) {
    throw new Error('Survey data and narrative data are required.');
  }

  if (typeof surveyData !== 'object' || Array.isArray(surveyData)) {
    throw new Error('Survey data must be an object.');
  }

  if (typeof narrativeData !== 'string') {
    throw new Error('Narrative data must be a string.');
  }
  
  // First attempt
  const completePrompt1 = templateReplacer(BASE_PROMPT, {
    surveyData: JSON.stringify(surveyData),
    narrativeData: JSON.stringify(narrativeData),
    emailStyle
  });
  
  try {
    const response = await fetch(
      `${getSupabaseURL()}/functions/generate-subject-lines`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getSupabaseAnonKey()}`
        },
        body: JSON.stringify({
          prompt: completePrompt1,
          surveyData,
          narrativeData,
          emailStyle
        })
      }
    );

    if (!response.ok) {
      console.error('Error generating subject lines:', response.status, response.statusText);
      try {
        const errorBody = await response.json();
        console.error('Error details:', errorBody);
      } catch (jsonError) {
        console.error('Failed to parse error response as JSON.');
      }
      throw new Error(`Failed to generate subject lines. HTTP status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the array response into the expected object structure
    if (Array.isArray(data) && data.length >= 2) {
      return {
        subject1: data[0],
        subject2: data[1],
        debugInfo: { rawResponse: data }
      };
    }
    
    console.error('Unexpected response format:', data);
    return {
      subject1: "Default Subject Line",
      subject2: "Alternative Subject Line",
      debugInfo: { error: "Invalid response format", rawResponse: data }
    };
    
  } catch (error) {
    console.error('Error generating subject lines:', error);
    throw error;
  }
};

export const getSubjectLine = async (
  surveyData: any, 
  narrativeData: any, 
  emailStyle: string
): Promise<string[]> => {
  try {
    const subjectLines = await generateSubjectLines(surveyData, narrativeData, emailStyle);
    // Return as array for backward compatibility
    return [subjectLines.subject1, subjectLines.subject2];
  } catch (error: any) {
    console.error('Error in getSubjectLine:', error);
    throw new Error(`Failed to get subject lines: ${error.message}`);
  }
};
