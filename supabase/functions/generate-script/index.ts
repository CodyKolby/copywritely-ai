
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuration
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://jorbqjareswzdrsmepbv.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// CORS Headers - rozszerzone, aby obsługiwać cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  console.log("Otrzymano zapytanie do generate-script:", req.method, req.url);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log("Obsługa zapytania preflight OPTIONS");
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    console.log("Przetwarzanie zapytania POST");
    
    // Parse request data
    const requestData = await req.json();
    const templateId = requestData.templateId;
    const targetAudienceId = requestData.targetAudienceId;
    const debugInfo = requestData.debugInfo !== false; // Domyślnie true
    
    console.log("Odebrane dane:", JSON.stringify({ templateId, targetAudienceId, debugInfo }));
    
    // Validate input data
    if (!templateId || !targetAudienceId) {
      console.error("Brak wymaganych danych:", { templateId, targetAudienceId });
      return new Response(
        JSON.stringify({ error: 'Brak wymaganych danych (templateId, targetAudienceId)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generowanie skryptu dla szablonu:', templateId);
    console.log('ID grupy docelowej:', targetAudienceId);
    
    // Validate Service Role Key
    if (!supabaseServiceKey) {
      console.error('Brak Service Role Key do autoryzacji bazy danych');
      return new Response(
        JSON.stringify({ 
          error: 'Brak skonfigurowanego klucza Service Role',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch target audience data directly from database using fetch
    console.log("Pobieranie danych grupy docelowej z URL:", `${supabaseUrl}/rest/v1/target_audiences?id=eq.${targetAudienceId}`);
    
    const dbResponse = await fetch(
      `${supabaseUrl}/rest/v1/target_audiences?id=eq.${targetAudienceId}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!dbResponse.ok) {
      console.error('Błąd zapytania do bazy danych:', dbResponse.status);
      return new Response(
        JSON.stringify({ 
          error: 'Błąd zapytania do bazy danych', 
          status: dbResponse.status 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const audienceData = await dbResponse.json();
    console.log("Odpowiedź z bazy danych:", JSON.stringify(audienceData));
    
    // Check if audience exists
    if (!audienceData || audienceData.length === 0) {
      console.error('Nie znaleziono grupy docelowej o ID:', targetAudienceId);
      
      return new Response(
        JSON.stringify({ 
          error: 'Nie znaleziono grupy docelowej',
          details: { targetAudienceId }
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const targetAudienceData = audienceData[0];
    console.log('Pobrano dane grupy docelowej:', targetAudienceData.name || 'Bez nazwy');
    
    // Format audience data for prompt
    const audienceDescription = formatAudienceDetails(targetAudienceData);
    
    // Get appropriate system prompt - zawsze używa tego samego promptu, niezależnie od templateId
    const systemPrompt = getSystemPromptForTemplate();
    
    // Validate OpenAI API key
    if (!openAIApiKey) {
      console.error('Brak klucza API OpenAI');
      
      return new Response(
        JSON.stringify({ 
          error: 'Brak skonfigurowanego klucza OpenAI API',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Dodaję rozszerzone logi z pełną zawartością prompta
    console.log('===== PEŁNY SYSTEM PROMPT =====');
    console.log(systemPrompt);
    console.log('=============================');
    
    console.log('===== PEŁNY USER PROMPT (audienceDescription) =====');
    console.log(audienceDescription);
    console.log('=============================');
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: audienceDescription }
    ];
    
    console.log('===== PEŁNA STRUKTURA WIADOMOŚCI DO OPENAI =====');
    console.log(JSON.stringify({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
    }, null, 2));
    console.log('=============================');
    
    // Call OpenAI API
    console.log('📢 Wysyłam zapytanie do OpenAI');
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Błąd API OpenAI:', {
          status: response.status,
          data: errorData
        });
        
        return new Response(
          JSON.stringify({ 
            error: 'Błąd API OpenAI',
            details: errorData
          }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Parse response
      const data = await response.json();
      console.log('📢 Dostałem odpowiedź z OpenAI:', {
        model: data.model,
        usage: data.usage,
        id: data.id
      });
      
      console.log('===== PEŁNA ODPOWIEDŹ Z OPENAI =====');
      console.log(JSON.stringify(data, null, 2));
      console.log('=============================');
      
      const generatedScript = data.choices[0].message.content;
      
      // Dodajemy dane debugowania do odpowiedzi
      const responseData = {
        script: generatedScript,
        debug: {
          systemPrompt: systemPrompt,
          userPrompt: audienceDescription,
          fullPrompt: {
            model: 'gpt-4o-mini',
            messages: messages,
            temperature: 0.7
          },
          response: {
            model: data.model,
            usage: data.usage
          }
        }
      };
      
      return new Response(
        JSON.stringify(responseData),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (openaiError) {
      console.error('Błąd podczas komunikacji z OpenAI:', openaiError);
      
      return new Response(
        JSON.stringify({ 
          error: 'Błąd komunikacji z OpenAI',
          details: openaiError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error) {
    console.error('Nieobsłużony błąd w funkcji generate-script:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Nieoczekiwany błąd',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Function for formatting target audience data
function formatAudienceDetails(audience) {
  if (!audience) return "Brak danych o grupie docelowej.";
  
  let details = "# Informacje o grupie docelowej\n\n";
  
  // Basic demographic data
  if (audience.age_range) details += `Wiek: ${audience.age_range}\n`;
  if (audience.gender) details += `Płeć: ${audience.gender}\n\n`;
  
  // Main offer
  if (audience.main_offer) details += `## Główna oferta\n${audience.main_offer}\n\n`;
  
  // Offer details
  if (audience.offer_details) details += `## Szczegóły oferty\n${audience.offer_details}\n\n`;
  
  // Customer problems
  if (audience.pains && audience.pains.length > 0) {
    details += "## Problemy klientów\n";
    audience.pains.forEach((pain, index) => {
      if (pain) details += `${index + 1}. ${pain}\n`;
    });
    details += "\n";
  }
  
  // Desires
  if (audience.desires && audience.desires.length > 0) {
    details += "## Pragnienia klientów\n";
    audience.desires.forEach((desire, index) => {
      if (desire) details += `${index + 1}. ${desire}\n`;
    });
    details += "\n";
  }
  
  // Benefits
  if (audience.benefits && audience.benefits.length > 0) {
    details += "## Korzyści produktu/usługi\n";
    audience.benefits.forEach((benefit, index) => {
      if (benefit) details += `${index + 1}. ${benefit}\n`;
    });
    details += "\n";
  }
  
  // Customer language
  if (audience.language) details += `## Język klienta\n${audience.language}\n\n`;
  
  // Beliefs
  if (audience.beliefs) details += `## Przekonania do zbudowania\n${audience.beliefs}\n\n`;
  
  // Biography
  if (audience.biography) details += `## Biografia klienta\n${audience.biography}\n\n`;
  
  // Competition
  if (audience.competitors && audience.competitors.length > 0) {
    details += "## Konkurencja\n";
    audience.competitors.forEach((competitor, index) => {
      if (competitor) details += `${index + 1}. ${competitor}\n`;
    });
    details += "\n";
  }
  
  // Why it works
  if (audience.why_it_works) details += `## Dlaczego produkt/usługa działa\n${audience.why_it_works}\n\n`;
  
  // Experience
  if (audience.experience) details += `## Doświadczenie sprzedawcy\n${audience.experience}\n\n`;
  
  return details;
}

// Function for selecting system prompt - UPDATED with new prompt content
function getSystemPromptForTemplate() {
  // Nowy prompt zgodnie z żądaniem użytkownika
  return `Jesteś copywriterem specjalizującym się w tworzeniu hooków reklamowych, które brzmią jak wewnętrzna myśl klienta.  
Twoje teksty są szczere, konkretne, trafne emocjonalnie i pisane jak do jednego człowieka, nie tłumu.  
Nie używasz ogólników ani modnych haseł.  
Twoim celem jest sprawić, by klient poczuł się rozumiany, zatrzymał się na reklamie i pomyślał:  
„O rany… to ja.”  
Na podstawie danych z ankiety, tworzysz 3–5 mocnych hooków, które trafiają w sedno jego aktualnej sytuacji emocjonalnej i tematu oferty.

ZASADY TWORZENIA HOOKA:

1. Silne emocje (ból, frustracja, pragnienie, tęsknota).  
   Hook ma trafiać w to, co klient naprawdę czuje, a nie tylko logicznie rozumie. Piszesz tak, jakbyś znał jego myśli.

2. Forma otwarcia: pełne pytanie lub jednozdaniowa teza.  
   Najczęściej:  
   - „Czy masz już dość…?”  
   - „Jeśli jesteś… i…”  
   - „Przestań wierzyć w…”  
   - „Jeśli dalej myślisz, że…”  
   Unikaj: „co, jeśli…”, „wyobraź sobie…”, „zastanawiałeś się…”, „to nie przypadek…”, „wiem, co czujesz…”

3. Hook jest pośredni – nie zdradzaj oferty ani produktu.  
   Masz tylko zaintrygować i sprawić, że odbiorca pomyśli: „To dokładnie o mnie!”. Nie pisz o rozwiązaniu.

4. Używaj dokładnego języka z ankiety.  
   Nie zamieniaj słów klienta na synonimy. Wplataj konkretne zwroty, emocje i potoczne frazy. Jeśli klient mówi: „czuję się, jakby coś mnie blokowało” – użyj dokładnie tego.

5. Brzmi jak wewnętrzna myśl klienta.  
   Hook powinien brzmieć jak coś, co klient mógłby powiedzieć bliskiej osobie albo pomyśleć w samotności o 23:41.

6. Unikaj zaczynania „w połowie zdania”.  
   Nie zaczynaj od: „Codziennie budzisz się…”, „Ciągłe zmęczenie…”, „Brak motywacji…”.  
   Zacznij jak od pierwszego zdania rozmowy – z pełnym podmiotem. Przykłady poprawnych startów:  
   - „Czy masz dość tego, że…”  
   - „Jeśli jesteś kobietą po 30…”  
   - „Przestań wierzyć, że…”

7. Mów zawsze do jednej osoby.  
   Nie pisz: „kobiety po 30-tce…”, tylko: „jeśli jesteś kobietą po 30-tce…”.

8. Jeden hook = jedno pełne, płynne zdanie. Max 30 słów.  
   Nigdy nie używaj myślników (–), średników, dwóch przecinków ani struktur typu „pierwsza część – druga część”.  
   Nie pisz dwóch różnych myśli połączonych w jednym zdaniu. Jeśli można zdanie rozdzielić na dwa osobne komunikaty – to znaczy, że hook jest źle napisany.  
   Nie twórz konstrukcji typu: „Jeśli czujesz X, to czas na Y” – to brzmi jak hasło kończące reklamę.  
   Zdanie ma mieć jedną emocję, jeden tor myślowy i jeden kierunek.  
   Całość musi się czytać naturalnie i rytmicznie, jak jedna wewnętrzna myśl klienta, bez przeskoków.

9. Pisz prostym językiem – tak, by zrozumiał to nawet 5-latek.  
   Unikaj trudnych słów, metafor, abstrakcji i poetyckich porównań.  
   Nie używaj fraz typu: „ciało jak obce terytorium”, „otul siebie miłością”, „wewnętrzne światło”, „niezdefiniowany ciężar”.  
   Hook ma być krótki, jasny i zrozumiały – tak, żeby każdy wiedział, o co chodzi bez zastanawiania się.

10. Hook to początek rozmowy, nie slogan.  
    Hook nie może brzmieć jak zakończenie spotu reklamowego, motto motywacyjne ani „złota myśl”.  
    Unikaj zwrotów typu: „to czas, by…”, „od teraz wszystko się zmienia”, „czas działać”.  
    Nie pisz hooków, które wyglądają jak hasło na kubek lub pod zdjęcie z Instagrama.  
    Hook ma otwierać temat, nie go zamykać.  
    Nie kończ hooka ogólnym hasłem w stylu:  
    - „poczuj się jak księżniczka”  
    - „czas na prawdziwą zmianę”  
    - „to może być moment, by to zmienić”  
    - „jesteś tego warta”  
    Zakończenie hooka powinno podkręcać emocję i zostawiać przestrzeń na rozwinięcie, zamiast je zamykać.

11. Unikaj korpomowy i lania wody.  
    Hook ma być ludzki, szczery, emocjonalny. Żadnych słów w stylu „transformacja”, „autentyczna ekspresja” ani „bogini” – chyba że padają wprost z ankiety.

12. Wzmacniaj hooki za pomocą czterech głównych emocji:  
    - Nowość lub Jedyność  
    - Łatwość lub Dostępność  
    - Bezpieczeństwo lub Przewidywalność  
    - Wielkość lub Szybkość  
    To nie musi być napisane wprost – wystarczy, że to czuć w emocji hooka.

13. Nie używaj utartych haseł i generycznych sformułowań.  
    Unikaj fraz typu „brak spełnienia”, „niskie poczucie własnej wartości”. Pisz konkretnie: „czujesz się winna, kiedy chcesz odpocząć”, „boisz się powiedzieć, co naprawdę myślisz”.

14. Jeśli hook zawiera pytanie, zadbaj o to, by klient pomyślał: „Kurwa, tak.”  
    Hooki nie mogą być ogólne. Mają wywoływać zgodę wewnętrzną i rezonans z emocją tu i teraz.

15. Styl hooka zależy od tonu klienta.  
    Jeśli klient lubi bezpośredni styl (np. śledzi Andrew Tate’a), możesz być mocniejszy. Jeśli preferuje ciepło i łagodność – dopasuj styl do jej/jego energii.

16. Trafiaj precyzyjnie – nie pisz hooków, które pasują do każdego.  
    Unikaj ogólników, które można odnieść do wszystkich.  
    Hook musi sprawiać, że osoba z danej grupy poczuje się wywołana po imieniu.  
    Używaj konstrukcji typu: „jeśli jesteś kobietą, która…”, „jeśli jesteś mamą i…”, „jeśli masz 35 lat i…”.

17. Temat hooka musi być spójny z ofertą klienta.  
    Nawet jeśli hook jest pośredni – musi nakierowywać odbiorcę na temat reklamy.  
    Nie pisz hooków o wyglądzie, jeśli oferta dotyczy np. energii i zdrowia psychicznego.  
    Najpierw zrozum, na czym polega oferta i jakiego rodzaju zmianę obiecuje. Potem dobieraj pain pointy, które prowadzą w tym kierunku.

18. Gramatyka musi być naturalna i poprawna – jakby mówił to realny człowiek.  
    Unikaj sztucznych lub pokracznych konstrukcji.  
    Hook ma brzmieć jak wewnętrzny monolog klienta, a nie jak przetłumaczone zdanie z angielskiego.  
    Unikaj zbitek czasowników. Zawsze czytaj hook tak, jakbyś wypowiadał go komuś na głos.

19. Hook musi mieć sens i logiczny przepływ.  
    Nie zestawiaj emocji, które nie mają ze sobą logicznego związku.  
    Jeśli opisujesz problem (np. apatię, wstyd, brak energii) – to druga część musi wynikać z tego problemu, nie być losową aspiracją.  
    Hook musi brzmieć jak naturalna wypowiedź człowieka, a nie zlepek ładnych haseł.

NA CO ZWRÓCIĆ SZCZEGÓLNĄ UWAGĘ W DANYCH Z ANKIETY:

1. Wiek  
   Dopasuj styl komunikacji do wieku klienta: luźniejszy dla młodszych, bardziej stonowany i dojrzały dla starszych.

2. Płeć  
   Używaj właściwych końcówek i form gramatycznych, np. „jeśli jesteś kobietą…”, a nie „kobiety często…”.

3. Specyficzny język  
   Jeśli klient używa charakterystycznych zwrotów lub słów – wpleć je w hooki, gdy to możliwe.

4. Biografia klienta / dzień codzienny  
   Zrozum, w jakich sytuacjach i emocjach żyje na co dzień. Dzięki temu hook może brzmieć jak jego własna myśl.

5. Punkty bólu i pragnienia  
   Najważniejsze pole. Buduj hooki na silnych emocjach: frustracjach, lękach, potrzebach i tęsknotach klienta.

6. Temat i charakter oferty  
   Zrozum, jaki efekt obiecuje oferta i na czym polega zmiana, którą proponuje klient.  
   Hooki nie mogą zdradzać rozwiązania, ale powinny emocjonalnie prowadzić w jego stronę.  
   Dobieraj problemy, przykłady i słowa, które są powiązane z tematem oferty.  
   Upewnij się, że hook pasuje do tego, co klient oferuje – nawet jeśli jest pośredni.

WYOBRAŹ SOBIE SYTUACJĘ:

Przed napisaniem każdego hooka, wejdź w skórę idealnego klienta (z ankiety).  
Co musi usłyszeć, żeby pomyśleć:  
„O rany… to ja.”  
I nie przewinąć tej reklamy?`;
}

