
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Poprawna konfiguracja nagłówków CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  console.log("Otrzymano zapytanie do generate-script:", req.method, req.url);
  
  // Obsługa preflight CORS
  if (req.method === 'OPTIONS') {
    console.log("Obsługa zapytania preflight OPTIONS");
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    console.log("Przetwarzanie zapytania POST");
    
    // Parsowanie danych z zapytania
    const requestData = await req.json();
    const templateId = requestData.templateId;
    const targetAudienceId = requestData.targetAudienceId;
    
    console.log("Odebrane dane:", JSON.stringify({ templateId, targetAudienceId }));
    
    // Walidacja danych wejściowych
    if (!templateId || !targetAudienceId) {
      console.error("Brak wymaganych danych:", { templateId, targetAudienceId });
      return new Response(
        JSON.stringify({ error: 'Brak wymaganych danych (templateId, targetAudienceId)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generowanie skryptu dla szablonu:', templateId);
    console.log('ID grupy docelowej:', targetAudienceId);
    
    // Pobieranie danych grupy docelowej bezpośrednio przez fetch z Supabase API
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://jorbqjareswzdrsmepbv.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmJxamFyZXN3emRyc21lcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NTcyNjMsImV4cCI6MjA1ODEzMzI2M30.WtGgnQKLVD2ZuOq4qNrIfcmFc98U3Q6YLrCCRG_mrH4';
    
    const apiUrl = `${supabaseUrl}/rest/v1/target_audiences?id=eq.${targetAudienceId}`;
    console.log("Pobieranie danych grupy docelowej z URL:", apiUrl);
    
    const targetAudienceResponse = await fetch(apiUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    // Sprawdzanie odpowiedzi
    if (!targetAudienceResponse.ok) {
      const errorText = await targetAudienceResponse.text();
      console.error('Błąd pobierania danych grupy docelowej:', {
        status: targetAudienceResponse.status,
        statusText: targetAudienceResponse.statusText,
        body: errorText
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Nie udało się pobrać danych grupy docelowej', 
          details: { 
            status: targetAudienceResponse.status, 
            message: errorText 
          } 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const targetAudienceData = await targetAudienceResponse.json();
    console.log('Odpowiedź z bazy danych:', JSON.stringify(targetAudienceData));
    
    if (!targetAudienceData || targetAudienceData.length === 0) {
      console.error('Nie znaleziono grupy docelowej o ID:', targetAudienceId);
      
      // Generowanie przykładowego skryptu jako fallback
      const sampleScript = generateSampleScript(templateId);
      
      return new Response(
        JSON.stringify({ 
          script: sampleScript,
          warning: 'Wygenerowano przykładowy skrypt, ponieważ nie znaleziono grupy docelowej'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const targetAudience = targetAudienceData[0];
    console.log('Pobrano dane grupy docelowej:', targetAudience.name || 'Bez nazwy');
    
    // Formatowanie danych grupy docelowej do prompta
    const audienceDescription = formatAudienceDetails(targetAudience);
    
    // Wybieranie odpowiedniego prompta systemowego
    const systemPrompt = getSystemPromptForTemplate(templateId);
    
    // Sprawdzenie klucza OpenAI
    if (!openAIApiKey) {
      console.error('Brak klucza API OpenAI');
      
      // Generowanie przykładowego skryptu jako fallback
      const sampleScript = generateSampleScript(templateId);
      
      return new Response(
        JSON.stringify({ 
          script: sampleScript,
          warning: 'Wygenerowano przykładowy skrypt, ponieważ nie skonfigurowano klucza OpenAI'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Wywołanie API OpenAI
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
        
        // Generowanie przykładowego skryptu jako fallback
        const sampleScript = generateSampleScript(templateId);
        
        return new Response(
          JSON.stringify({ 
            script: sampleScript,
            warning: 'Wygenerowano przykładowy skrypt z powodu błędu API OpenAI',
            error: errorData
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Parsowanie odpowiedzi
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
      
      // Generowanie przykładowego skryptu jako fallback
      const sampleScript = generateSampleScript(templateId);
      
      return new Response(
        JSON.stringify({ 
          script: sampleScript,
          warning: 'Wygenerowano przykładowy skrypt z powodu błędu komunikacji z OpenAI',
          error: openaiError.message
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error) {
    console.error('Nieobsłużony błąd w funkcji generate-script:', error);
    
    // Generowanie przykładowego skryptu jako fallback
    const sampleScript = generateSampleScript('generic');
    
    return new Response(
      JSON.stringify({ 
        script: sampleScript,
        warning: 'Wygenerowano przykładowy skrypt z powodu nieoczekiwanego błędu',
        error: error.message
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Funkcja formatująca dane grupy docelowej
function formatAudienceDetails(audience) {
  if (!audience) return "Brak danych o grupie docelowej.";
  
  let details = "# Informacje o grupie docelowej\n\n";
  
  // Podstawowe dane demograficzne
  if (audience.age_range) details += `Wiek: ${audience.age_range}\n`;
  if (audience.gender) details += `Płeć: ${audience.gender}\n\n`;
  
  // Główna oferta
  if (audience.main_offer) details += `## Główna oferta\n${audience.main_offer}\n\n`;
  
  // Szczegóły oferty
  if (audience.offer_details) details += `## Szczegóły oferty\n${audience.offer_details}\n\n`;
  
  // Problemy klientów
  if (audience.pains && audience.pains.length > 0) {
    details += "## Problemy klientów\n";
    audience.pains.forEach((pain, index) => {
      if (pain) details += `${index + 1}. ${pain}\n`;
    });
    details += "\n";
  }
  
  // Pragnienia
  if (audience.desires && audience.desires.length > 0) {
    details += "## Pragnienia klientów\n";
    audience.desires.forEach((desire, index) => {
      if (desire) details += `${index + 1}. ${desire}\n`;
    });
    details += "\n";
  }
  
  // Korzyści
  if (audience.benefits && audience.benefits.length > 0) {
    details += "## Korzyści produktu/usługi\n";
    audience.benefits.forEach((benefit, index) => {
      if (benefit) details += `${index + 1}. ${benefit}\n`;
    });
    details += "\n";
  }
  
  // Język klienta
  if (audience.language) details += `## Język klienta\n${audience.language}\n\n`;
  
  // Przekonania
  if (audience.beliefs) details += `## Przekonania do zbudowania\n${audience.beliefs}\n\n`;
  
  // Biografia
  if (audience.biography) details += `## Biografia klienta\n${audience.biography}\n\n`;
  
  // Konkurencja
  if (audience.competitors && audience.competitors.length > 0) {
    details += "## Konkurencja\n";
    audience.competitors.forEach((competitor, index) => {
      if (competitor) details += `${index + 1}. ${competitor}\n`;
    });
    details += "\n";
  }
  
  // Dlaczego to działa
  if (audience.why_it_works) details += `## Dlaczego produkt/usługa działa\n${audience.why_it_works}\n\n`;
  
  // Doświadczenie
  if (audience.experience) details += `## Doświadczenie sprzedawcy\n${audience.experience}\n\n`;
  
  return details;
}

// Funkcja wybierająca prompt systemowy dla danego szablonu
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

// Funkcja generująca przykładowy skrypt (awaryjny w przypadku problemów z API)
function generateSampleScript(templateId) {
  return `# Przykładowy skrypt dla szablonu: ${templateId}

## Wprowadzenie
Witaj w naszym skrypcie przygotowanym specjalnie dla Twojej grupy docelowej!

## Główne punkty
1. Zacznij od nawiązania kontaktu z odbiorcą
2. Przedstaw główne korzyści Twojej oferty
3. Pokaż, jak Twój produkt rozwiązuje problemy odbiorcy
4. Zaprezentuj case study lub historie sukcesu
5. Zakończ mocnym wezwaniem do działania

## Szczegółowy opis
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim.

## Przykładowe dialogi
- "Czy zauważyłeś, że [problem] staje się coraz większym wyzwaniem?"
- "Nasz produkt pozwala na [korzyść] bez konieczności [negatywny aspekt konkurencji]"
- "W ciągu ostatnich 6 miesięcy pomogliśmy ponad 100 klientom osiągnąć [rezultat]"

## Zakończenie
Dziękujemy za skorzystanie z naszego generatora skryptów! Możesz teraz dostosować ten szkic do swoich potrzeb.

UWAGA: To jest przykładowy skrypt wygenerowany z powodu błędu z OpenAI API.`;
}
