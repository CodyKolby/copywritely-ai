
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

1. **Zadziorność i kontrowersja**: Tytuł ma być mocny, zaskakujący, pełen emocji. Może zawierać pytania lub ostrzeżenia, które zmuszają do kliknięcia.
2. **Personalizacja**: Jeśli to możliwe, używaj imienia odbiorcy (np. „IMIE, nie pozwól mi tego usunąć”).
3. **Porównania i kontrasty**: Stwórz kontrast między „dobrym” a „złym” podejściem, np. „Dlaczego inne kursy Cię nie wzbogaciły?”.
4. **Pytanie vs. rozkaz**: Jeden tytuł ma być pytaniem, a drugi – rozkazem lub stwierdzeniem wywołującym kontrowersję.
5. **Jasność i prostota**: Tytuł ma być łatwy do zrozumienia, bez trudnych słów. Pisz językiem, który zrozumie 4-latek. Unikaj skomplikowanych konstrukcji i słów, które wymagają długiego zastanawiania się.
6. **Unikaj pustych fraz**: Tytuł nie może zawierać ogólników takich jak „Zacznij już dziś” czy „Odkryj sekret…”. Musi mówić od razu, dlaczego warto kliknąć.
7. **Jasna struktura**: Pisz w prosty sposób, aby tytuł był zrozumiały od razu. Unikaj zdań złożonych, przecinków typu „–”, „...”.

**Wskazówki do tworzenia tytułów**:

- Przeczytaj styl maila z blueprintu, zrozum jego ton, cel i sposób prowadzenia narracji.
- Zastosuj mechanizm emocji i kontrastów, np. używając słów jak „NIE”, „nie rób tego”, „zanim”, „dlaczego” lub „czy”.
- Tytuły muszą być natychmiastowe w odbiorze, a jednocześnie wywoływać poczucie, że coś ważnego jest w środku, co można stracić.

**Styl maila**: {{emailStyle}}

**Punkty emocjonalne**: {{punktyemocjonalne}}

**Oś narracyjna**: {{osnarracyjna}}

**Dane z ankiety klienta**: {{surveyData}}

**Przykłady tytułów do inspiracji**:

- "NIE kontaktuj się z żadnym klientem, dopóki tego nie zobaczysz…"
- "Czy naprawdę da się zdobyć klienta w miesiąc (nawet jeśli dopiero zaczynasz)?"
- "IMIE, nie pozwól mi tego usunąć"
- "Dlaczego inne kursy z copywritingu NIE uczyniły Cię bogatym?"
- "1 wideo o copywritingu warte więcej niż 10 poradników"

**Twoje zadanie**:

Stwórz dwa tytuły, które będą pasować do tej samej treści maila, ale różnić się formą stylistyczną. Jeden tytuł ma być pytaniem, a drugi – rozkazem lub stwierdzeniem, które wywołuje kontrowersję. Tytuły muszą pasować do tonu maila oraz emocji odbiorcy.
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
  const prompt = `
# Cel
Twoim zadaniem jest stworzenie dwóch atrakcyjnych i skutecznych linii tytułowych dla maila marketingowego.

# Informacje o grupie docelowej
${audienceDataString || 'Brak danych grupy docelowej'}

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
            prompt,
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
