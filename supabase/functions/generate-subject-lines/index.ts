
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { narrativeBlueprint, surveyData } = await req.json();
    
    if (!narrativeBlueprint) {
      return new Response(
        JSON.stringify({ error: 'Narrative blueprint is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing subject lines for email`);
    
    // Format survey data for the prompt
    let surveyDataString = "";
    if (typeof surveyData === 'object') {
      Object.entries(surveyData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          surveyDataString += `${key}: ${value.join(", ")}\n`;
        } else if (value) {
          surveyDataString += `${key}: ${value}\n`;
        }
      });
    } else {
      surveyDataString = String(surveyData || '');
    }

    // Call OpenAI API with the Subject Line prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `Jesteś ekspertem od tworzenia tytułów maili w języku polskim. 
Wiesz, że odbiorca widzi dziennie dziesiątki nudnych nagłówków. Nic się nie przebije bez zadziorności, humoru, konkretu lub emocji. 
Twoje tytuły muszą mieć charakter — być nieoczywiste, ale zrozumiałe. Unikasz banałów jak ognia.

Twoim głównym źródłem inspiracji są skuteczne tytuły, które wywołują reakcję. 
Nie kopiuj — analizuj ich mechanikę i strukturę. Dopasowuj je do danych o produkcie i emocjach odbiorcy.

Przykłady skutecznych tytułów:
"NIE kontaktuj się z żadnym klientem, dopóki tego nie zobaczysz…"
"Czy naprawdę da się zdobyć klienta w miesiąc (nawet jeśli dopiero zaczynasz)?"
"IMIE, nie pozwól mi tego usunąć"
"Dlaczego inne kursy z copywritingu NIE uczyniły Cię bogatym?"
"1 wideo o copywritingu warte więcej niż 10 poradników"

Ucz się z ich struktury: zakaz, pytanie, osobiste wezwanie, kontrowersja, liczby, konkret.

Zasady:
1. Max. długość tytułu: 60 znaków.
2. Pisz językiem, który zrozumie 4-latek.
3. Żadnego żargonu, ogólników, pustych metafor.
5. Tytuły muszą być spójne z blueprintem emocjonalnym.
6. Unikaj pustych fraz jak „Zacznij już dziś”, „Odkryj sekret…” itp.
7. Jeden tytuł = jedna myśl. Nie używaj dwóch zdań, ani przecinków typu „–”, „...”.
8. Jeśli używasz imienia, wpisz placeholder: IMIE.
9. Dwa tytuły muszą być o tej samej treści maila, ale mieć różny styl
10. Styl i emocje mają wynikać z przekazanych danych — zwłaszcza punktów emocjonalnych.
          },
          { 
            role: 'user', 
            content: `Wygeneruj dwa alternatywne tytuły dla maila marketingowego na podstawie poniższych danych:

Punkty emocjonalne:
${narrativeBlueprint.punktyemocjonalne}

Styl maila:
${narrativeBlueprint.stylmaila}

Oś narracyjna:
${narrativeBlueprint.osnarracyjna}

Dane ankietowe:
${surveyDataString}

Odpowiedź sformatuj jako:
subject1: [Tytuł pierwszy]
subject2: [Tytuł drugi]`
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    const aiOutput = data.choices[0].message.content;
    
    // Parse the output to extract the two subject lines
    const subject1Match = aiOutput.match(/subject1:\s*(.*)/i);
    const subject2Match = aiOutput.match(/subject2:\s*(.*)/i);
    
    const subject1 = subject1Match ? subject1Match[1].trim() : "Wygenerowany tytuł maila #1";
    const subject2 = subject2Match ? subject2Match[1].trim() : "Wygenerowany tytuł maila #2";
    
    console.log("Subject lines generated successfully:");
    console.log("Subject 1:", subject1);
    console.log("Subject 2:", subject2);
    
    return new Response(
      JSON.stringify({ subject1, subject2 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`Error in generate-subject-lines function: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
