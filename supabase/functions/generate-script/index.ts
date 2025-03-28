
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
    
    console.log("Odebrane dane:", JSON.stringify({ templateId, targetAudienceId }));
    
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
    
    // Get appropriate system prompt
    const systemPrompt = getSystemPromptForTemplate(templateId);
    
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
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: audienceDescription }
          ],
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
      
      const generatedScript = data.choices[0].message.content;
      
      return new Response(
        JSON.stringify({ script: generatedScript }),
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

// Function for selecting system prompt for a given template
function getSystemPromptForTemplate(templateId) {
  const basePrompt = "Jesteś ekspertem copywritingu, specjalizującym się w tworzeniu skutecznych skryptów reklamowych. ";
  
  switch(templateId) {
    case 'email':
      return basePrompt + 
        "Stwórz przekonujący skrypt emaila marketingowego, który będzie konwertował leady w klientów. " +
        "Struktura emaila powinna zawierać przyciągający uwagę temat, angażujący wstęp, jasne przedstawienie korzyści, " +
        "dowód społeczny, silne wezwanie do działania i profesjonalną stopkę. " +
        "Skup się na korzyściach, a nie na cechach produktu i zachowaj konwersacyjny ton. " +
        "Format wyjściowy powinien zawierać wyraźne sekcje, w tym Temat, Tekst podglądu i Treść główną. " +
        "Skrypt powinien mieć od 300 do 500 słów.";
    
    case 'social':
      return basePrompt + 
        "Stwórz angażujące skrypty postów w mediach społecznościowych, zoptymalizowane dla docelowej grupy odbiorców. " +
        "Każdy post powinien mieć hook, przedstawienie wartości i jasne wezwanie do działania. " +
        "Przygotuj 3 warianty dla różnych platform (Facebook, Instagram, LinkedIn) " +
        "z odpowiednimi hashtagami i formatowaniem. Posty powinny być zwięzłe - dla Instagrama/Facebooka " +
        "około 125 słów, dla LinkedIn około 200 słów. Dodaj sugestie emoji tam, gdzie to stosowne.";
    
    case 'ad':
      return basePrompt + 
        "Stwórz skrypt reklamy cyfrowej o wysokiej konwersji z przyciągającymi uwagę nagłówkami, " +
        "przekonującą treścią i silnym wezwaniem do działania. Reklama powinna odnosić się do bólu klienta " +
        "i podkreślać kluczowe korzyści. Podaj 3 opcje nagłówków, 2 warianty treści i 2 opcje CTA. " +
        "Treść powinna być zwięzła i wywierać wpływ, z nagłówkami do 10 słów i treścią do 50 słów.";
    
    default:
      return basePrompt + 
        "Stwórz dobrze ustrukturyzowany skrypt marketingowy, który odnosi się do bólu klienta, " +
        "podkreśla korzyści, zawiera dowód społeczny i kończy się jasnym wezwaniem do działania. " +
        "Skrypt powinien być przekonujący, konwersacyjny i dostosowany specjalnie do grupy docelowej.";
  }
}
