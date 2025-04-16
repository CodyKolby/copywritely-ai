
import { supabase } from '@/integrations/supabase/client';
import { NarrativeBlueprint } from './narrative-blueprint-service';
import { EmailStyle } from '../../EmailStyleDialog';
import { cleanTextForDisplay } from './ui-cleaner-service';

export type EmailStructure = 'PAS' | 'AIDA' | 'BAB' | 'STORY';

export interface EmailContentResponse {
  emailContent: string;
  structureUsed: EmailStructure;
  debugInfo?: any;
}

// Select a random email structure
export const selectRandomEmailStructure = (): EmailStructure => {
  const structures: EmailStructure[] = ['PAS', 'AIDA', 'BAB', 'STORY'];
  return structures[Math.floor(Math.random() * structures.length)];
};

// Generate email content
export const generateEmailContent = async (
  narrativeBlueprint: NarrativeBlueprint,
  targetAudience: any,
  structure: EmailStructure = 'PAS',
  advertisingGoal: string,
  emailStyle: EmailStyle
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
    structure
  });

  const structurePrompt = getStructurePrompt(structure);
  
  const prompt = `
# Cel
Twoim zadaniem jest wygenerowanie treści emaila marketingowego w języku polskim w oparciu o dostarczony blueprint narracyjny.

# Informacje o grupie docelowej
${targetAudience.name || 'Brak nazwy grupy docelowej'}
${targetAudience.gender ? `Płeć: ${targetAudience.gender}` : ''}
${targetAudience.age_range ? `Wiek: ${targetAudience.age_range}` : ''}
${targetAudience.main_offer ? `Główna oferta: ${targetAudience.main_offer}` : ''}
${targetAudience.biography ? `Biografia: ${targetAudience.biography}` : ''}

# Styl maila: ${emailStyle}

# Cel reklamowy: ${advertisingGoal || 'Nie określono'}

# Blueprint narracyjny
## Punkty emocjonalne
${narrativeBlueprint.punktyemocjonalne || 'Brak danych'}

## Specyfika maila
${narrativeBlueprint.specyfikamaila || 'Brak danych'}

## Oś narracyjna
${narrativeBlueprint.osnarracyjna || 'Brak danych'}

# Struktura emaila: ${structure}
${structurePrompt}

# Wytyczne
- Maksymalnie 600-800 słów
- Używaj języka dopasowanego do grupy docelowej
- Twórz żywy, angażujący tekst
- Pamiętaj o call to action (CTA)
- Format: zwykły tekst, bez HTML
- Używaj akapitów dla większej czytelności

Timestamp do unikania cachowania: ${timestamp}
RequestID: ${requestId}
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
            requestId
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
    const emailContent = data.emailContent || "";
    const structureUsed = data.structureUsed || structure;
    
    console.log(`🔵 EMAIL CONTENT SERVICE: Generated content length [${requestId}]: ${emailContent.length} chars`);
    
    // Return cleaned email content
    return {
      emailContent: cleanTextForDisplay(emailContent),
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

    case 'AIDA':
      return `
Attention-Interest-Desire-Action:
1. Uwaga — przyciągnij uwagę silnym, emocjonalnym otwarciem
2. Zainteresowanie — przedstaw szczegóły, które zbudują zainteresowanie
3. Pragnienie — wzbudź pragnienie posiadania produktu/usługi
4. Działanie — jasne wezwanie do działania`;

    case 'BAB':
      return `
Before-After-Bridge:
1. Before — opisz obecną sytuację odbiorcy
2. After — namaluj obraz pożądanej sytuacji po zmianie
3. Bridge — pokaż, jak Twoja oferta pomoże przejść od "przed" do "po"`;

    case 'STORY':
      return `
Struktura narracyjna:
1. Bohater — zacznij od opowieści o kimś podobnym do odbiorcy
2. Problem — przedstaw wyzwanie z którym się zmierzyli
3. Przewodnik — wprowadź siebie/swoją firmę jako przewodnika
4. Plan — przedstaw prosty plan działania
5. Wezwanie — zachęć do podjęcia działania
6. Sukces — opisz pozytywny rezultat`;

    default:
      return 'Struktura nie została określona. Użyj swojej najlepszej oceny.';
  }
};
