
import { supabase } from '@/integrations/supabase/client';
import { EmailStyle } from '../EmailStyleDialog';

export interface NarrativeBlueprint {
  punktyemocjonalne: string;
  stylmaila: string;
  osnarracyjna: string;
  // Add debug fields
  subject1Debug?: string;
  subject2Debug?: string;
  debugFlag?: string;
}

// Default prompt template that can be customized
const DEFAULT_SUBJECT_LINE_PROMPT = `Jesteś ekspertem od tworzenia tytułów maili w języku polskim. 
Wiesz, że odbiorca widzi dziennie dziesiątki nudnych nagłówków. Nic się nie przebije bez zadziorności, humoru, konkretu lub emocji. 
Twoje tytuły muszą mieć charakter — być nieoczywiste, ale zrozumiałe. Unikasz banałów jak ognia.

Twoim głównym źródłem inspiracji są skuteczne tytuły, które wywołują reakcję. 
Nie kopiuj — analizuj ich mechanikę i strukturę. Dopasowuj je do danych o produkcie i emocjach odbiorcy.

Przykłady skutecznych tytułów:
"NIE kontaktuj się z żadnym klientem, dopóki tego nie zobaczysz…"
"Czy naprawdę da się zdobyć klienta w miesiąc (nawet jeśli dopiero zaczynasz)?"
"IMIE, nie pozwól mi tego usunąć"
"Dlaczego inne kursy z copywritingu NIE uczyniły Cię bogatym?"
"1 wideo o copywritingu warte więcej niż 10 poradników"

Ucz się z ich struktury: zakaz, pytanie, osobiste wezwanie, kontrowersja, liczby, konkret.

Zasady:
1. Max. długość tytułu: 60 znaków.
2. Pisz językiem, który zrozumie 4-latek.
3. Żadnego żargonu, ogólników, pustych metafor.
4. Tytuł ma natychmiast mówić, dlaczego warto go kliknąć.
5. Tytuły muszą być spójne z blueprintem emocjonalnym.
6. Unikaj pustych fraz jak „Zacznij już dziś”, „Odkryj sekret…” itp.
7. Jeden tytuł = jedna myśl. Nie używaj dwóch zdań, ani przecinków typu „–”, „...”.
8. Jeśli używasz imienia, wpisz placeholder: IMIE.
9. Dwa tytuły muszą być o tej samej treści maila, ale mieć różny styl (np. pytanie vs. rozkaz).
10. Styl i emocje mają wynikać z przekazanych danych — zwłaszcza punktów emocjonalnych.

BLUEPRINT NARRACYJNY:
Punkty emocjonalne: ${{punktyemocjonalne}}
Styl maila: ${{stylmaila}}
Oś narracyjna: ${{osnarracyjna}}

DODATKOWE INFORMACJE:
${{surveyData}}

subject1: [Pierwszy tytuł emaila]
subject2: [Drugi tytuł emaila]`;

export async function generateNarrativeBlueprint(targetAudienceData: any, emailStyle: EmailStyle, advertisingGoal: string): Promise<NarrativeBlueprint> {
  console.log('Generating narrative blueprint...');
  try {
    const { data, error } = await supabase.functions.invoke('narrative-blueprint', {
      body: {
        surveyData: targetAudienceData,
        emailStyle,
        advertisingGoal
      }
    });
    
    if (error) throw new Error(`Error invoking narrative-blueprint: ${error.message}`);
    
    console.log('Narrative blueprint generated successfully:', data);
    return data as NarrativeBlueprint;
  } catch (err: any) {
    console.error('Failed to generate narrative blueprint:', err);
    throw new Error('Nie udało się wygenerować blueprint narracyjnego');
  }
}

export async function generateSubjectLines(blueprint: NarrativeBlueprint, targetAudienceData: any) {
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
    console.log({{surveyData}});
    
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

export async function saveEmailToProject(
  projectId: string, 
  generatedSubject: string,
  generatedEmail: string,
  userId: string,
  targetAudienceId: string,
  narrativeBlueprint?: NarrativeBlueprint,
  alternativeSubject?: string
) {
  const projectData = {
    id: projectId,
    title: `Email: ${generatedSubject.substring(0, 50)}`,
    content: generatedEmail,
    subject: generatedSubject,
    user_id: userId,
    type: 'email',
    status: 'Draft' as 'Draft' | 'Completed' | 'Reviewed', // Explicitly cast as enum type
    target_audience_id: targetAudienceId
  };
  
  // If we have a narrative blueprint, include it in the metadata
  if (narrativeBlueprint) {
    Object.assign(projectData, {
      metadata: {
        narrativeBlueprint: {
          punktyEmocjonalne: narrativeBlueprint.punktyemocjonalne,
          stylMaila: narrativeBlueprint.stylmaila,
          osNarracyjna: narrativeBlueprint.osnarracyjna
        },
        alternativeSubject: alternativeSubject
      }
    });
  }
  
  // Save to database
  const { error } = await supabase
    .from('projects')
    .insert(projectData);
  
  if (error) throw error;
  
  return projectId;
}
