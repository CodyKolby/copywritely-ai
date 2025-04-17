
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
  // Generate a unique request ID and timestamp for tracking
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
  
  // Convert the entire target audience object to a readable string for the prompt
  const audienceDataString = Object.entries(targetAudience || {})
    .filter(([key, value]) => value !== null && value !== undefined && key !== 'id' && key !== 'user_id' && key !== 'created_at' && key !== 'updated_at')
    .map(([key, value]) => {
      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `${formattedKey}: ${value}`;
    })
    .join('\n');
  
  // Build a prompt for the subject line generation based on the narrative blueprint and audience data
  const prompt = `
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

**Styl maila**: ${emailStyle}

**Punkty emocjonalne**: ${narrativeBlueprint.punktyemocjonalne || 'Brak danych'}

**Oś narracyjna**: ${narrativeBlueprint.osnarracyjna || 'Brak danych'}

**Dane z ankiety klienta**: ${audienceDataString || 'Brak danych grupy docelowej'}

**Przykłady tytułów do inspiracji**:

- "NIE kontaktuj się z żadnym klientem, dopóki tego nie zobaczysz…"
- "Czy naprawdę da się zdobyć klienta w miesiąc (nawet jeśli dopiero zaczynasz)?"
- "IMIE, nie pozwól mi tego usunąć"
- "Dlaczego inne kursy z copywritingu NIE uczyniły Cię bogatym?"
- "1 wideo o copywritingu warte więcej niż 10 poradników"

**Twoje zadanie**:

Stwórz dwa tytuły, które będą pasować do tej samej treści maila, ale różnić się formą stylistyczną. Jeden tytuł ma być pytaniem, a drugi – rozkazem lub stwierdzeniem, które wywołuje kontrowersję. Tytuły muszą pasować do tonu maila oraz emocji odbiorcy.
`;

  console.log(`🔵 SUBJECT LINE SERVICE: Full prompt for subject lines [${requestId}]:`, prompt);
  
  try {
    console.log(`🔵 SUBJECT LINE SERVICE: Invoking generate-subject-lines edge function [${requestId}]`);
    
    // First, check if we can reach the edge function
    try {
      const testResponse = await supabase.functions.invoke('generate-subject-lines', {
        body: {
          prompt: "Test connection",
          debugMode: true,
          timestamp,
          requestId
        }
      });
      
      console.log(`🔵 SUBJECT LINE SERVICE: Test response received [${requestId}]`, testResponse);
    } catch (testErr) {
      console.warn(`🟠 SUBJECT LINE SERVICE: Test connection failed [${requestId}]:`, testErr);
      // Continue anyway, the actual request might work
    }
    
    // Now make the actual call
    const { data, error } = await supabase.functions.invoke('generate-subject-lines', {
      body: {
        prompt,
        debugMode: false,
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
      console.error(`🔴 SUBJECT LINE SERVICE: Error from edge function [${requestId}]:`, error);
      throw new Error(`Error generating subject lines: ${error.message}`);
    }
    
    console.log(`🔵 SUBJECT LINE SERVICE: Response received [${requestId}]`, data);
    
    // Extract subjects from the response
    const subject1 = data.subject1 || "Domyślny tytuł emaila";
    const subject2 = data.subject2 || "Alternatywny tytuł emaila";
    
    console.log(`🔵 SUBJECT LINE SERVICE: Generated subjects [${requestId}]:`);
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
    console.error(`🔴 SUBJECT LINE SERVICE: Failed to generate subject lines [${requestId}]:`, err);
    
    // Try to get a fallback from default subjects based on email style
    const defaultSubjects = getDefaultSubjectsByStyle(emailStyle);
    console.log(`🟠 SUBJECT LINE SERVICE: Using fallback subjects [${requestId}]:`, defaultSubjects);
    
    // Return default subject lines in case of error
    return {
      subject1: defaultSubjects.subject1,
      subject2: defaultSubjects.subject2,
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
