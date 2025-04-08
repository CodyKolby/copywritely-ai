
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET'
};

// System prompt for PostscriptAgent
const SYSTEM_PROMPT = `Jesteś PostscriptAgentem, ekspertem w tworzeniu angażujących treści i mocnych wezwań do działania (CTA) w postach w mediach społecznościowych.

Twoje zadanie:
1. Na podstawie danych o grupie docelowej, celu reklamy i wyjścia PosthookAgenta
2. Stworzyć pełną treść postu dopasowaną do platformy
3. Dodać skuteczne wezwanie do działania (CTA)
4. Optymalizować treść pod kątem angażowania odbiorców

Dopasuj styl do wskazanej platformy:
- Meta (Instagram/Facebook): wizualny, emocjonalny z wyraźnym CTA
- TikTok: krótki, dynamiczny, conversational z silnym hasłem do działania
- LinkedIn: wartościowy, profesjonalny, budujący autorytet z biznesowym CTA

Zwróć pełną treść postu w formacie JSON z polami:
- content: główna treść postu (włącznie z hookiem)
- cta: wyraźne wezwanie do działania`;

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
    const { targetAudience, advertisingGoal, platform, posthookOutput } = await req.json();
    
    if (!targetAudience || !posthookOutput) {
      return new Response(
        JSON.stringify({ error: 'Brak wymaganych danych' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const selectedHook = posthookOutput.hooks && posthookOutput.hooks.length > 0 
      ? posthookOutput.hooks[0] 
      : "Brak hooka";
      
    // Przygotowanie danych o platformie
    const platformInfo = `Platforma: ${platform || 'Meta (Instagram/Facebook)'}`;
    
    // Konstrukcja promptu dla agenta
    const userPrompt = `Oto dane o grupie docelowej:
    ${JSON.stringify(targetAudience, null, 2)}
    
    Cel reklamy: ${advertisingGoal || 'Brak określonego celu'}
    
    Wybrany hook: ${selectedHook}
    
    Tematyka postu: ${posthookOutput.theme || 'Brak określonej tematyki'}
    
    Forma postu: ${posthookOutput.form || 'post tekstowy'}
    
    ${platformInfo}
    
    Stwórz pełną treść postu z wezwaniem do działania.`;
    
    // Logowanie promptu do konsoli
    console.log("Prompt dla PostscriptAgent:", userPrompt);
    
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
    console.log("Odpowiedź PostscriptAgent:", responseText);
    
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
        content: "Nie udało się wygenerować treści postu.",
        cta: "Skontaktuj się z nami, aby dowiedzieć się więcej."
      };
    }
    
    return new Response(
      JSON.stringify(processedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Błąd w funkcji postscript-agent:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
