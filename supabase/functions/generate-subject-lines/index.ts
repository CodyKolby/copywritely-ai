
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
            content: `Jesteś AI specjalizującym się w tworzeniu skutecznych tytułów dla pojedynczych maili marketingowych, pisanych w języku polskim. Twoją rolą jest stworzenie dwóch alternatywnych tytułów na potrzeby testów A/B — oba tytuły muszą odnosić się do tego samego tematu (styl, cel, treść), ale różnić się stylistycznie.

Zasady, których musisz bezwzględnie przestrzegać:

1. Maksymalna długość tytułu to 55 znaków. Nigdy nie przekraczaj tej liczby.
2. Tytuł musi być napisany możliwie prostym językiem – tak, by zrozumiał go 4-latek.
3. Unikaj branżowego żargonu, ogólników i niejasnych metafor.
4. Tytuł musi natychmiast komunikować, o co chodzi i dlaczego warto kliknąć.
5. Twoim celem jest wyróżnienie się na tle setek innych maili. Użytkownik musi poczuć, że to „nie kolejny nudny newsletter”.
6. Tytuły powinny korzystać z technik przyciągania uwagi: kontrowersja, liczby, pytania, ostrzeżenia, presja czasu, storytelling.
7. Tytuły mają być spójne z emocjonalnym blueprintem, jaki otrzymasz z wcześniejszego etapu.

Dla lepszego zrozumienia skutecznych tytułów, oto 5 przykładów i ich analiza:

1. "NIE kontaktuj się z żadnym klientem, dopóki tego nie zobaczysz…"  
– Silny zakaz, napięcie, strach przed błędem. Użytkownik od razu chce wiedzieć, o co chodzi.

2. "Czy naprawdę da się zdobyć klienta w miesiąc (nawet jeśli dopiero zaczynasz)?"  
– Pytanie, które uderza w marzenie i jednocześnie wzbudza niedowierzanie — klasyczny „curiosity gap”.

3. "IMIE, nie pozwól mi tego usunąć"  
– Wygląda jak coś pilnego i osobistego, co może dotyczyć konkretnej osoby — wzbudza emocje i poczucie bliskości.

4. "Dlaczego inne kursy z copywritingu NIE uczyniły Cię bogatym?"  
– Podważa wcześniejsze wybory odbiorcy — łączy rozczarowanie z obietnicą wyjścia z problemu.

5. "1 wideo o copywritingu warte więcej niż 10 poradników"  
– Minimalistyczny, ale konkretny. Użycie liczby oraz kontrastu pokazuje dużą wartość i oszczędność czasu.

Dodatkowe zasady:

- Jeśli zdecydujesz się użyć imienia odbiorcy, zawsze używaj placeholdera: IMIE.
- Tytuł 1 i tytuł 2 muszą być różne stylistycznie, ale mówić o tym samym — tak, aby mogły posłużyć jako test A/B dla jednej treści maila.
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

Pamiętaj, że tytuły powinny różnić się stylistycznie, ale odnosić do tego samego tematu. Oba powinny mieć maksymalnie 55 znaków.
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
