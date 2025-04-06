
import { supabase } from '@/integrations/supabase/client';
import { NarrativeBlueprint } from './narrative-blueprint-service';

// Default prompt template that can be customized
export const DEFAULT_SUBJECT_LINE_PROMPT = `Jesteś ekspertem od tworzenia tytułów maili w języku polskim.

Wiesz, że odbiorca codziennie otrzymuje dziesiątki nudnych nagłówków. Twoje tytuły muszą wywoływać emocje, zaskakiwać i być konkretne. Wykorzystuj zadziorność, kontrowersję, kontrasty i wyraźne wezwania, by wybić się spośród innych. Unikaj banałów jak ognia.

Twoje tytuły powinny:

- być jednoznaczne, chwytliwe i składać się z jednej, mocnej myśli,
- angażować odbiorcę natychmiastową obietnicą, ostrzeżeniem, pytaniem lub wyzwaniem,
- bazować na kontrastach (np. porównanie dwóch opcji, przeciwieństw),
- unikać ogólników i pustych fraz jak „Odkryj sekret…" czy „Zacznij już dziś".

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
- Zastosuj mechanizm emocji i kontrastów, np. używając słów jak „NIE", „nie rób tego", „zanim", „dlaczego" lub „czy".
- Tytuły muszą być natychmiastowe w odbiorze, a jednocześnie wywoływać poczucie, że coś ważnego jest w środku, co można stracić.

**Styl maila**: {{stylmaila}}

**Punkty emocjonalne**: {{punktyemocjonalne}}

**Oś narracyjna**: {{osnarracyjna}}

**Dane z ankiety klienta**: {{surveyData}}

**Przykłady tytułów do inspiracji**:

- "NIE kontaktuj się z żadnym klientem, dopóki tego nie zobaczysz…"
- "Czy naprawdę da się zdobyć klienta w miesiąc (nawet jeśli dopiero zaczynasz)?"
- "IMIE, nie pozwól mi tego usunąć"
- "Dlaczego inne kursy z copywritingu NIE uczyniły Cię bogatym?"
- "1 wideo o copywritingu warte więcej niż 10 poradników"

Bardzo ważne: Twoja odpowiedź musi być sformatowana dokładnie w ten sposób, używając oznaczeń "subject1:" i "subject2:", bez dodatkowego formatowania:

subject1: [Pierwszy tytuł maila]
subject2: [Drugi tytuł maila]`;

export interface SubjectLinesResponse {
  subject1: string;
  subject2: string;
  timestamp?: string;
  requestId?: string;
  rawOutput?: string;
  rawPrompt?: string;
  debugInfo?: {
    requestBody: string;
    sentPrompt: string;
  };
}

export async function generateSubjectLines(
  blueprint: NarrativeBlueprint, 
  targetAudienceData: any
): Promise<SubjectLinesResponse> {
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
    console.log('Raw OpenAI output:', data.rawOutput || 'not provided');
    
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
