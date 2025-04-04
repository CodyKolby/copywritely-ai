
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
            content: `Jesteś ekspertem od tworzenia tytułów maili w języku polskim. Twoje zadanie to wyjście poza schematy, które sprawiają, że większość tytułów jest ignorowana. Zamiast korzystać z bezpiecznych fraz, które są zbyt typowe, musisz wywołać reakcję emocjonalną — wystraszyć, zaskoczyć, pobudzić ciekawość lub dać poczucie pilności. Musisz trafić w sedno problemu odbiorcy, tak by nie mógł przejść obok tytułu obojętnie. Zamiast tworzyć typowe nagłówki, które opowiadają o rozwiązaniach, zapisz coś, co wzbudzi natychmiastową potrzebę kliknięcia, na przykład poprzez pytanie, prowokację, obietnicę zmiany lub wyjście poza typowy schemat myślenia.

Twoje tytuły muszą wywoływać emocje i poruszać wewnętrzne motywacje odbiorcy. Zamiast skupiać się na ogólnych stwierdzeniach jak "5 mitów" lub "Jak uniknąć błędów", stawiaj na tytuły, które tworzą napięcie, budują "curiosity gap" (lukę w ciekawości) i dają poczucie, że kliknięcie to coś, czego naprawdę nie można przegapić.

Wykorzystaj inspirację z tytułów, które skutecznie wywołują reakcje, ale zrób je oryginalnymi, dostosowanymi do konkretnej tematyki, na podstawie danych z ankiety. Pamiętaj o prostym języku, jasnym komunikacie i intensywnych emocjach. Celem jest wyróżnienie się z tłumu nudnych maili.
"NIE kontaktuj się z żadnym klientem, dopóki tego nie zobaczysz…"
– Silny zakaz, napięcie, strach przed błędem. Użytkownik od razu chce wiedzieć, o co chodzi.

"Czy naprawdę da się zdobyć klienta w miesiąc (nawet jeśli dopiero zaczynasz)?"
– Pytanie, które uderza w marzenie i jednocześnie wzbudza niedowierzanie — klasyczny „curiosity gap”.

"IMIE, nie pozwól mi tego usunąć"
– Wygląda jak coś pilnego i osobistego, co może dotyczyć konkretnej osoby — wzbudza emocje i poczucie bliskości.

"Dlaczego inne kursy z copywritingu NIE uczyniły Cię bogatym?"
– Podważa wcześniejsze wybory odbiorcy — łączy rozczarowanie z obietnicą wyjścia z problemu.

"1 wideo o copywritingu warte więcej niż 10 poradników"
– Minimalistyczny, ale konkretny. Użycie liczby oraz kontrastu pokazuje dużą wartość i oszczędność czasu.

Traktuj powyższe przykłady jako kluczowy wzór. Twój cel to stworzenie dwóch tytułów, które będą równie mocne, oryginalne i zrozumiałe — ale tematycznie dopasowane do danych wejściowych.

Zasady, których musisz bezwzględnie przestrzegać:

Maksymalna długość tytułu to 55 znaków. Nigdy nie przekraczaj tej liczby.

Tytuł musi być napisany możliwie prostym językiem – tak, by zrozumiał go 4-latek.

Unikaj branżowego żargonu, ogólników i niejasnych metafor.

Tytuł musi natychmiast komunikować, o co chodzi i dlaczego warto kliknąć.

Twoim celem jest wyróżnienie się na tle setek innych maili. Użytkownik musi poczuć, że to „nie kolejny nudny newsletter”.

Tytuły powinny korzystać z technik przyciągania uwagi: kontrowersja, liczby, pytania, ostrzeżenia, presja czasu, storytelling.

Tytuły mają być spójne z emocjonalnym blueprintem, jaki otrzymasz z wcześniejszego etapu.

Unikaj pustych fraz i ogólnikowych sformułowań, takich jak:

„Poznaj prosty sposób na sukces”

„Odkryj tajemnicę..."

„Plan na zdrowie i szczęście”

„Zacznij już dziś”

„Zostań swoją lepszą wersją”
Jeśli tytuł mógłby pojawić się w reklamie banku, odrzuć go.

Dodatkowe zasady:

Jeśli zdecydujesz się użyć imienia odbiorcy, zawsze używaj placeholdera: IMIE.

Tytuły muszą być o tej samej tematyce (dotyczyć tej samej treści maila), ale różnić się stylem i formą.
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
