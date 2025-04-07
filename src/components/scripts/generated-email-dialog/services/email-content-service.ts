
import { supabase } from '@/integrations/supabase/client';
import { NarrativeBlueprint } from './narrative-blueprint-service';

// Email content structure types
export type EmailStructure = 'PAS' | 'CJN';

// Response from the email content generation
export interface EmailContentResponse {
  emailContent: string;
  structureUsed: EmailStructure;
  timestamp?: string;
  requestId?: string;
  rawOutput?: string;
  rawPrompt?: string;
  debugInfo?: {
    requestBody: string;
    sentPrompt: string;
  };
}

// PAS structure prompt template (Problem-Agitation-Solution)
export const PAS_EMAIL_PROMPT = `Jesteś ekspertem od tworzenia efektywnych treści emaili marketingowych w języku polskim.

Twoim zadaniem jest napisanie treści maila w formacie PAS (Problem-Agitacja-Rozwiązanie), który będzie zgodny z podanymi informacjami.

Struktura PAS polega na:
1. Problem - opisanie problemu, z którym boryka się odbiorca
2. Agitacja - rozwinięcie problemu, pokazanie jak wpływa na życie/biznes odbiorcy
3. Rozwiązanie - przedstawienie rozwiązania (produktu/usługi)

**Styl maila**: {{stylmaila}}

**Punkty emocjonalne**: {{punktyemocjonalne}}

**Oś narracyjna**: {{osnarracyjna}}

**Dane z ankiety klienta**: {{surveyData}}

Stwórz email, który będzie miał:
- Wstęp angażujący odbiorcę od pierwszego zdania
- Sekcję opisującą problem (co boli odbiorcę)
- Sekcję rozwijającą problem (jak bardzo wpływa na życie/biznes)
- Sekcję przedstawiającą rozwiązanie (produkt/usługa)
- Wezwanie do działania (CTA)
- Podpis

Nie używaj placeholderów jak "[Nazwa produktu]". Zamiast tego, na podstawie dostarczonych informacji, wymyśl konkretne nazwy i szczegóły.
Treść maila powinna być personalna, emocjonalna i skoncentrowana na odbiorcy.`;

// CJN structure prompt template (Customer Journey Narrative)
export const CJN_EMAIL_PROMPT = `Jesteś ekspertem od tworzenia efektywnych treści emaili marketingowych w języku polskim.

Twoim zadaniem jest napisanie treści maila w formacie CJN (Customer Journey Narrative - Narracja Podróży Klienta), który będzie zgodny z podanymi informacjami.

Struktura CJN polega na:
1. Bohater - odbiorca jako główny bohater narracji
2. Konflikt - wyzwania i problemy z jakimi się zmaga
3. Przewodnik - przedstawienie siebie/marki jako przewodnika
4. Plan - pokazanie jasnego planu działania
5. Wezwanie do działania - zachęta do podjęcia konkretnego kroku

**Styl maila**: {{stylmaila}}

**Punkty emocjonalne**: {{punktyemocjonalne}}

**Oś narracyjna**: {{osnarracyjna}}

**Dane z ankiety klienta**: {{surveyData}}

Stwórz email, który będzie:
- Stawiał odbiorcę w centrum narracji jako bohatera
- Opisywał jego obecną sytuację i wyzwania
- Przedstawiał nadawcę jako kompetentnego przewodnika
- Pokazywał jasny, prosty plan działania
- Zawierał silne wezwanie do działania
- Kończył się podpisem

Nie używaj placeholderów jak "[Nazwa produktu]". Zamiast tego, na podstawie dostarczonych informacji, wymyśl konkretne nazwy i szczegóły.
Treść maila powinna być osobista, narracyjna i budująca zaufanie.`;

/**
 * Randomly selects an email structure (PAS or CJN)
 */
export function selectRandomEmailStructure(): EmailStructure {
  // 50/50 chance for each structure
  return Math.random() < 0.5 ? 'PAS' : 'CJN';
}

/**
 * Generates email content based on the narrative blueprint and target audience data
 * Randomly selects between PAS and CJN structures
 */
export async function generateEmailContent(
  blueprint: NarrativeBlueprint,
  targetAudienceData: any,
  forcedStructure?: EmailStructure // Optional parameter to force a specific structure
): Promise<EmailContentResponse> {
  const timestamp = new Date().toISOString();
  console.log('Generating email content with request timestamp:', timestamp);

  try {
    // Select structure (randomly or use forced structure if provided)
    const selectedStructure = forcedStructure || selectRandomEmailStructure();
    console.log(`Selected email structure: ${selectedStructure}`);
    
    // Choose appropriate prompt based on selected structure
    const promptTemplate = selectedStructure === 'PAS' ? PAS_EMAIL_PROMPT : CJN_EMAIL_PROMPT;
    
    // Create a formatted version of the survey data for the prompt
    const formattedSurveyData = JSON.stringify(targetAudienceData, null, 2);
    
    // Replace template variables with actual values
    let finalPrompt = promptTemplate
      .replace('{{punktyemocjonalne}}', blueprint.punktyemocjonalne)
      .replace('{{stylmaila}}', blueprint.specyfikamaila)
      .replace('{{osnarracyjna}}', blueprint.osnarracyjna)
      .replace('{{surveyData}}', formattedSurveyData);
    
    // Add unique request identifiers to prevent caching
    const requestBody = {
      prompt: finalPrompt,
      structureType: selectedStructure,
      debugMode: false, // Set to true to get debug responses without calling OpenAI
      _timestamp: Date.now(),
      _nonce: Math.random().toString(36).substring(2, 15)
    };
    
    console.log(`Email content request payload size: ${JSON.stringify(requestBody).length}`);
    console.log(`Final prompt for ${selectedStructure} email (first 200 chars): ${finalPrompt.substring(0, 200)}...`);
    
    // Using supabase.functions.invoke with explicit cache-busting headers
    const { data, error } = await supabase.functions.invoke('generate-email-content', {
      body: requestBody,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-No-Cache': Date.now().toString()
      }
    });
    
    if (error) {
      console.error(`Error invoking generate-email-content: ${error.message}`);
      throw new Error(`Error invoking generate-email-content: ${error.message}`);
    }
    
    console.log('Raw email content data received:', data);
    
    // Ensure we have email content from the edge function
    if (!data.emailContent) {
      console.error('Missing email content in response:', data);
      throw new Error('Incomplete email content returned from API');
    }
    
    console.log(`Email content generated successfully using ${selectedStructure} structure`);
    console.log('Response timestamp:', data.timestamp || 'not provided');
    console.log('Request ID:', data.requestId || 'not provided');
    
    // Return the email content response
    return {
      emailContent: data.emailContent,
      structureUsed: selectedStructure,
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
    console.error('Failed to generate email content:', err);
    
    // In case of error, return a placeholder email with error information
    return {
      emailContent: `Nie udało się wygenerować treści maila.\n\nBłąd: ${err.message}\n\nProszę spróbować ponownie.`,
      structureUsed: forcedStructure || 'PAS',
      timestamp: timestamp,
      debugInfo: {
        requestBody: 'Error occurred',
        sentPrompt: 'Error occurred'
      }
    };
  }
}
