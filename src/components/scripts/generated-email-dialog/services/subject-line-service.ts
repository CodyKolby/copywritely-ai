
import { NarrativeBlueprint } from './narrative-blueprint-service';
import { EmailStyle } from '../../EmailStyleDialog';
import { supabase } from '@/integrations/supabase/client';
import { cleanTextForDisplay } from './ui-cleaner-service';

export interface SubjectLinesResponse {
  subject1: string;
  subject2: string;
  debugInfo: any;
  rawOutput?: string;
}

export const DEFAULT_SUBJECT_LINE_PROMPT = `
Stwórz dwie unikalne i różniące się treścią linie tytułowe dla emaila. 
Pierwsza powinna być bardziej bezpośrednia i zorientowana na wartość.
Druga powinna budzić ciekawość i wprowadzać element zaskoczenia.
Obie powinny być przekonujące i dopasowane do grupy docelowej.

Ważne: Tytuły muszą się od siebie znacząco różnić pod względem treści, podejścia i stylu.
Nie powtarzaj tych samych słów kluczowych w obu tytułach.
`;

export const generateSubjectLines = async (
  narrativeBlueprint: NarrativeBlueprint,
  targetAudience: any,
  advertisingGoal: string,
  emailStyle: EmailStyle
): Promise<SubjectLinesResponse> => {
  console.log('SUBJECT LINE SERVICE: Generating subject lines with parameters:', {
    narrativeBlueprintAvailable: !!narrativeBlueprint,
    targetAudienceId: targetAudience?.id || 'N/A',
    advertisingGoal,
    emailStyle
  });
  
  // Create timestamp to avoid caching issues
  const timestamp = new Date().toISOString();
  const requestId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
  
  // Build a prompt for the subject line generation based on the narrative blueprint and audience data
  const prompt = `
# Cel
Twoim zadaniem jest stworzenie dwóch atrakcyjnych i skutecznych linii tytułowych dla maila marketingowego.

# Informacje o grupie docelowej
${targetAudience.name || 'Brak nazwy grupy docelowej'}
${targetAudience.gender ? `Płeć: ${targetAudience.gender}` : ''}
${targetAudience.age_range ? `Wiek: ${targetAudience.age_range}` : ''}
${targetAudience.main_offer ? `Główna oferta: ${targetAudience.main_offer}` : ''}

# Styl maila: ${emailStyle}

# Cel reklamowy: ${advertisingGoal || 'Nie określono'}

# Blueprint narracyjny
## Punkty emocjonalne
${narrativeBlueprint.punktyemocjonalne || 'Brak danych'}

## Specyfika maila
${narrativeBlueprint.specyfikamaila || 'Brak danych'}

## Oś narracyjna
${narrativeBlueprint.osnarracyjna || 'Brak danych'}

# Wytyczne
- Stwórz dwie unikalne i różniące się treścią linie tytułowe dla emaila
- Pierwsza powinna być bardziej bezpośrednia i zorientowana na wartość
- Druga powinna budzić ciekawość i wprowadzać element zaskoczenia
- Obie powinny być przekonujące i dopasowane do grupy docelowej
- Tytuły muszą się od siebie znacząco różnić pod względem treści, podejścia i stylu
- Nie powtarzaj tych samych słów kluczowych w obu tytułach
- Maksymalnie 70 znaków na tytuł

# Format odpowiedzi
Subject 1: [Pierwszy tytuł]
Subject 2: [Drugi tytuł]

Unikaj wprowadzenia, podsumowań, wyjaśnień - tylko tytuły w podanym formacie.
Timestamp do unikania cachowania: ${timestamp}
RequestID: ${requestId}
`;

  console.log('SUBJECT LINE SERVICE: Full prompt for OpenAI:', prompt);
  
  try {
    console.log(`SUBJECT LINE SERVICE: Invoking generate-subject-lines edge function [${requestId}]`);
    
    const { data, error } = await supabase.functions.invoke('generate-subject-lines', {
      body: {
        prompt,
        debugMode: false,
        timestamp: timestamp, // Add timestamp to avoid caching
        requestId: requestId  // Add requestId for tracing
      }
    });
    
    if (error) {
      console.error('SUBJECT LINE SERVICE: Error from edge function:', error);
      throw new Error(`Error generating subject lines: ${error.message}`);
    }
    
    console.log(`SUBJECT LINE SERVICE: Response received [${requestId}]`, data);
    
    // Extract subjects from the response
    const subject1 = data.subject1 || "Domyślny tytuł emaila";
    const subject2 = data.subject2 || "Alternatywny tytuł emaila";
    
    console.log(`SUBJECT LINE SERVICE: Generated subjects [${requestId}]:`);
    console.log(`- Subject 1: "${subject1}"`);
    console.log(`- Subject 2: "${subject2}"`);
    
    // Return the subjects with debug info
    return {
      subject1: cleanTextForDisplay(subject1),
      subject2: cleanTextForDisplay(subject2),
      rawOutput: data.rawOutput || null,
      debugInfo: {
        ...data,
        timestamp,
        requestId
      }
    };
  } catch (err: any) {
    console.error('SUBJECT LINE SERVICE: Failed to generate subject lines:', err);
    // Return default subject lines in case of error
    return {
      subject1: "Domyślny tytuł emaila",
      subject2: "Alternatywny tytuł emaila",
      debugInfo: {
        error: err.message,
        timestamp,
        requestId
      }
    };
  }
};

// Helper function to get default subject lines based on email style
export function getDefaultSubjectsByStyle(emailStyle: EmailStyle): { subject1: string, subject2: string } {
  switch (emailStyle) {
    case 'direct-sales':
      return {
        subject1: 'Specjalna oferta tylko dla Ciebie - oszczędź do 50%',
        subject2: 'Czy wiesz, co tracisz nie korzystając z naszej usługi?'
      };
    case 'educational':
      return {
        subject1: '5 sposobów na rozwiązanie Twojego problemu [poradnik]',
        subject2: 'Ta wiedza zmieni Twoje podejście do biznesu'
      };
    case 'story':
      return {
        subject1: 'Historia Marka: od porażki do sukcesu w 3 miesiące',
        subject2: 'Co odkryłem po latach zmagań z tym samym problemem?'
      };
    case 'relationship':
      return {
        subject1: 'Dziękujemy za bycie częścią naszej społeczności [specjalny prezent]',
        subject2: 'Mamy coś wyjątkowego tylko dla długoletnich klientów'
      };
    default:
      return {
        subject1: 'Odkryj rozwiązanie, które zmieni Twój biznes',
        subject2: 'Czy wiesz, że 80% firm popełnia ten błąd?'
      };
  }
}
