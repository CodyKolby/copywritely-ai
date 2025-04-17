
import { supabase } from '@/integrations/supabase/client';
import { EmailStyle } from '../../EmailStyleDialog';
import { toast } from 'sonner';

export interface NarrativeBlueprint {
  punktyemocjonalne: string;
  specyfikamaila: string;
  osnarracyjna: string;
  // Debug fields
  subject1Debug?: string;
  subject2Debug?: string;
  debugFlag?: string;
}

export async function generateNarrativeBlueprint(
  targetAudienceData: any, 
  emailStyle: EmailStyle, 
  advertisingGoal: string
): Promise<NarrativeBlueprint> {
  // Generate a unique request ID and timestamp for tracking
  const requestId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
  const timestamp = new Date().toISOString();
  
  console.log('🔵 NARRATIVE BLUEPRINT SERVICE: Starting blueprint generation', {
    requestId,
    timestamp,
    targetAudienceId: targetAudienceData?.id || 'N/A',
    emailStyle,
    advertisingGoal
  });
  
  try {
    // First, check if we can reach the edge function with a simple test
    console.log(`🔵 NARRATIVE BLUEPRINT SERVICE: Testing connection to narrative-blueprint edge function [${requestId}]`);
    
    try {
      const testResponse = await supabase.functions.invoke('narrative-blueprint', {
        body: { test: "connection" }
      });
      console.log(`🔵 NARRATIVE BLUEPRINT SERVICE: Connection test response [${requestId}]:`, testResponse);
    } catch (testErr) {
      console.warn(`🟠 NARRATIVE BLUEPRINT SERVICE: Connection test failed [${requestId}]:`, testErr);
      // Continue anyway, the actual request might work
    }
    
    console.log(`🔵 NARRATIVE BLUEPRINT SERVICE: Invoking narrative-blueprint edge function [${requestId}]`);
    
    // Convert the target audience data to a more readable format for debugging
    const audienceDataLog = { ...targetAudienceData };
    if (audienceDataLog.biography && audienceDataLog.biography.length > 100) {
      audienceDataLog.biography = audienceDataLog.biography.substring(0, 100) + '...';
    }
    console.log(`🔵 NARRATIVE BLUEPRINT SERVICE: Target audience data [${requestId}]:`, audienceDataLog);
    
    // Make the actual call with retry logic
    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;
    
    while (attempts < maxAttempts) {
      attempts++;
      try {
        console.log(`🔵 NARRATIVE BLUEPRINT SERVICE: Attempt ${attempts}/${maxAttempts} [${requestId}]`);
        
        const { data, error } = await supabase.functions.invoke('narrative-blueprint', {
          body: {
            surveyData: targetAudienceData,
            emailStyle,
            advertisingGoal,
            timestamp,
            requestId
          },
          headers: {
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache',
            'X-No-Cache': timestamp,
          }
        });
        
        if (error) {
          console.error(`🔴 NARRATIVE BLUEPRINT SERVICE: Error in attempt ${attempts} [${requestId}]:`, error);
          lastError = error;
          
          // If we haven't exhausted all attempts, wait and try again
          if (attempts < maxAttempts) {
            const waitTime = attempts * 1000;
            console.log(`🟠 NARRATIVE BLUEPRINT SERVICE: Retrying in ${waitTime}ms [${requestId}]`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          throw error;
        }
        
        console.log(`🔵 NARRATIVE BLUEPRINT SERVICE: Blueprint generated successfully [${requestId}]:`, data);
        
        // Validate the response data
        if (!data || typeof data !== 'object') {
          throw new Error('Otrzymano nieprawidłową odpowiedź z API');
        }
        
        // Make sure all fields are present in the response
        const blueprint = {
          punktyemocjonalne: data.punktyemocjonalne || 'Brak danych emocjonalnych',
          specyfikamaila: data.specyfikamaila || 'Brak danych specyfiki maila',
          osnarracyjna: data.osnarracyjna || 'Brak osi narracyjnej',
          debugFlag: `Generated at ${timestamp} with request ID ${requestId}`
        };
        
        console.log(`🔵 NARRATIVE BLUEPRINT SERVICE: Formatted blueprint [${requestId}]:`, blueprint);
        
        // Log the complete blueprint content for debugging
        console.log(`🔵 NARRATIVE BLUEPRINT SERVICE: punktyemocjonalne [${requestId}]:`, blueprint.punktyemocjonalne);
        console.log(`🔵 NARRATIVE BLUEPRINT SERVICE: specyfikamaila [${requestId}]:`, blueprint.specyfikamaila);
        console.log(`🔵 NARRATIVE BLUEPRINT SERVICE: osnarracyjna [${requestId}]:`, blueprint.osnarracyjna);
        
        return blueprint as NarrativeBlueprint;
      } catch (attemptErr: any) {
        lastError = attemptErr;
        console.error(`🔴 NARRATIVE BLUEPRINT SERVICE: Attempt ${attempts} failed [${requestId}]:`, attemptErr);
        
        // If we haven't exhausted all attempts, wait and try again
        if (attempts < maxAttempts) {
          const waitTime = attempts * 1000;
          console.log(`🟠 NARRATIVE BLUEPRINT SERVICE: Retrying in ${waitTime}ms [${requestId}]`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
    }
    
    // If we get here, all attempts failed
    throw lastError || new Error('Failed to generate narrative blueprint after multiple attempts');
    
  } catch (err: any) {
    console.error(`🔴 NARRATIVE BLUEPRINT SERVICE: Failed to generate blueprint [${requestId}]:`, err);
    
    // Show a toast notification with the error
    toast.error(`Błąd generowania blueprint: ${err.message}`);
    
    // Return a fallback blueprint with error information
    const fallbackBlueprint = {
      punktyemocjonalne: 'Wygenerowanie punktów emocjonalnych nie powiodło się. Prosimy spróbować ponownie.',
      specyfikamaila: 'Wygenerowanie specyfiki maila nie powiodło się. Prosimy spróbować ponownie.',
      osnarracyjna: 'Wygenerowanie osi narracyjnej nie powiodło się. Prosimy spróbować ponownie.',
      debugFlag: `Error at ${timestamp}: ${err.message}`
    };
    
    console.log(`🟠 NARRATIVE BLUEPRINT SERVICE: Using fallback blueprint [${requestId}]:`, fallbackBlueprint);
    
    // Still throw the error to let the caller handle it
    throw new Error(`Nie udało się wygenerować blueprint narracyjnego: ${err.message}`);
  }
}
