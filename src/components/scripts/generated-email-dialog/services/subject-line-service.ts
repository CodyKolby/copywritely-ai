
import { supabase } from '@/integrations/supabase/client';
import { NarrativeBlueprint } from './narrative-blueprint-service';
import { EmailStyle } from '../../EmailStyleDialog';

export interface SubjectLinesResponse {
  subject1: string;
  subject2: string;
  debugInfo?: any;
}

export const DEFAULT_SUBJECT_LINE_PROMPT = `
Jesteś ekspertem od tworzenia tytułów maili w języku polskim.

Wiesz, że odbiorca codziennie otrzymuje dziesiątki nudnych nagłówków. Twoje tytuły muszą wywoływać emocje, zaskakiwać i być konkretne. Wykorzystuj zadziorność, kontrowersję, kontrasty i wyraźne wezwania, by wybić się spośród innych. Unikaj banałów jak ognia.

Twoje tytuły powinny:
- być jednoznaczne, chwytliwe i składać się z jednej, mocnej myśli,
- angażować odbiorcę natychmiastową obietnicą, ostrzeżeniem, pytaniem lub wyzwaniem,
- bazować na kontrastach (np. porównanie dwóch opcji, przeciwieństw),
- unikać ogólników i pustych fraz jak „Odkryj sekret…” czy „Zacznij już dziś”.

**Zasady tworzenia tytułów:**
1. **Zadziorność i kontrowersja** – mocne, emocjonalne tytuły, które zatrzymują scroll.
2. **Personalizacja** – jeśli to możliwe, używaj imienia odbiorcy (np. „IMIE, nie pozwól mi tego usunąć”).
3. **Porównania i kontrasty** – pokazuj różnicę między skutecznym a nieskutecznym podejściem.
4. **Pytanie vs. rozkaz** – jeden tytuł to pytanie, drugi – mocne stwierdzenie.
5. **Jasność i prostota** – tytuły muszą być zrozumiałe natychmiast, bez trudnych słów.
6. **Bez pustych fraz** – unikaj banałów typu „Odkryj sekret…”, „Zacznij już dziś”.
7. **Czysty format** – bez cudzysłowów, numeracji, kropek – tylko surowy tekst.

**Wskazówki:**
- Zrozum styl maila, jego emocje i ton.
- Bazuj na emocjach odbiorcy, pokazuj, co może stracić lub zyskać.
- Używaj słów jak „NIE”, „zanim”, „dlaczego”, „czy” – jeśli pasują do treści.

**Przykłady inspiracji:**
- NIE kontaktuj się z żadnym klientem, dopóki tego nie zobaczysz…
- Czy naprawdę da się zdobyć klienta w miesiąc (nawet jeśli dopiero zaczynasz)?
- IMIE, nie pozwól mi tego usunąć
- Dlaczego inne kursy z copywritingu NIE uczyniły Cię bogatym?
- 1 wideo o copywritingu warte więcej niż 10 poradników

**Twoje zadanie:**
Stwórz dwa różne tytuły, które będą pasować do tej samej treści maila, ale różnić się stylistycznie i tonalnie. 
Oba muszą być spójne z emocjami odbiorcy, stylem komunikacji oraz celem maila. Możesz wykorzystać pytanie, stwierdzenie, kontrowersję, metaforę lub skrót myślowy – ale oba tytuły muszą prowadzić do tej samej historii i skutecznie przyciągać uwagę.

**Oba tytuły muszą być:**
- spójne z emocjami odbiorcy i stylem komunikacji,
- dostosowane do celu reklamowego,
- krótkie (do 70 znaków),
- zrozumiałe od razu,
- bez ogólników i pustych fraz,
- napisane jako czysty tekst — bez cudzysłowów, numeracji czy znaków specjalnych.

**Format odpowiedzi:**
Subject 1: [pierwszy tytuł — tylko sam tekst]  
Subject 2: [drugi tytuł — tylko sam tekst]
`;

