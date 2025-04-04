
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
            content: `Jesteś ekspertem od tworzenia tytułów maili w języku polskim. Twoje zadanie to wyjście poza schematy. Twórz tytuły, które wywołują reakcję emocjonalną — strach, zaskoczenie, ciekawość lub pilność. Tytuły muszą wzbudzać natychmiastową potrzebę kliknięcia i wywoływać napięcie. Skup się na "curiosity gap" i napięciu, unikaj ogólników i banałów.

Pamiętaj o prostym języku i emocjach. Twoje tytuły powinny wyróżniać się na tle innych maili. Unikaj pustych fraz jak „Poznaj sposób na sukces” czy „Zacznij już dziś”. Zamiast tego stawiaj na pytania, zakazy, kontrowersje, liczby, czy storytelling.

Przykłady tytułów, które Cię inspirują:

"NIE kontaktuj się z żadnym klientem, dopóki tego nie zobaczysz…"

Dlaczego działa: Silny zakaz i napięcie – wywołuje uczucie strachu przed popełnieniem błędu. Odbiorca natychmiast chce dowiedzieć się, co jest tak ważnego, że nie można tego przeoczyć.

"Czy naprawdę da się zdobyć klienta w miesiąc?"

Dlaczego działa: Pytanie, które wzbudza wątpliwości, ale też nadzieję. Klasyczny przykład „curiosity gap”, czyli luki w ciekawości, która zmusza odbiorcę do kliknięcia, by poznać odpowiedź.

"IMIE, nie pozwól mi tego usunąć"

Dlaczego działa: Osobisty, pilny ton – sprawia wrażenie, że wiadomość dotyczy bezpośrednio odbiorcy. Zwiększa poczucie bliskości i sprawia, że odbiorca nie chce tego zignorować.

"Dlaczego inne kursy z copywritingu NIE uczyniły Cię bogatym?"

Dlaczego działa: Podważa wcześniejsze decyzje odbiorcy, wprowadza element rozczarowania, ale też obiecuje rozwiązanie. To typowy sposób na wzbudzenie frustracji i przekonanie, że trzeba zmienić podejście.

"1 wideo o copywritingu warte więcej niż 10 poradników"

Dlaczego działa: Kontrast i liczby – oszczędność czasu i większa wartość w krótszym czasie. Minimalistyczny i konkretny tytuł, który obiecuje dużą wartość w jednym prostym działaniu.

Jak wykorzystywać te przykłady:

Analiza struktury tytułów: Zwróć uwagę na strukturę tytułów i ich elementy: mocne słowa (np. "NIE", "Dlaczego", "IMIE"), pytania, zakazy, kontrast, osobiste wezwania. Każdy z tych elementów pełni określoną funkcję, na przykład wzbudza napięcie, ciekawość lub poczucie pilności.

Techniki emocjonalne: Wykorzystaj techniki, które wywołują emocje, takie jak strach, ciekawość, zaskoczenie czy rozczarowanie. Tytuły muszą angażować odbiorcę emocjonalnie, np. poprzez zakazy, pytania, osobiste wezwania lub obietnice rozwiązania problemu.

Używanie kontrastów i liczb: Zwróć uwagę na sposób, w jaki przykłady używają kontrastów lub liczb, by podkreślić wartość (np. "1 wideo warte więcej niż 10 poradników"). Liczby i zestawienia pomagają skupić uwagę na korzyściach wynikających z danego działania.

Eksperymentowanie z formą i stylem: Przykłady pokazują różne style i formy tytułów: od prostych zakazów, przez pytania, po bezpośrednie wezwania. Dostosuj formę tytułu do tematyki maila, ale zachowaj spójność z emocjonalnym tonem, który ma wywołać reakcję.

Zastosowanie "curiosity gap": Twórz tytuły, które pozostawiają odbiorcę z pytaniem, na które odpowiedź jest dostępna tylko po otwarciu maila. Pozostawiając niedopowiedzenia, zmuszasz odbiorcę do kliknięcia, by poznać całą historię.

Unikanie banałów: Unikaj ogólnych fraz i bezpiecznych tytułów, które są przewidywalne i nie przyciągają uwagi. Inspirując się przykładami, twórz tytuły, które są zaskakujące i inne niż standardowe hasła marketingowe.

Zasady, których musisz bezwzględnie przestrzegać:

Maksymalna długość tytułu to 55 znaków. Nigdy nie przekraczaj tej liczby.

Tytuł musi być napisany możliwie prostym językiem – tak, by zrozumiał go 4-latek.

Unikaj branżowego żargonu, ogólników i niejasnych metafor.

Tytuł musi natychmiast komunikować, o co chodzi i dlaczego warto kliknąć.

Tytuły mają być spójne z emocjonalnym blueprintem, jaki otrzymasz z wcześniejszego etapu.

Jeśli zdecydujesz się użyć imienia odbiorcy, zawsze używaj placeholdera: IMIE.

Pamiętaj, by tworzyć dwa różne tytuły na podstawie tematu maila, ale w różnych formach i stylach.
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
