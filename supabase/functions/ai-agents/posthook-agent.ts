
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System prompt for PosthookAgent
const SYSTEM_PROMPT = `Jesteś PosthookAgentem, ekspertem w tworzeniu angażujących hooków i określaniu tematyki dla postów w mediach społecznościowych.

Twoje zadanie:
1. Przeanalizować dane o grupie docelowej i celu reklamy
2. Stworzyć 3-5 przyciągających uwagę hooków (pierwsze zdania/nagłówki) dopasowanych do platformy
3. Określić główną tematykę i ton postu
4. Zaproponować formę postu (np. story, carousel, post tekstowy)

Dopasuj styl do wskazanej platformy:
- Meta (Instagram/Facebook): bardziej wizualny, emocjonalny, bezpośredni
- TikTok: zwięzły, dynamiczny, trend-aware, używający popularnego języka
- LinkedIn: profesjonalny, merytoryczny, nastawiony na wartość biznesową

Zwróć wyniki w formacie JSON z polami:
- hooks (array): 3-5 proponowanych hooków
- theme (string): główna tematyka postu
- form (string): proponowana forma postu (np. carousel)`;

serve(async (req) => {
  // Obsługa preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parsowanie danych z zapytania
    const { targetAudience, advertisingGoal, platform } = await req.json();
    
    if (!targetAudience) {
      return new Response(
        JSON.stringify({ error: 'Brak danych o grupie docelowej' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Przygotowanie danych o platformie
    const platformInfo = `Platforma: ${platform || 'Meta (Instagram/Facebook)'}`;
    
    // Pobieranie odpowiedzi z OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { 
            role: 'user', 
            content: `Oto dane o grupie docelowej:
            ${JSON.stringify(targetAudience, null, 2)}
            
            Cel reklamy: ${advertisingGoal || 'Brak określonego celu'}
            
            ${platformInfo}
            
            Stwórz hook, określ tematykę i formę postu.`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await openAIResponse.json();
    let responseText = data.choices[0].message.content;
    
    // Próba przetworzenia odpowiedzi jako JSON
    let processedResponse;
    try {
      // Wyczyść tekst z markerów kodu, jeśli istnieją
      if (responseText.includes('```json')) {
        responseText = responseText.replace(/```json|```/g, '').trim();
      }
      processedResponse = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      // Jeśli nie udało się sparsować jako JSON, tworzenie struktury ręcznie
      processedResponse = {
        hooks: ["Nie udało się wygenerować hooków"],
        theme: "Nie udało się określić tematyki",
        form: "post tekstowy"
      };
    }
    
    return new Response(
      JSON.stringify(processedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Błąd w funkcji posthook-agent:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
