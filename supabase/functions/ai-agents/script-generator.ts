
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System prompt dla ScriptGeneratorAI zostanie uzupełniony później
const SYSTEM_PROMPT = `Jesteś ekspertem od tworzenia skryptów reklamowych.

Twoim zadaniem jest napisanie treści głównej reklamy, która będzie pasować do podanego hooka i angle. 
Nie dodawaj własnego początku ani zakończenia - skupiaj się tylko na głównej treści.

Dostosuj styl i ton do podanego szablonu reklamowego (np. TikTok, VSL, post na FB).`;

serve(async (req) => {
  // Obsługa preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parsowanie danych z zapytania
    const { targetAudience, templateType, selectedHook, selectedAngle } = await req.json();
    
    if (!targetAudience || !selectedHook || !selectedAngle) {
      return new Response(
        JSON.stringify({ error: 'Brak wymaganych danych (grupa docelowa, hook, angle)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generowanie skryptu dla szablonu:', templateType);
    console.log('Wybrany hook:', selectedHook);
    console.log('Wybrany angle:', selectedAngle);

    // Ta funkcja zostanie zaimplementowana później
    const scriptContent = "Ten agent zostanie zaimplementowany w następnym kroku.";
    
    return new Response(
      JSON.stringify({ scriptContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Błąd w funkcji script-generator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
