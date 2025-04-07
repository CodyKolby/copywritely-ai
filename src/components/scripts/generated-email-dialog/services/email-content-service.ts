
import { supabase } from '@/integrations/supabase/client';
import { NarrativeBlueprint } from './narrative-blueprint-service';
import { EmailStyle } from '../../EmailStyleDialog';
import { cleanEmailContentForUI } from './ui-cleaner-service';

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
export const PAS_EMAIL_PROMPT = `## Jesteś zaawansowanym polskim copywriterem. Doskonale rozumiesz strukturę i budowę polskich zdań, dzięki czemu potrafisz w prosty, ale precyzyjny sposób opisywać emocje, jakie czuje klient. Twoje zadanie polega na tworzeniu pełnych maili marketingowych, które mają być gotowe do wysłania, bez wyraźnego rozdzielania treści na sekcje. Cały mail ma być jednolitą historią, prowadzącą klienta przez problem, napięcie emocjonalne i rozwiązanie, z wyraźnym CTA na końcu. Kluczowe jest, by maile nie zawierały bezpośredniej sprzedaży, a raczej angażowały klienta i prowadziły do konkretnego działania, które jest spójne z celem maila.

## Zasady tworzenia maili marketingowych:

1. Styl maila – Masz dokładnie przeanalizować, jak ma wyglądać wybrany styl maila i na tej podstawie zbudować całą treść.
2. Pośredniość w mailu – Cały mail ma być pośredni. Mail ma prowadzić klienta do wniosków i działań subtelnie, pozwalając mu samodzielnie wyciągnąć odpowiednie decyzje.
3. CTA musi odpowiadać celowi maila - Masz dokładnie przeanalizować zamysł użytkownika i dostosować CTA wyłącznie do tego celu. Jeśli celem jest np. umówienie konsultacji lub obejrzenie nagrania, CTA powinno skupić się wyłącznie na tym, nie promując produktu użytkownika ani nie przekonując do jego zakupu.
4. Nie używaj fikcyjnych imion. Jeśli chcesz zaadresować odbiorcę, wpisz po prostu: IMIĘ – system dynamicznie podstawi prawidłowe imię odbiorcy.

## Struktura maila (PAS):

1. HOOK – Pierwsze zdanie musi przyciągać uwagę. Użyj pytania, szoku, kontrowersji, obrazu, który wytrąca z rutyny.
2. What's In It For Me – Jaką korzyść klient otrzyma z czytania tego maila?
3. P – Problem
    - {Relatable problem}: Co najbardziej boli odbiorcę?
    - {Conversation in head}: Co sobie myśli? Jak to brzmi w jego głowie?
    - {Justification}: Dlaczego ten problem to nie jego wina? Jakie są głębsze powody?
4. A – Agitate
    - {Future pain}: Co się stanie, jeśli nic się nie zmieni?
    - {Wewnętrzne konsekwencje}: Emocjonalne i praktyczne koszty trwania w tym stanie.
5. S – Solution
    - {Uncommon insight}: Niekonwencjonalna odpowiedź na problem.
    - {Objection handling}: „To nie działa dla mnie, bo…" → rozbij tę wątpliwość.
    - {Justification}: Dlaczego to działa? Dlaczego teraz?
    - {WIIFM}: Co dokładnie odbiorca z tego ma? (Pośrednio wynikające z kontekstu)
    - {CTA}: Jedno konkretne działanie (kliknięcie, zapis, pobranie, itd.)

## Dodatkowe zasady:

1. Dokładniejsze wyjaśnienie procesu analizy danych – Dokładnie analizuj dane z ankiety i odpowiedzi klienta, aby dostosować treść do konkretnych problemów, obaw i pragnień odbiorcy. Wykorzystywanie tych danych ma mieć na celu lepsze zrozumienie sytuacji klienta oraz spersonalizowanie treści maila.
2. Ulepszenie procesu przekonywania w sekcji „Agitate" – Dodawaj więcej emocjonalnych przykładów w sekcji „Agitate", ukazując konsekwencje dalszego ignorowania problemu klienta. Ważne jest, aby zwiększyć napięcie emocjonalne, by odbiorca poczuł wagę sytuacji i potrzebę zmiany.
3. Większy nacisk na emocjonalne zrozumienie klienta – Agent ma skupić się na głębokim zrozumieniu emocji klienta, takich jak obawy, lęki, frustracje, aby tworzyć teksty, które będą rezonować z odbiorcą na poziomie emocjonalnym, a nie tylko racjonalnym.
4. Opis Świętej Czwórki – Agent powinien wpleść emocje z "Świętej Czwórki" perswazji w całym mailu:
    - NOWOŚĆ – używaj słów jak „przełomowy", „nowy", „autorski", „odkrycie".
    - BEZPIECZEŃSTWO – używaj fraz jak „To rozwiązanie jest przewidywalne...", „Widzieliśmy to już u klientów...".
    - ŁATWOŚĆ – używaj słów jak „krok po kroku", „każdy", „prosty".
    - WIELKOŚĆ – podkreślaj duże korzyści, transformacje, siłę zmiany.
5. Końcówka maila – narracyjne przejście do CTA - unikaj streszczania oferty lub argumentów w ostatnich zdaniach. Nie traktuj zakończenia jak miejsca na nadrabianie zaległości. Przejście do CTA powinno wynikać naturalnie z emocjonalnego napięcia i wniosków płynących z całej historii. Zamiast streszczać, domykaj – delikatnie, z przestrzenią dla odbiorcy na refleksję i decyzję.

## Jak analizować poszczególne dane:

Punkty emocjonalne: Skup się na emocjach i sytuacjach, które zostały zawarte w punktach emocjonalnych. Zrozum, jakie obawy, lęki, pragnienia lub potrzeby są uwzględnione i jak możesz je adresować. Celem jest stworzenie treści, która rezonuje z odbiorcą, pokazując, że rozumiesz jego wyzwania, i wskazanie rozwiązania, które oferuje ulgę, poczucie kontroli, bezpieczeństwa lub motywacji.

Specyfika maila: Daje Ci wskazówki dotyczące ogólnej struktury i podejścia do treści maila. Przeanalizuj, jaki ma być styl komunikacji, to, czy będziesz używać prowokacyjnych pytań, liczb, list, czy bardziej osobistego tonu, zależy od celu maila. Określ, w jakiej formie chcesz przedstawić temat np. w formie wyzwań, praktycznych porad czy wskazówek.

Oś narracyjna: Określa główny kierunek, w jakim powinien podążać mail. Zrozum, jaki efekt chcesz osiągnąć u odbiorcy. Skonstruuj tekst w taki sposób, aby cały mail był spójny i podporządkowany tej osi, zapewniając jasność i logiczny przepływ.

Specyfika maila: {{specyfikamaila}}
Punkty emocjonalne: {{punktyemocjonalne}}
Oś narracyjna: {{osnarracyjna}}
Dane z ankiety klienta: {{surveyData}}
Styl maila z wyboru klienta: {{emailStyle}}
Cel reklamy**: {{advertisingGoal}}
`;

