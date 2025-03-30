
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
    
    // KROK 1: Data Preprocessing - pierwszy agent przetwarza dane ankiety
    console.log('🔍 Rozpoczynam preprocessing danych ankiety');
    
    // Format audience data for preprocessing
    const audienceDescription = formatAudienceDetails(targetAudienceData);
    const processedData = await preprocessAudienceData(audienceDescription);
    
    if (!processedData) {
      console.error('Błąd podczas preprocessingu danych ankiety');
      return new Response(
        JSON.stringify({ 
          error: 'Błąd podczas preprocessingu danych ankiety',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract HOOK DATA section from processed data
    const hookData = extractHookData(processedData);
    const scriptData = extractScriptData(processedData);
    
    if (!hookData) {
      console.error('Błąd podczas ekstrakcji danych dla generatora hooków');
      return new Response(
        JSON.stringify({ 
          error: 'Błąd podczas ekstrakcji danych dla generatora hooków',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ Preprocessing zakończony, przekazuję dane do generatora hooków');
    
    // KROK 2: Generowanie hooków na podstawie przetworzonych danych
    const generatedHooks = await generateHooks(hookData);
    
    if (!generatedHooks) {
      console.error('Błąd podczas generowania hooków');
      return new Response(
        JSON.stringify({ 
          error: 'Błąd podczas generowania hooków',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Przygotowanie odpowiedzi
    const responseData = {
      script: generatedHooks,
      debug: debugInfo ? {
        originalData: audienceDescription,
        processedData: processedData,
        hookData: hookData,
        scriptData: scriptData
      } : null
    };
    
    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
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

// Function for preprocessing audience data - Agent 1: Data Processor
async function preprocessAudienceData(audienceDescription) {
  console.log('🔄 Wykonuję preprocessing danych ankiety przez Data Processing Agent');
  
  try {
    // Prompt dla agenta przetwarzającego dane
    const dataProcessingPrompt = `
Jesteś specjalistą od przetwarzania danych marketingowych. Na podstawie danych z ankiety masz za zadanie przygotować 2 zestawy informacji: dla Hook & Angle Generatora oraz Script Buildera.

Zasady:
– Nie tworzysz treści marketingowych.  
– Usuwasz powtórzenia, pomijasz nieistotne szczegóły (np. pory dnia, dygresje).  
– Zachowujesz autentyczny język odbiorcy (frazy, cytaty).  
– Grupujesz dane logicznie i przejrzyście.  
– Styl: zwięźle, konkretnie, z myślą o dalszym przetwarzaniu przez inne agenty.

---

## HOOK DATA

1. Główna oferta (1–2 zdania)  
2. Grupa docelowa (np. osoby 25–45 lat)  
3. Problemy (emocjonalne, cielesne, psychiczne)  
4. Pragnienia (życzenia, zmiany, efekty)  
5. Styl językowy odbiorcy – krótki, emocjonalny, z elementem zmęczenia lub buntu + cytaty i frazy  
6. Biografia odbiorcy – skrót: obecna sytuacja, błędne koła, kluczowe emocje  
7. Przekonania do zbudowania lub złamania (tylko komunikacyjnie użyteczne)

---

## SCRIPT DATA

1. Główna oferta (co, dla kogo, z jakim efektem)  
2. Elementy oferty (co konkretnie zawiera program)  
3. Główne korzyści (fizyczne, psychiczne, życiowe)  
4. Dlaczego działa (unikalność podejścia, doświadczenie twórcy, przewagi)  
5. Problemy i pragnienia – pogrupowane:
   – Problemy fizyczne  
   – Problemy emocjonalne  
   – Pragnienia ciała  
   – Pragnienia życia  
6. Biografia odbiorcy – kluczowe schematy, stan psychofizyczny, typowe błędy  
7. Styl językowy odbiorcy – cytaty, słownictwo, sposób mówienia o sobie  
8. Konkurencja – krótka analiza + typowe błędy konkurentów  
9. Doświadczenie twórcy – tylko to, co buduje zaufanie

📤 Output: tylko te 2 sekcje (HOOK DATA, SCRIPT DATA) — jasno oddzielone, z podpunktami.

Oryginalne dane z ankiety:
${audienceDescription}
`;

    // Wywołanie OpenAI API dla Data Processing Agent
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: dataProcessingPrompt }
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Błąd API OpenAI podczas preprocessingu:', {
        status: response.status,
        data: errorData
      });
      return null;
    }

    // Parse response
    const data = await response.json();
    console.log('📝 Data Processing Agent zakończył pracę, model:', data.model);
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Błąd podczas przetwarzania danych:', error);
    return null;
  }
}

// Extract HOOK DATA from processed data
function extractHookData(processedData) {
  try {
    // Find HOOK DATA section
    const hookDataStartIndex = processedData.indexOf('## HOOK DATA');
    if (hookDataStartIndex === -1) {
      return null;
    }
    
    // Find SCRIPT DATA section that comes after HOOK DATA
    const scriptDataStartIndex = processedData.indexOf('## SCRIPT DATA', hookDataStartIndex);
    
    // Extract HOOK DATA section
    const hookDataSection = scriptDataStartIndex !== -1 
      ? processedData.substring(hookDataStartIndex, scriptDataStartIndex).trim()
      : processedData.substring(hookDataStartIndex).trim();
    
    console.log('Wyekstrahowano dane dla Hook Generatora');
    
    return hookDataSection;
  } catch (error) {
    console.error('Błąd podczas ekstrakcji HOOK DATA:', error);
    return null;
  }
}

// Extract SCRIPT DATA from processed data (for future use)
function extractScriptData(processedData) {
  try {
    // Find SCRIPT DATA section
    const scriptDataStartIndex = processedData.indexOf('## SCRIPT DATA');
    if (scriptDataStartIndex === -1) {
      return null;
    }
    
    // Extract SCRIPT DATA section
    const scriptDataSection = processedData.substring(scriptDataStartIndex).trim();
    
    console.log('Wyekstrahowano dane dla Script Buildera');
    
    return scriptDataSection;
  } catch (error) {
    console.error('Błąd podczas ekstrakcji SCRIPT DATA:', error);
    return null;
  }
}

// Agent 2: Hook Generator
async function generateHooks(hookData) {
  console.log('✏️ Generuję hooki reklamowe na podstawie przetworzonych danych');
  
  try {
    // Prompt dla generatora hooków
    const hookGeneratorPrompt = `
Jesteś elitarnym copywriterem specjalizującym się w pisaniu emocjonalnych hooków reklamowych perfekcyjnie dopasowanych do oferty i grupy docelowej. Działasz wyłącznie na podstawie danych z ankiety wypełnionej przez klienta. Nie tworzysz ogólników, nie wymyślasz nic od siebie — analizujesz dane i przekładasz je na język, który odbiorca mógłby sam wypowiedzieć w myślach.

Twoim zadaniem jest stworzyć **5 unikalnych hooków**, które:
– Są jednym pełnym zdaniem (bez łączenia przecinkiem lub myślnikiem dwóch myśli).
– Trafiają w jedną, konkretną emocję wynikającą z danych (ból, frustracja, pragnienie, tęsknota).
– Są osobiste, pisane w 2 os. liczby pojedynczej ("jeśli jesteś kobietą, która...").
– Brzmią jak początek rozmowy, nie jak cytat, slogan czy zakończona wypowiedź.
– Są logicznie spójne i odnoszą się bezpośrednio do problemu, który rozwiązuje oferta klienta.
– Nie zdradzają oferty — prowokują uwagę, zostawiają niedosyt.

Zasady, których przestrzegasz:
1. Mów emocjami, nie logiką.
2. Unikaj ogólników – bądź precyzyjny i konkretny.
3. Nie pisz zdań rozbitych na 2 części (np. z myślnikiem). Jedna myśl = jedno zdanie.
4. Hook musi pasować do oferty – jeśli dotyczy ciała, nie pisz o pieniądzach.
5. Unikaj sztuczności – mów jak człowiek, nie AI.

Dane z ankiety:
${hookData}

Zwróć uwagę na:
– problem, z którym klientka się mierzy,
– emocje, które odczuwa w związku z tym problemem,
– zmianę, jakiej pragnie (wynikającą z oferty klientki).

Twoja odpowiedź to dokładnie 5 hooków — każdy jako jedno pełne zdanie.
`;

    // Wywołanie OpenAI API dla Hook Generator
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: hookGeneratorPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Błąd API OpenAI podczas generowania hooków:', {
        status: response.status,
        data: errorData
      });
      return null;
    }

    // Parse response
    const data = await response.json();
    console.log('✅ Generator hooków zakończył pracę, model:', data.model);
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Błąd podczas generowania hooków:', error);
    return null;
  }
}
