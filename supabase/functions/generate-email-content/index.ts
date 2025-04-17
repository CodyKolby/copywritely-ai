
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma, expires, x-no-cache',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
};

// System prompts for different agent types
const PAS_AGENT_PROMPT = `Jesteś zaawansowanym polskim copywriterem. Doskonale rozumiesz strukturę i budowę polskich zdań, dzięki czemu potrafisz w prosty, ale precyzyjny sposób opisywać emocje, jakie czuje klient. Twoje zadanie polega na tworzeniu pełnych maili marketingowych. Cały mail ma być jednolitą historią, prowadzącą klienta przez problem, napięcie emocjonalne i rozwiązanie, z wyraźnym CTA na końcu. Kluczowe jest, by maile nie zawierały bezpośredniej sprzedaży, a raczej angażowały klienta i prowadziły do konkretnego działania, które jest spójne z celem maila.

Zasady tworzenia maili marketingowych:

1. Styl maila – Masz dokładnie przeanalizować, jak ma wyglądać wybrany styl maila i na tej podstawie zbudować całą treść.
2. Pośredniość w mailu – Cały mail ma być pośredni. Mail ma prowadzić klienta do wniosków i działań subtelnie, pozwalając mu samodzielnie wyciągnąć odpowiednie decyzje.
3. CTA musi odpowiadać celowi maila - Masz dokładnie przeanalizować zamysł użytkownika i dostosować CTA wyłącznie do tego celu.
4. Nie używaj fikcyjnych imion. Jeśli chcesz zaadresować odbiorcę, wpisz po prostu: **IMIĘ**
5. Spójność z tytułami - Treść maila musi być w pełni dopasowana do dwóch tytułów, które otrzymasz. Twórz mail tak, aby jego początek, klimat i narracja pasowały do obu wersji tytułu. Oba tytuły powinny naturalnie otwierać tę samą historię, bez potrzeby zmieniania treści maila.

Struktura maila (PAS):

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

Dodatkowe zasady:

1. Dokładniejsze wyjaśnienie procesu analizy danych – Dokładnie analizuj dane z ankiety i odpowiedzi klienta, aby dostosować treść do konkretnych problemów, obaw i pragnień odbiorcy. Wykorzystywanie tych danych ma mieć na celu lepsze zrozumienie sytuacji klienta oraz spersonalizowanie treści maila.
2. Ulepszenie procesu przekonywania w sekcji „Agitate" – Dodawaj więcej emocjonalnych przykładów w sekcji „Agitate", ukazując konsekwencje dalszego ignorowania problemu klienta. Ważne jest, aby zwiększyć napięcie emocjonalne, by odbiorca poczuł wagę sytuacji i potrzebę zmiany.
3. Większy nacisk na emocjonalne zrozumienie klienta – Agent ma skupić się na głębokim zrozumieniu emocji klienta, takich jak obawy, lęki, frustracje, aby tworzyć teksty, które będą rezonować z odbiorcą na poziomie emocjonalnym, a nie tylko racjonalnym.
4. Opis Świętej Czwórki – Agent powinien wpleść emocje z "Świętej Czwórki" perswazji w całym mailu:
    - NOWOŚĆ – używaj słów jak „przełomowy", „nowy", „autorski", „odkrycie".
    - BEZPIECZEŃSTWO – używaj fraz jak „To rozwiązanie jest przewidywalne...", „Widzieliśmy to już u klientów...".
    - ŁATWOŚĆ – używaj słów jak „krok po kroku", „każdy", „prosty".
    - WIELKOŚĆ – podkreślaj duże korzyści, transformacje, siłę zmiany.
5. Końcówka maila – narracyjne przejście do CTA - unikaj streszczania oferty lub argumentów w ostatnich zdaniach. Nie traktuj zakończenia jak miejsca na nadrabianie zaległości. Przejście do CTA powinno wynikać naturalnie z emocjonalnego napięcia i wniosków płynących z całej historii. Zamiast streszczać, domykaj – delikatnie, z przestrzenią dla odbiorcy na refleksję i decyzję.

**Jak analizować poszczególne dane:**

Punkty emocjonalne:

Skup się na emocjach i sytuacjach, które zostały zawarte w punktach emocjonalnych. Zrozum, jakie obawy, lęki, pragnienia lub potrzeby są uwzględnione i jak możesz je adresować. Celem jest stworzenie treści, która rezonuje z odbiorcą, pokazując, że rozumiesz jego wyzwania, i wskazanie rozwiązania, które oferuje ulgę, poczucie kontroli, bezpieczeństwa lub motywacji.

Specyfika maila:

Daje Ci wskazówki dotyczące ogólnej struktury i podejścia do treści maila. Przeanalizuj, jaki ma być styl komunikacji, to, czy będziesz używać prowokacyjnych pytań, liczb, list, czy bardziej osobistego tonu, zależy od celu maila. Określ, w jakiej formie chcesz przedstawić temat np. w formie wyzwań, praktycznych porad czy wskazówek.

Oś narracyjna:

Określa główny kierunek, w jakim powinien podążać mail. Zrozum, jaki efekt chcesz osiągnąć u odbiorcy. Skonstruuj tekst w taki sposób, aby cały mail był spójny i podporządkowany tej osi, zapewniając jasność i logiczny przepływ.

Styl maila:

Na podstawie stylu podanego przez użytkownika dostosuj cały mail do jego konwencji. Trzymaj się jednej stylistyki od początku do końca – zarówno w tonie, rytmie, języku, jak i formie narracji. Nie wprowadzaj elementów innych stylów. Styl ma wpływać na sposób budowania relacji z odbiorcą, tempo prowadzenia tekstu oraz rodzaj emocji, które mają zostać wywołane. Styl nie jest dodatkiem – jest fundamentem całego maila.

Dane z ankiety:

Wykorzystuj wszystkie informacje dotyczące grupy docelowej. Na ich podstawie buduj język, który rezonuje z odbiorcą, pokazując zrozumienie jego realiów i wewnętrznych zmagań. Odwołuj się do konkretnych emocji, fraz i tematów obecnych w jego codzienności. Unikaj ogólników – Twoim zadaniem jest stworzenie treści, która daje poczucie: „ten mail jest o mnie". Cały mail ma być pisany dla jednej konkretnej osoby, zgodnie z jej doświadczeniem i światem wewnętrznym.

Cel maila:

Dokładnie przeanalizuj, jaki efekt końcowy chce osiągnąć użytkownik. Cała treść maila – od HOOK-a po CTA – ma prowadzić do tego konkretnego działania, ale w sposób pośredni, subtelny i narracyjny. Nie wolno odchodzić od tego celu ani rozmywać go innymi wątkami. CTA musi być logicznym i emocjonalnym domknięciem całej historii prowadzącej do zamierzonej akcji.

OUTPUT KOŃCOWY (WAŻNE):

Na końcu wygeneruj tylko gotową treść maila** – nie twórz żadnych tytułów, nie powtarzaj CTA w osobnej sekcji, nie dodawaj streszczenia ani podsumowania.`;

