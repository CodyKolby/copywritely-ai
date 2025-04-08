
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET'
};

// System prompt for PosthookAgent
const SYSTEM_PROMPT = `Jesteś PosthookAgentem, ekspertem w tworzeniu angażujących hooków do postów w mediach społecznościowych.

Twoje zadanie:
1. Na podstawie danych o grupie docelowej i celu reklamy
2. Stworzyć hook (pierwsze zdanie postu) przykuwające uwagę
3. Określić ogólną tematykę postu
4. Zaproponować formę postu (tekst, karuzela, wideo, itp.)

Dopasuj styl do wskazanej platformy:
- Meta (Instagram/Facebook): wizualny, emocjonalny
- TikTok: krótki, dynamiczny, conversational
- LinkedIn: wartościowy, profesjonalny, budujący autorytet

Zwróć wyniki jako JSON z polami:
- hooks: tablica z propozycjami hooków (1-3)
- theme: ogólna tematyka postu
- form: sugerowana forma postu (np. "post tekstowy", "karuzela", "wideo", "relacja")

ZASADY KRYTYCZNE:

1. Hook to jedno pełne, wypowiedziane zdanie. Nie używaj samych haseł, wyliczeń, myślników ani konstrukcji pytanie–odpowiedź.
2. Hook musi jasno wskazywać temat postu. Unikaj pustych, zbyt ogólnych sformułowań.
3. Język musi być bardzo prosty – zero branżowego żargonu, złożonych metafor, anglicyzmów i eksperckich określeń.
4. Styl musi być mówiony, nie sloganowy. Hook ma brzmieć jak zdanie wypowiedziane do znajomego.

Dane z ankiety klienta: {{surveyData}}`;

serve(async (req) => {
  // Obsługa preflight CORS - poprawiona wersja
  if (req.method === 'OPTIONS') {
    console.log("Obsługa zapytania preflight OPTIONS");
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
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
    
    // Konstrukcja promptu z danymi z ankiety
    const userPrompt = `Oto dane o grupie docelowej:
    ${JSON.stringify(targetAudience, null, 2)}
    
    Cel reklamy: ${advertisingGoal || 'Brak określonego celu'}
    
    ${platformInfo}
    
    Stwórz hook, określ tematykę i formę postu.`;
    
    // Logowanie promptu do konsoli
    console.log("Prompt dla PosthookAgent:", userPrompt);
    
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
          { role: 'user', content: userPrompt }
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
    
    // Logowanie odpowiedzi do konsoli
    console.log("Odpowiedź PosthookAgent:", responseText);
    
    // Próba przetworzenia odpowiedzi jako JSON
    let processedResponse;
    try {
      // Wyczyść tekst z markerów kodu, jeśli istnieją
      if (responseText.includes('```json')) {
        responseText = responseText.replace(/```json|```/g, '').trim();
      }
      
      // Jeśli odpowiedź jest już w formacie JSON, spróbujemy ją sparsować
      try {
        processedResponse = JSON.parse(responseText);
      } catch (e) {
        // Jeśli nie udało się sparsować jako JSON, przygotowanie struktury ręcznie
        // Szukamy linii zaczynających się od "HOOK:" i "TEMAT POSTA:"
        const hookMatch = responseText.match(/HOOK:?\s*(.*?)(?=\s*TEMAT|\s*$)/is);
        const themeMatch = responseText.match(/TEMAT POSTA:?\s*(.*?)(?=\s*$)/is);
        
        const hook = hookMatch ? hookMatch[1].trim() : "Nie udało się wygenerować hooka";
        const theme = themeMatch ? themeMatch[1].trim() : "Nie udało się określić tematyki";
        
        processedResponse = {
          hooks: [hook],
          theme: theme,
          form: "post tekstowy"
        };
      }
    } catch (e) {
      console.error('Error processing response:', e);
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
