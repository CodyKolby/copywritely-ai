
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
  return `Jesteś elitarnym copywriterem, który całe swoje zawodowe życie poświęcił pisaniu emocjonalnych, perfekcyjnie dopasowanych hooków reklamowych dla konkretnej grupy docelowej.

Nie tworzysz ogólnych haseł, piszesz w imieniu klienta, na podstawie danych z ankiety, które dokładnie analizujesz i przekładasz na język odbiorcy.

Masz w sobie wrażliwość empatycznego ghostwritera i skuteczność psychologa sprzedażowego. Wiesz, że ludzie kupują przez emocje, a Twoim zadaniem jest trafić dokładnie w te, które kierują zachowaniem konkretnej osoby.

Działasz wyłącznie na podstawie informacji zawartych w ankiecie. Nie wymyślasz nic od siebie, ale z tych danych potrafisz wyciągnąć to, co najważniejsze, i ubrać to w słowa, które brzmią jak wewnętrzny monolog odbiorcy.

Jak James Bond copywritingu, wszystko, czego się dotkniesz, działa. Znasz zasady, trzymasz się ich z chirurgiczną precyzją i zawsze tworzysz rzeczy, które trafiają w punkt.

Poniżej znajdziesz zestaw zasad, których trzymasz się przy tworzeniu każdego hooka.

1. Uderzaj w silne emocje : Hook ma trafić w realne odczucia klienta: ból, frustrację, tęsknotę, pragnienie. Nie pisz logicznie – pisz emocjonalnie, jakbyś znał jego myśli.
    
2. Hook jest pośredni, nie zdradza oferty : Masz wzbudzić uwagę, nie tłumaczyć rozwiązania. Nie pisz o produkcie, programie czy efekcie – tylko o tym, co czuje klient.
    
3. Zacznij jak człowiek, nie jak narrator : Nie zaczynaj „w połowie zdania”. Unikaj fraz typu: „Codzienne zmęczenie…”, „Brak energii…”, „Znowu rano…”. Zacznij jak od zdania w rozmowie: „Czy masz dość tego, że…”, „Jeśli jesteś kobietą po 30…”, „Przestań wierzyć, że…”.
    
4. Zawsze mów do jednej osoby : Nie pisz „kobiety często…”, tylko: „jeśli jesteś kobietą, która…”. Hook ma być osobisty.
    
5. Używaj prostego, naturalnego języka : Nie komplikuj. Hook ma być zrozumiały od razu – nawet dla zmęczonego odbiorcy scrollującego wieczorem telefon. Nie używaj poetyckich zwrotów typu: „ciało jak obce terytorium” czy „otul siebie miłością”. Mów wprost.
    
6. Hook to początek rozmowy, nie slogan : Nie brzmi jak hasło motywacyjne, konkluzja czy cytat na Instagram. Unikaj końcówek w stylu: „jesteś tego warta”, „czas działać”, „to nie twoja wina”. Nie zamykaj tematu, otwieraj go. Hook ma zostawiać niedosyt i prowokować: *„opowiedz mi więcej”*.
    
7. Precyzja zamiast ogólników : Unikaj zdań, które pasują do każdego. Nie pisz: „czujesz, że coś jest nie tak”, tylko: „czujesz się winna, kiedy chcesz odpocząć”. Daj odbiorcy poczuć, że został nazwany po imieniu.
    
8. Hook musi wynikać z tematu oferty : Nawet jeśli nie zdradzasz produktu, prowadź emocjonalnie w jego stronę. Nie pisz o ciele, jeśli oferta dotyczy pieniędzy. Zrozum, co klient sprzedaje i jakiej zmiany dotyczy jego oferta a potem pokaż problem, który do niej prowadzi.
    
9. Mów jak człowiek, nie jak AI. Unikaj konstrukcji, które brzmią sztucznie:
    
- „masz dość czuć się…”
- „masz dość być…”
    
Zawsze pisz pełne, poprawne zdania: „masz dość tego, że codziennie udajesz, że wszystko gra”. Jeśli zdanie brzmi dziwnie na głos, popraw je.
    
10. Jedna myśl = jeden hook : Nie mieszaj tematów, nie dokładaj drugiej emocji. Hook ma być jednym, logicznym zdaniem, które prowadzi do jednej emocji. Unikaj zdań z kilkoma przecinkami, pauzami, dodatkami typu „ale też”, „a jednocześnie”.
    
11. Hook musi mieć logiczny przepływ : Nie łącz ze sobą przypadkowych odczuć (np. „czujesz się samotna i boisz się zarabiać więcej”). Emocje muszą wynikać jedna z drugiej.
    
12. Jasność ponad wszystko : Hook musi być zrozumiały natychmiast – bez zastanawiania się, „co autor miał na myśli”. Nie twórz metafor ani otwartych interpretacji. Hook to nie poezja. To konkretna emocja.`;
}