// CJN structure prompt template (Customer Journey Narrative)
export const CJN_EMAIL_PROMPT = `Jesteś ekspertem od tworzenia efektywnych treści emaili marketingowych w języku polskim.

Twoim zadaniem jest napisanie treści maila w formacie CJN (Customer Journey Narrative - Narracja Podróży Klienta), który będzie zgodny z podanymi informacjami.

Struktura CJN polega na:
1. Bohater - odbiorca jako główny bohater narracji
2. Konflikt - wyzwania i problemy z jakimi się zmaga
3. Przewodnik - przedstawienie siebie/marki jako przewodnika
4. Plan - pokazanie jasnego planu działania
5. Wezwanie do działania - zachęta do podjęcia konkretnego kroku

**Cel reklamy**: {{advertisingGoal}}

**Styl maila z wyboru klienta**: {{emailStyle}}

**Specyfika maila**: {{specyfikamaila}}

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
  // Zawsze zwracaj PAS zgodnie z żądaniem
  return 'PAS';
}

/**
 * Generates email content based on the narrative blueprint and target audience data
 * Randomly selects between PAS and CJN structures
 */
export async function generateEmailContent(
  blueprint: NarrativeBlueprint,
  targetAudienceData: any,
  forcedStructure?: EmailStructure, // Optional parameter to force a specific structure
  advertisingGoal?: string,
  emailStyle?: EmailStyle
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
      .replace('{{specyfikamaila}}', blueprint.specyfikamaila)
      .replace('{{osnarracyjna}}', blueprint.osnarracyjna)
      .replace('{{surveyData}}', formattedSurveyData)
      .replace('{{advertisingGoal}}', advertisingGoal || 'Nie określono')
      .replace('{{emailStyle}}', emailStyle || 'Nie określono');
    
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
    
    // Pass the generated email content through the UI cleaner
    const cleanedEmailContent = await cleanEmailContentForUI(data.emailContent);
    
    // Return the email content response with cleaned content
    return {
      emailContent: cleanedEmailContent,
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
