
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Nagłówki CORS dla bezpiecznych zapytań
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System prompt dla HookAndAngleGeneratorAI
const SYSTEM_PROMPT = `Jesteś ekspertem od generowania hooków i kątów przekazu (angles) do kampanii reklamowych.

Twoim zadaniem jest wygenerowanie 3-5 różnych hooków reklamowych i dopasowanych do nich angles, które będą atrakcyjne dla określonej grupy docelowej.

Hook to krótkie, intrygujące zdanie na początku reklamy, które przyciąga uwagę odbiorcy.
Angle to perspektywa lub punkt widzenia, z którego przedstawiasz swój produkt/usługę.

Wygeneruj zróżnicowane hooki - część może być skupiona na problemie, część na pragnieniach, część na ciekawostkach czy szokujących faktach.

Zwróć wynik w formacie JSON według poniższego wzoru:
{
  "hooks": [
    {
      "hook": "Tekst hooka 1",
      "angle": "Opis kąta przekazu dopasowanego do hooka 1",
      "type": "problem/desire/curiosity/shock/personal"
    },
    {
      "hook": "Tekst hooka 2",
      "angle": "Opis kąta przekazu dopasowanego do hooka 2",
      "type": "problem/desire/curiosity/shock/personal"
    }
    // ... więcej hooków
  ]
}`;

// Funkcja obsługująca requesty
serve(async (req) => {
  // Obsługa preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parsowanie danych z zapytania
    const { targetAudience, templateType } = await req.json();
    
    if (!targetAudience) {
      return new Response(
        JSON.stringify({ error: 'Brak danych o grupie docelowej' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generowanie hooków i angles dla szablonu:', templateType);
    console.log('Dane grupy docelowej:', targetAudience);

    // Przygotowanie opisu grupy docelowej dla AI
    const audienceDescription = formatAudienceDescription(targetAudience);
    
    // Wywołanie API OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: audienceDescription }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" } // Zapewnia, że OpenAI zwróci poprawny JSON
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Błąd API OpenAI:', errorData);
      return new Response(
        JSON.stringify({ error: 'Błąd generowania hooków', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parsowanie odpowiedzi
    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    // Parsowanie JSON z odpowiedzi
    let parsedContent;
    try {
      parsedContent = JSON.parse(generatedContent);
    } catch (e) {
      console.error('Błąd parsowania JSON z odpowiedzi OpenAI:', e);
      return new Response(
        JSON.stringify({ error: 'Nieprawidłowy format odpowiedzi AI', rawContent: generatedContent }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Wygenerowano hooki i angles:', parsedContent);
    
    return new Response(
      JSON.stringify(parsedContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Błąd w funkcji hook-angle-generator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Funkcja formatująca dane grupy docelowej do prompta
function formatAudienceDescription(audience) {
  if (!audience) return "Brak danych o grupie docelowej.";
  
  let description = "# Informacje o grupie docelowej\n\n";
  
  // Podstawowe dane demograficzne
  if (audience.age_range) description += `Wiek: ${audience.age_range}\n`;
  if (audience.gender) description += `Płeć: ${audience.gender}\n\n`;
  
  // Główna oferta
  if (audience.main_offer) description += `## Główna oferta\n${audience.main_offer}\n\n`;
  
  // Szczegóły oferty
  if (audience.offer_details) description += `## Szczegóły oferty\n${audience.offer_details}\n\n`;
  
  // Problemy klientów
  if (audience.pains && audience.pains.length > 0) {
    description += "## Problemy klientów\n";
    audience.pains.forEach((pain, index) => {
      if (pain) description += `${index + 1}. ${pain}\n`;
    });
    description += "\n";
  }
  
  // Pragnienia
  if (audience.desires && audience.desires.length > 0) {
    description += "## Pragnienia klientów\n";
    audience.desires.forEach((desire, index) => {
      if (desire) description += `${index + 1}. ${desire}\n`;
    });
    description += "\n";
  }
  
  // Korzyści
  if (audience.benefits && audience.benefits.length > 0) {
    description += "## Korzyści produktu/usługi\n";
    audience.benefits.forEach((benefit, index) => {
      if (benefit) description += `${index + 1}. ${benefit}\n`;
    });
    description += "\n";
  }
  
  // Język klienta
  if (audience.language) description += `## Język klienta\n${audience.language}\n\n`;
  
  // Przekonania
  if (audience.beliefs) description += `## Przekonania do zbudowania\n${audience.beliefs}\n\n`;
  
  // Biografia
  if (audience.biography) description += `## Biografia klienta\n${audience.biography}\n\n`;
  
  // Konkurencja
  if (audience.competitors && audience.competitors.length > 0) {
    description += "## Konkurencja\n";
    audience.competitors.forEach((competitor, index) => {
      if (competitor) description += `${index + 1}. ${competitor}\n`;
    });
    description += "\n";
  }
  
  // Dlaczego to działa
  if (audience.why_it_works) description += `## Dlaczego produkt/usługa działa\n${audience.why_it_works}\n\n`;
  
  // Doświadczenie
  if (audience.experience) description += `## Doświadczenie sprzedawcy\n${audience.experience}\n\n`;
  
  return description;
}
