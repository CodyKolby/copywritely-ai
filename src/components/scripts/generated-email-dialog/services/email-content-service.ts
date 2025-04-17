
import { supabase } from '@/integrations/supabase/client';
import { NarrativeBlueprint } from './narrative-blueprint-service';
import { EmailStyle } from '../../EmailStyleDialog';
import { cleanTextForDisplay, applyEdgeFunctionCleaning } from './ui-cleaner-service';

export type EmailStructure = 'PAS' | 'CJN';

export interface EmailContentResponse {
  emailContent: string;
  structureUsed: EmailStructure;
  debugInfo?: any;
}

// Select a random email structure between PAS and CJN
export const selectRandomEmailStructure = (): EmailStructure => {
  const structures: EmailStructure[] = ['PAS', 'CJN'];
  return structures[Math.floor(Math.random() * structures.length)];
};

// Generate email content
export const generateEmailContent = async (
  narrativeBlueprint: NarrativeBlueprint,
  targetAudience: any,
  structure: EmailStructure = 'PAS',
  advertisingGoal: string,
  emailStyle: EmailStyle,
  subjectLine1?: string,
  subjectLine2?: string
): Promise<EmailContentResponse> => {
  // Generate a unique request ID and timestamp for tracking
  const requestId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
  const timestamp = new Date().toISOString();
  
  console.log('🔵 EMAIL CONTENT SERVICE: Starting email content generation', {
    requestId,
    timestamp,
    hasNarrativeBlueprint: !!narrativeBlueprint,
    targetAudienceId: targetAudience?.id || 'N/A',
    advertisingGoal,
    emailStyle,
    structure,
    hasSubjectLine1: !!subjectLine1,
    hasSubjectLine2: !!subjectLine2
  });

  // Convert the entire target audience object to a readable string for the prompt
  const audienceDataString = Object.entries(targetAudience || {})
    .filter(([key, value]) => value !== null && value !== undefined && key !== 'id' && key !== 'user_id' && key !== 'created_at' && key !== 'updated_at')
    .map(([key, value]) => {
      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `${formattedKey}: ${value}`;
    })
    .join('\n');
  
  console.log('🔵 EMAIL CONTENT SERVICE: Audience data string:', audienceDataString);

  const structurePrompt = getStructurePrompt(structure);
  
  const prompt = `
Informacje o grupie docelowej: ${audienceDataString || 'Brak danych grupy docelowej'}
Styl maila: ${emailStyle}
Cel reklamowy: ${advertisingGoal || 'Nie określono'}
Punkty emocjonalne: ${narrativeBlueprint.punktyemocjonalne || 'Brak danych'}
Specyfika maila: ${narrativeBlueprint.specyfikamaila || 'Brak danych'}
Oś narracyjna: ${narrativeBlueprint.osnarracyjna || 'Brak danych'}
Tytuły emaila
Tytuł 1: ${subjectLine1 || 'Nie określono'}
Tytuł 2: ${subjectLine2 || 'Nie określono'}
`;

  console.log(`🔵 EMAIL CONTENT SERVICE: Full prompt for email content [${requestId}]:`, prompt);

  try {
    console.log(`🔵 EMAIL CONTENT SERVICE: Invoking generate-email-content edge function [${requestId}]`);

    // First, let's try a test connection
    try {
      const testResponse = await supabase.functions.invoke('generate-email-content', {
        body: { test: "connection" }
      });
      console.log(`🔵 EMAIL CONTENT SERVICE: Test connection response [${requestId}]:`, testResponse);
    } catch (testErr) {
      console.warn(`🟠 EMAIL CONTENT SERVICE: Connection test failed [${requestId}]:`, testErr);
      // Continue anyway as the actual request might work
    }

    // Make the actual call with retry logic
    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;
    let data = null;
    let error = null;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`🔵 EMAIL CONTENT SERVICE: Attempt ${attempts}/${maxAttempts} [${requestId}]`);
      
      try {
        const response = await supabase.functions.invoke('generate-email-content', {
          body: {
            prompt,
            structureType: structure,
            timestamp,
            requestId,
            subjectLine1,
            subjectLine2,
            narrativeBlueprint: {
              punktyemocjonalne: narrativeBlueprint.punktyemocjonalne || '',
              specyfikamaila: narrativeBlueprint.specyfikamaila || '',
              osnarracyjna: narrativeBlueprint.osnarracyjna || ''
            },
            emailStyle,
            advertisingGoal,
            surveyData: audienceDataString
          },
          headers: {
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache',
            'X-No-Cache': timestamp
          }
        });
        
        data = response.data;
        error = response.error;
        
        if (error) {
          console.error(`🔴 EMAIL CONTENT SERVICE: Error in attempt ${attempts} [${requestId}]:`, error);
          lastError = error;
          
          // If we haven't exhausted all attempts, wait and try again
          if (attempts < maxAttempts) {
            const waitTime = attempts * 1000;
            console.log(`🟠 EMAIL CONTENT SERVICE: Retrying in ${waitTime}ms [${requestId}]`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          throw new Error(`Edge function error: ${error.message}`);
        }
        
        console.log(`🔵 EMAIL CONTENT SERVICE: Response received [${requestId}]`, data);
        break; // Success, exit the retry loop
      } catch (err) {
        console.error(`🔴 EMAIL CONTENT SERVICE: Request failed in attempt ${attempts} [${requestId}]:`, err);
        lastError = err;
        
        // If we haven't exhausted all attempts, wait and try again
        if (attempts < maxAttempts) {
          const waitTime = attempts * 1000;
          console.log(`🟠 EMAIL CONTENT SERVICE: Retrying in ${waitTime}ms [${requestId}]`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
    }

    // If we've exhausted all attempts without success
    if (error || !data) {
      throw lastError || new Error('Failed to generate email content after multiple attempts');
    }

    // Extract email content from response
    // Now we check for both emailContent (cleaned) and rawEmailContent (original)
    const rawEmailContent = data.rawEmailContent || data.emailContent || "";
    const cleanedContent = data.emailContent || "";
    const structureUsed = data.structureUsed || structure;
    
    // Apply the best available content (prefer pre-cleaned from edge function if available)
    const finalEmailContent = applyEdgeFunctionCleaning(rawEmailContent, cleanedContent);
    
    console.log(`🔵 EMAIL CONTENT SERVICE: Generated content length [${requestId}]: ${finalEmailContent.length} chars`);
    
    return {
      emailContent: finalEmailContent,
      structureUsed,
      debugInfo: {
        ...data,
        timestamp,
        requestId
      }
    };
  } catch (err: any) {
    console.error(`🔴 EMAIL CONTENT SERVICE: Failed to generate email content [${requestId}]:`, err);
    
    // Return a fallback message in case of error
    const fallbackContent = `
Nie udało się wygenerować treści emaila. Prosimy spróbować ponownie.

W międzyczasie, oto przykładowa struktura, którą możesz wykorzystać:

## Wprowadzenie
[Tutaj wprowadzenie nawiązujące do punktów emocjonalnych]

## Problem
[Opis problemu odbiorcy]

## Rozwiązanie
[Przedstawienie Twojej oferty jako rozwiązania]

## Korzyści
- Korzyść 1
- Korzyść 2
- Korzyść 3

## Wezwanie do działania
[Co odbiorca ma zrobić dalej]
    `;
    
    return {
      emailContent: fallbackContent,
      structureUsed: structure,
      debugInfo: {
        error: err.message,
        errorStack: err.stack,
        timestamp,
        requestId,
        fallbackUsed: true
      }
    };
  }
};

const getStructurePrompt = (structure: EmailStructure): string => {
  switch (structure) {
    case 'PAS':
      return `
Problem-Agitacja-Rozwiązanie:
1. Problem — zidentyfikuj główny problem/ból odbiorcy
2. Agitacja — pogłęb problem, pokaż jego konsekwencje
3. Rozwiązanie — przedstaw swoją ofertę jako rozwiązanie`;

    case 'CJN':
      return `
Cecha-Zaleta-Nagroda:
1. Cecha — przedstaw główne cechy produktu/usługi
2. Zaleta — wyjaśnij, jakie zalety wynikają z tych cech
3. Nagroda — pokaż konkretne korzyści i rezultaty`;

    default:
      return 'Struktura nie została określona. Użyj swojej najlepszej oceny.';
  }
};
