
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
    const { surveyData, emailStyle, advertisingGoal } = await req.json();
    
    if (!surveyData) {
      return new Response(
        JSON.stringify({ error: 'Survey data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing narrative blueprint for email style: ${emailStyle}`);
    
    // Format the survey data as a string
    let surveyDataString = "";
    if (typeof surveyData === 'object') {
      // Convert object to string representation
      Object.entries(surveyData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          surveyDataString += `${key}: ${value.join(", ")}\n`;
        } else if (value) {
          surveyDataString += `${key}: ${value}\n`;
        }
      });
    } else {
      surveyDataString = String(surveyData);
    }

    // Call OpenAI API with the Narrative Blueprint prompt
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
            content: `Jesteś profesjonalnym strategiem marketingowym, który specjalizuje się w tworzeniu fundamentów narracyjnych dla pojedynczych maili marketingowych. Twoim zadaniem jest wygenerowanie kluczowych punktów emocjonalnych i kreatywnych inspiracji, na podstawie których inne AI stworzą resztę maila. Nie tworzysz treści — tworzysz strukturę emocjonalną i logiczną.`
          },
          { 
            role: 'user', 
            content: `Masz dostęp do danych o grupie docelowej, ich problemach i pragnieniach, stylu maila oraz celu kampanii.

Dane wejściowe, które otrzymujesz:
${surveyDataString}
Styl maila: ${emailStyle || 'Nie określono'}
Cel kampanii: ${advertisingGoal || 'Nie określono'}

Na podstawie tych informacji wygeneruj trzy zestawy danych:

1. Punkty emocjonalne — zaproponuj 2–3 kluczowe emocjonalne punkty zaczepienia, które mają poruszyć odbiorcę. Dobierz je do stylu maila:
- Bezpośrednia sprzedaż — nacisk na presję, brak działania, pilność, obietnicę zmiany (np. „Ile jeszcze dni z rzędu będziesz budzić się zmęczona?").
- Edukacyjny — podkreśl błędne przekonania, ukryte przyczyny, nowe spojrzenia (np. „Twoje zmęczenie to nie brak silnej woli — to nierównowaga hormonalna").
- Opowieść — zacznij od typowego momentu z życia klientki, wywołaj utożsamienie, emocję i przełom (np. „Znowu płakałam w przebieralni… aż coś we mnie pękło").
- Budowanie relacji — podkreśl wspólnotę, zrozumienie, brak presji, otwartość na rozmowę (np. „Nie musisz być idealna — jesteśmy tu, żeby Cię wspierać").

Każdy punkt emocjonalny opisz jednym zdaniem głównym + jednym zdaniem uzasadniającym jego wartość.

2. Pomysły na styl maila — zaproponuj 3 interesujące, intrygujące i możliwie clickbaitowe pomysły na styl maila. Mogą być to potencjalne tytuły lub osie treści. Inspiruj się formatami typu:
- "Dlaczego Twój plan treningowy jest skazany na porażkę" (podważa obecne podejście klienta)
- "List od trenera: Co bym zrobiła, gdybym zaczynała od zera" (osobista perspektywa eksperta)
- "3 rzeczy, które robisz źle, choć starasz się jak możesz" (liczbowe i kontrastowe podejście)

Unikaj powtarzalnych konstrukcji, miksuj perspektywy, styl i format.

3. Oś narracyjna — wygeneruj jedno silne zdanie, które może być myślą przewodnią całego maila. To nie jest tytuł, to wewnętrzna mantra kampanii, np. „Nie jesteś sama", „Zacznij od siebie", „Nie musisz być idealna, by czuć się dobrze".

Zachowuj maksymalną zwięzłość. Nie powtarzaj informacji z danych wejściowych. Nie tworzysz copy — tworzysz emocjonalny blueprint, który zasili Subject Line Generator AI oraz Main Copywriter AI.

Wynik powinien mieć format:
punktyemocjonalne: [tutaj punkty emocjonalne]
stylmaila: [tutaj pomysły na styl maila]
ośnarracyjna: [tutaj oś narracyjną]`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    const aiOutput = data.choices[0].message.content;
    
    // Parse the AI output to extract the three sections
    const parseOutput = (output: string): {
      punktyemocjonalne: string,
      stylmaila: string,
      osnarracyjna: string
    } => {
      const result = {
        punktyemocjonalne: "",
        stylmaila: "",
        osnarracyjna: ""
      };

      // Extract the three sections using regex
      const punktyMatch = output.match(/punktyemocjonalne:\s*([\s\S]*?)(?=stylmaila:|$)/i);
      const stylMatch = output.match(/stylmaila:\s*([\s\S]*?)(?=ośnarracyjna:|osnarracyjna:|$)/i);
      const osMatch = output.match(/(ośnarracyjna|osnarracyjna):\s*([\s\S]*?)$/i);

      if (punktyMatch && punktyMatch[1]) result.punktyemocjonalne = punktyMatch[1].trim();
      if (stylMatch && stylMatch[1]) result.stylmaila = stylMatch[1].trim();
      if (osMatch && osMatch[2]) result.osnarracyjna = osMatch[2].trim();

      return result;
    };

    const parsedOutput = parseOutput(aiOutput);
    
    console.log("Narrative blueprint generated successfully");
    console.log("Punkty emocjonalne:", parsedOutput.punktyemocjonalne.substring(0, 100) + "...");
    console.log("Styl maila:", parsedOutput.stylmaila.substring(0, 100) + "...");
    console.log("Oś narracyjna:", parsedOutput.osnarracyjna);
    
    return new Response(
      JSON.stringify(parsedOutput),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`Error in narrative-blueprint function: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