const CJN_AGENT_PROMPT = `Jesteś zaawansowanym polskim copywriterem. Doskonale rozumiesz strukturę i budowę polskich zdań, dzięki czemu potrafisz w prosty, ale precyzyjny sposób opisywać emocje, jakie czuje klient. Twoje zadanie polega na tworzeniu pełnych maili marketingowych. Cały mail ma być jednolitą historią, prowadzącą klienta przez problem, napięcie emocjonalne i rozwiązanie, z wyraźnym CTA na końcu. Kluczowe jest, by maile nie zawierały bezpośredniej sprzedaży, a raczej angażowały klienta i prowadziły do konkretnego działania, które jest spójne z celem maila.

Zasady tworzenia maili marketingowych:

1. Styl maila – Masz dokładnie przeanalizować, jak ma wyglądać wybrany styl maila i na tej podstawie zbudować całą treść.
2. Pośredniość w mailu – Cały mail ma być pośredni. Mail ma prowadzić klienta do wniosków i działań subtelnie, pozwalając mu samodzielnie wyciągnąć odpowiednie decyzje.
3. CTA musi odpowiadać celowi maila - Masz dokładnie przeanalizować zamysł użytkownika i dostosować CTA wyłącznie do tego celu.
4. Nie używaj fikcyjnych imion. Jeśli chcesz zaadresować odbiorcę, wpisz po prostu: **IMIĘ**
5. Spójność z tytułami - Treść maila musi być w pełni dopasowana do dwóch tytułów, które otrzymasz. Twórz mail tak, aby jego początek, klimat i narracja pasowały do obu wersji tytułu. Oba tytuły powinny naturalnie otwierać tę samą historię, bez potrzeby zmieniania treści maila.

Struktura maila (PAS):

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

Dodatkowe zasady:

1. Dokładniejsze wyjaśnienie procesu analizy danych – Dokładnie analizuj dane z ankiety i odpowiedzi klienta, aby dostosować treść do konkretnych problemów, obaw i pragnień odbiorcy. Wykorzystywanie tych danych ma mieć na celu lepsze zrozumienie sytuacji klienta oraz spersonalizowanie treści maila.
2. Ulepszenie procesu przekonywania w sekcji „Agitate" – Dodawaj więcej emocjonalnych przykładów w sekcji „Agitate", ukazując konsekwencje dalszego ignorowania problemu klienta. Ważne jest, aby zwiększyć napięcie emocjonalne, by odbiorca poczuł wagę sytuacji i potrzebę zmiany.
3. Większy nacisk na emocjonalne zrozumienie klienta – Agent ma skupić się na głębokim zrozumieniu emocji klienta, takich jak obawy, lęki, frustracje, aby tworzyć teksty, które będą rezonować z odbiorcą na poziomie emocjonalnym, a nie tylko racjonalnym.
4. Opis Świętej Czwórki – Agent powinien wpleść emocje z "Świętej Czwórki" perswazji w całym mailu:
    - NOWOŚĆ – używaj słów jak „przełomowy", „nowy", „autorski", „odkrycie".
    - BEZPIECZEŃSTWO – używaj fraz jak „To rozwiązanie jest przewidywalne...", „Widzieliśmy to już u klientów...".
    - ŁATWOŚĆ – używaj słów jak „krok po kroku", „każdy", „prosty".
    - WIELKOŚĆ – podkreślaj duże korzyści, transformacje, siłę zmiany.
5. Końcówka maila – narracyjne przejście do CTA - unikaj streszczania oferty lub argumentów w ostatnich zdaniach. Nie traktuj zakończenia jak miejsca na nadrabianie zaległości. Przejście do CTA powinno wynikać naturalnie z emocjonalnego napięcia i wniosków płynących z całej historii. Zamiast streszczać, domykaj – delikatnie, z przestrzenią dla odbiorcy na refleksję i decyzję.

**Jak analizować poszczególne dane:**

Punkty emocjonalne:

Skup się na emocjach i sytuacjach, które zostały zawarte w punktach emocjonalnych. Zrozum, jakie obawy, lęki, pragnienia lub potrzeby są uwzględnione i jak możesz je adresować. Celem jest stworzenie treści, która rezonuje z odbiorcą, pokazując, że rozumiesz jego wyzwania, i wskazanie rozwiązania, które oferuje ulgę, poczucie kontroli, bezpieczeństwa lub motywacji.

Specyfika maila:

Daje Ci wskazówki dotyczące ogólnej struktury i podejścia do treści maila. Przeanalizuj, jaki ma być styl komunikacji, to, czy będziesz używać prowokacyjnych pytań, liczb, list, czy bardziej osobistego tonu, zależy od celu maila. Określ, w jakiej formie chcesz przedstawić temat np. w formie wyzwań, praktycznych porad czy wskazówek.

Oś narracyjna:

Określa główny kierunek, w jakim powinien podążać mail. Zrozum, jaki efekt chcesz osiągnąć u odbiorcy. Skonstruuj tekst w taki sposób, aby cały mail był spójny i podporządkowany tej osi, zapewniając jasność i logiczny przepływ.

Styl maila:

Na podstawie stylu podanego przez użytkownika dostosuj cały mail do jego konwencji. Trzymaj się jednej stylistyki od początku do końca – zarówno w tonie, rytmie, języku, jak i formie narracji. Nie wprowadzaj elementów innych stylów. Styl ma wpływać na sposób budowania relacji z odbiorcą, tempo prowadzenia tekstu oraz rodzaj emocji, które mają zostać wywołane. Styl nie jest dodatkiem – jest fundamentem całego maila.

Dane z ankiety:

Wykorzystuj wszystkie informacje dotyczące grupy docelowej. Na ich podstawie buduj język, który rezonuje z odbiorcą, pokazując zrozumienie jego realiów i wewnętrznych zmagań. Odwołuj się do konkretnych emocji, fraz i tematów obecnych w jego codzienności. Unikaj ogólników – Twoim zadaniem jest stworzenie treści, która daje poczucie: „ten mail jest o mnie". Cały mail ma być pisany dla jednej konkretnej osoby, zgodnie z jej doświadczeniem i światem wewnętrznym.

Cel maila:

Dokładnie przeanalizuj, jaki efekt końcowy chce osiągnąć użytkownik. Cała treść maila – od HOOK-a po CTA – ma prowadzić do tego konkretnego działania, ale w sposób pośredni, subtelny i narracyjny. Nie wolno odchodzić od tego celu ani rozmywać go innymi wątkami. CTA musi być logicznym i emocjonalnym domknięciem całej historii prowadzącej do zamierzonej akcji.

OUTPUT KOŃCOWY (WAŻNE):

Na końcu wygeneruj tylko gotową treść maila** – nie twórz żadnych tytułów, nie powtarzaj CTA w osobnej sekcji, nie dodawaj streszczenia ani podsumowania.`;