export const generateSubjectLines = async (
  narrativeBlueprint: NarrativeBlueprint,
  targetAudience: any,
  advertisingGoal: string,
  emailStyle: EmailStyle
): Promise<SubjectLinesResponse> => {
  // Generate a unique request ID and timestamp for traceability
  const requestId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
  const timestamp = new Date().toISOString();
  
  console.log('🔵 SUBJECT LINE SERVICE: Starting subject line generation', {
    requestId,
    timestamp,
    hasNarrativeBlueprint: !!narrativeBlueprint,
    targetAudienceId: targetAudience?.id || 'N/A',
    advertisingGoal,
    emailStyle
  });

  // Convert ALL the target audience object fields to a readable string for the prompt
  const audienceDataString = Object.entries(targetAudience || {})
    .filter(([key, value]) => 
      value !== null && 
      value !== undefined && 
      key !== 'id' && 
      key !== 'user_id' && 
      key !== 'created_at' && 
      key !== 'updated_at'
    )
    .map(([key, value]) => {
      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `${formattedKey}: ${value}`;
    })
    .join('\n');
  
  console.log('🔵 SUBJECT LINE SERVICE: Full audience data string:', audienceDataString);

  // Create the prompt for subject line generation
  const completePrompt = DEFAULT_SUBJECT_LINE_PROMPT
    .replace(/{{emailStyle}}/g, emailStyle)
    .replace(/{{punktyemocjonalne}}/g, narrativeBlueprint.punktyemocjonalne || 'Nie określono')
    .replace(/{{osnarracyjna}}/g, narrativeBlueprint.osnarracyjna || 'Nie określono')
    .replace(/{{surveyData}}/g, audienceDataString || 'Brak danych');
  
  // Add the request specific details to the prompt
  const prompt = `
Informacje o grupie docelowej: ${audienceDataString || 'Brak danych grupy docelowej'}
Styl maila: ${emailStyle}
Cel reklamowy: ${advertisingGoal || 'Nie określono'}
Punkty emocjonalne: ${narrativeBlueprint.punktyemocjonalne || 'Brak danych'}
Specyfika maila: ${narrativeBlueprint.specyfikamaila || 'Brak danych'}
Oś narracyjna: ${narrativeBlueprint.osnarracyjna || 'Brak danych'}

Stwórz dwa różne tytuły, które będą pasować do tej samej treści maila, ale różnić się stylistycznie i tonalnie. Możesz wykorzystać różne formy – pytanie, stwierdzenie, kontrowersję, metaforę lub intrygujący skrót myślowy – pod warunkiem, że oba tytuły prowadzą do tej samej historii i skutecznie przyciągają uwagę.

Oba tytuły muszą być:
- spójne z emocjami odbiorcy i stylem komunikacji,
- dostosowane do celu reklamowego,
- krótkie (do 70 znaków),
- zrozumiałe od razu,
- bez ogólników i pustych fraz.
- napisane jako czysty tekst — bez cudzysłowów, numeracji czy znaków specjalnych.

**Format odpowiedzi:**
Subject 1: [pierwszy tytuł — tylko sam tekst]
Subject 2: [drugi tytuł — tylko sam tekst]
`;

  const completePrompt = `${DEFAULT_SUBJECT_LINE_PROMPT}\n\n${prompt}`;
  
  console.log(`🔵 SUBJECT LINE SERVICE: Full prompt for subject lines [${requestId}]`);

  try {
    console.log(`🔵 SUBJECT LINE SERVICE: Invoking generate-subject-lines edge function [${requestId}]`);

    // Perform a test connection first
    try {
      const testResponse = await supabase.functions.invoke('generate-subject-lines', {
        body: { test: "connection" }
      });
      console.log(`🔵 SUBJECT LINE SERVICE: Test connection response [${requestId}]:`, testResponse);
    } catch (testErr) {
      console.warn(`🟠 SUBJECT LINE SERVICE: Connection test failed [${requestId}]:`, testErr);
      // Continue anyway as the actual request might still work
    }

    // Make the actual call with retry logic
    let attempts = 0;
    const maxAttempts = 3;
    let data = null;
    let error = null;
    let lastError = null;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`🔵 SUBJECT LINE SERVICE: Attempt ${attempts}/${maxAttempts} [${requestId}]`);
      
      try {
        const response = await supabase.functions.invoke('generate-subject-lines', {
          body: {
            prompt: completePrompt,
            timestamp,
            requestId,
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
          console.error(`🔴 SUBJECT LINE SERVICE: Error in attempt ${attempts} [${requestId}]:`, error);
          lastError = error;
          
          if (attempts < maxAttempts) {
            const waitTime = attempts * 1000;
            console.log(`🟠 SUBJECT LINE SERVICE: Retrying in ${waitTime}ms [${requestId}]`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          throw new Error(`Edge function error: ${error.message}`);
        }
        
        console.log(`🔵 SUBJECT LINE SERVICE: Response received [${requestId}]`, data);
        break; // Success, exit retry loop
      } catch (err) {
        console.error(`🔴 SUBJECT LINE SERVICE: Request failed in attempt ${attempts} [${requestId}]:`, err);
        lastError = err;
        
        if (attempts < maxAttempts) {
          const waitTime = attempts * 1000;
          console.log(`🟠 SUBJECT LINE SERVICE: Retrying in ${waitTime}ms [${requestId}]`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
    }

    // If we've exhausted all attempts without success
    if (error || !data) {
      throw lastError || new Error('Failed to generate subject lines after multiple attempts');
    }

    // Extract subject lines from response
    const subject1 = data.subject1 || "Poznaj nasze rozwiązanie dla Ciebie";
    const subject2 = data.subject2 || "Co by było gdyby...? Odkryj nowe możliwości";
    
    console.log(`🔵 SUBJECT LINE SERVICE: Generated subject lines [${requestId}]:`, {
      subject1,
      subject2
    });
    
    return {
      subject1,
      subject2,
      debugInfo: {
        ...data,
        timestamp,
        requestId
      }
    };
  } catch (err: any) {
    console.error(`🔴 SUBJECT LINE SERVICE: Failed to generate subject lines [${requestId}]:`, err);
    
    // Provide fallback subject lines in case of error
    return {
      subject1: `Odkryj rozwiązanie dopasowane do Twoich potrzeb`,
      subject2: `Co by było, gdybyś zmienił to już dziś?`,
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