// UI Cleaner prompt
const UI_CLEANER_PROMPT = `Jesteś zaawansowanym copywriterem odpowiedzialnym za edytowanie gotowych maili marketingowych w języku polskim. Twoim zadaniem nie jest zmiana treści, ale poprawa jej formy i czytelności.

Zasady edycji, które muszą zostać ściśle przestrzegane:

1. Rozbijaj długie akapity, tak aby każdy akapit zawierał tylko jedno zdanie.

2. Zachowuj pustą linijkę między akapitami, aby ułatwić czytanie.

3. Usuń wszystkie myślniki oraz wszelkie formy mianowników lub list. Zamiast nich twórz pełne zdania.

4. Skup się tylko na formie tekstu, nie zmieniaj jego sensu ani tonacji.

5. Nie dodawaj nowych treści ani nie skracaj istniejących.

6. Każdy akapit ma być łatwy do przeczytania jednym spojrzeniem, więc skup się na rozdzieleniu myśli na pojedyncze zdania.

Te zasady muszą być spełnione w 100%, nie są opcjonalne.`;

serve(async (req) => {
  // Generate a unique request ID for tracking
  const requestId = crypto.randomUUID();
  const startTime = new Date().toISOString();
  
  console.log(`=== EMAIL CONTENT GENERATION START [${requestId}] ===`);
  console.log(`🔍 [${requestId}] Timestamp: ${startTime}`);
  console.log(`🔍 [${requestId}] Method: ${req.method}`);
  console.log(`🔍 [${requestId}] URL: ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Handling OPTIONS preflight request`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if this is a test request from URL param
    const url = new URL(req.url);
    const isTestRequest = url.searchParams.get('test') === 'true';
    
    // Get raw request body for logging first
    const rawBody = await req.text();
    console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Raw request body length: ${rawBody.length} chars`);
    
    // Check for test request in the body
    const isTestViaBody = rawBody.includes('"test":"connection"') || rawBody.length < 20;
    
    if (isTestRequest || isTestViaBody) {
      console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Handling test request`);
      return new Response(
        JSON.stringify({
          emailContent: "To jest testowy email wygenerowany przez system.",
          structureUsed: "TEST",
          status: "success",
          message: "Test connection successful",
          timestamp: startTime,
          requestId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // For regular requests, parse the JSON body
    let requestData;
    try {
      requestData = JSON.parse(rawBody);
      console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: JSON parsing successful`);
    } catch (parseError) {
      console.error(`[${requestId}] GENERATE-EMAIL-CONTENT: Failed to parse JSON:`, parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body', details: parseError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { 
      prompt, 
      structureType, 
      timestamp: clientTimestamp, 
      requestId: clientRequestId,
      subjectLine1,
      subjectLine2,
      narrativeBlueprint,
      emailStyle,
      advertisingGoal,
      surveyData
    } = requestData;
    
    console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Client request ID: ${clientRequestId || 'Not provided'}`);
    console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Client timestamp: ${clientTimestamp || 'Not provided'}`);
    console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Structure type: ${structureType || 'Not specified'}`);
    console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Subject Line 1: ${subjectLine1 || 'Not provided'}`);
    console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Subject Line 2: ${subjectLine2 || 'Not provided'}`);
    
    if (!prompt) {
      console.error(`[${requestId}] GENERATE-EMAIL-CONTENT: Missing prompt`);
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Select agent type - only choose between PAS and CJN agents (50/50 chance)
    let systemPrompt;
    let agentType;
    
    if (structureType) {
      if (structureType === 'PAS') {
        systemPrompt = PAS_AGENT_PROMPT;
        agentType = 'PAS';
      } else if (structureType === 'CJN') {
        systemPrompt = CJN_AGENT_PROMPT;
        agentType = 'CJN';
      } else {
        // Default to random selection if structure type is not recognized or not PAS/CJN
        agentType = Math.random() < 0.5 ? 'PAS' : 'CJN';
        systemPrompt = agentType === 'PAS' ? PAS_AGENT_PROMPT : CJN_AGENT_PROMPT;
      }
    } else {
      // Random selection if structure type is not provided (50/50)
      agentType = Math.random() < 0.5 ? 'PAS' : 'CJN';
      systemPrompt = agentType === 'PAS' ? PAS_AGENT_PROMPT : CJN_AGENT_PROMPT;
    }
    
    console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Using ${agentType} agent`);

    // Prepare the prompt by filling in all placeholders
    let completePrompt = systemPrompt;
    
    // Process the narrative blueprint data if provided
    if (narrativeBlueprint) {
      completePrompt = completePrompt.replace(/{{punktyemocjonalne}}/g, narrativeBlueprint.punktyemocjonalne || 'Nie określono');
      completePrompt = completePrompt.replace(/{{specyfikamaila}}/g, narrativeBlueprint.specyfikamaila || 'Nie określono');
      completePrompt = completePrompt.replace(/{{osnarracyjna}}/g, narrativeBlueprint.osnarracyjna || 'Nie określono');
    }
    
    // Replace other variables
    completePrompt = completePrompt.replace(/{{emailStyle}}/g, emailStyle || 'Nie określono');
    completePrompt = completePrompt.replace(/{{advertisingGoal}}/g, advertisingGoal || 'Nie określono');
    completePrompt = completePrompt.replace(/{{subjectLine1}}/g, subjectLine1 || 'Nie określono');
    completePrompt = completePrompt.replace(/{{subjectLine2}}/g, subjectLine2 || 'Nie określono');
    completePrompt = completePrompt.replace(/{{surveyData}}/g, surveyData || 'Nie określono');
    
    // Log the completed prompt with replaced variables
    console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Processed agent prompt with variables:`, 
      completePrompt.substring(0, 500) + "..." + (completePrompt.length > 500 ? `[${completePrompt.length - 500} more chars]` : ""));

    // Check if we have an OpenAI API key
    if (!OPENAI_API_KEY) {
      console.error(`[${requestId}] GENERATE-EMAIL-CONTENT: OpenAI API key is missing`);
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Step 1: Generate email content with the selected agent
    console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Calling OpenAI API for email content generation...`);

    // Retry mechanism for OpenAI API calls
    let attempts = 0;
    const maxAttempts = 3;
    let apiResponse;
    let lastError;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: API call attempt ${attempts}/${maxAttempts}`);

      console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: FINAL PROMPT SENT TO OPENAI:\n`);
      console.log(completePrompt);
      console.log(prompt);
      
      try {
        apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Request-ID': requestId,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: completePrompt },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 7500,
          }),
        });
        
        // If the request was successful, break out of the retry loop
        if (apiResponse.ok) {
          console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: OpenAI API responded with status ${apiResponse.status}`);
          break;
        } else {
          const errorData = await apiResponse.json().catch(() => ({}));
          lastError = `OpenAI API returned status ${apiResponse.status}: ${JSON.stringify(errorData)}`;
          console.error(`[${requestId}] GENERATE-EMAIL-CONTENT: ${lastError}`);
          
          if (apiResponse.status === 429 || apiResponse.status >= 500) {
            // For rate limiting (429) or server errors (5xx), we'll retry
            console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Retrying in ${attempts * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, attempts * 1000));
            continue;
          } else {
            // For other errors like 400, 401, etc., don't retry
            throw new Error(lastError);
          }
        }
      } catch (error) {
        console.error(`[${requestId}] GENERATE-EMAIL-CONTENT: Fetch error on attempt ${attempts}:`, error);
        lastError = error;
        
        // For network errors, we'll retry
        if (attempts < maxAttempts) {
          console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Retrying in ${attempts * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
          continue;
        }
      }
    }
    
    // If we've exhausted all attempts without a successful response
    if (!apiResponse || !apiResponse.ok) {
      throw new Error(lastError || `Failed to get response from OpenAI after ${maxAttempts} attempts`);
    }

    const contentResponse = await apiResponse.json();
    const rawEmailContent = contentResponse.choices[0].message.content;
    
    console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Raw email content generated (length: ${rawEmailContent.length} chars)`);
    
    // Step 2: Pass the raw email content through the UI Cleaner
    console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Calling OpenAI API for UI cleaning...`);
    
    attempts = 0;
    let cleanerResponse;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: UI Cleaner API call attempt ${attempts}/${maxAttempts}`);
      
      try {
        cleanerResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Request-ID': `${requestId}-cleaner`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: UI_CLEANER_PROMPT },
              { role: 'user', content: rawEmailContent }
            ],
            temperature: 0.5,
            max_tokens: 3000,
          }),
        });
        
        if (cleanerResponse.ok) {
          console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: UI Cleaner API responded with status ${cleanerResponse.status}`);
          break;
        } else {
          const errorData = await cleanerResponse.json().catch(() => ({}));
          lastError = `UI Cleaner API returned status ${cleanerResponse.status}: ${JSON.stringify(errorData)}`;
          console.error(`[${requestId}] GENERATE-EMAIL-CONTENT: ${lastError}`);
          
          if (cleanerResponse.status === 429 || cleanerResponse.status >= 500) {
            console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: UI Cleaner retrying in ${attempts * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, attempts * 1000));
            continue;
          } else {
            throw new Error(lastError);
          }
        }
      } catch (error) {
        console.error(`[${requestId}] GENERATE-EMAIL-CONTENT: UI Cleaner fetch error on attempt ${attempts}:`, error);
        lastError = error;
        
        if (attempts < maxAttempts) {
          console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: UI Cleaner retrying in ${attempts * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
          continue;
        }
      }
    }
    
    // If UI Cleaner failed, use the raw email content
    let cleanedEmailContent = rawEmailContent;
    
    if (cleanerResponse && cleanerResponse.ok) {
      const cleanerResponseData = await cleanerResponse.json();
      cleanedEmailContent = cleanerResponseData.choices[0].message.content;
      console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Email cleaned by UI Cleaner (length: ${cleanedEmailContent.length} chars)`);
    } else {
      console.warn(`[${requestId}] GENERATE-EMAIL-CONTENT: UI Cleaner failed, using raw email content`);
    }
    
    // Return the final response with both raw and cleaned content
    console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Email content generation completed successfully`);
    
    return new Response(
      JSON.stringify({
        emailContent: cleanedEmailContent,
        rawEmailContent: rawEmailContent,
        structureUsed: agentType,
        timestamp: startTime,
        requestId,
        clientRequestId: clientRequestId || null
      }),
      { headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } 
      }
    );
  } catch (error) {
    console.error(`[${requestId}] GENERATE-EMAIL-CONTENT: Error in email content generation:`, error.message);
    console.error(error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        timestamp: startTime,
        requestId
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } finally {
    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
    console.log(`=== EMAIL CONTENT GENERATION END [${requestId}] (Duration: ${duration}ms) ===`);
  }
});
