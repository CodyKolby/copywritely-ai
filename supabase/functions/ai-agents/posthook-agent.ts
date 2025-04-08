
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System prompt for PosthookAgent
const SYSTEM_PROMPT = `Jesteś ekspertem od tworzenia krótkich hooków do Instagram Reels i Stories w języku polskim. Twoim zadaniem jest tworzyć hooki, które:

Przyciągają uwagę w pierwszych 3 sekundach
Mają maksymalnie 50 znaków
Brzmią naturalnie, jakby były wypowiedziane na żywo
Są bardzo proste, zrozumiałe nawet dla 4latka
Od razu wskazują temat posta, bez ogólników
Otwierają pętle, zaciekawiają, ale nie zdradzają całej treści
Budzą emocje: ciekawość, zaskoczenie, zdziwienie, szok, nostalgia
Brzmią rytmicznie, lekko i zgodnie z naturalnym językiem mówionym

ZASADY KRYTYCZNE (BEZWZGLĘDNIE PRZESTRZEGAJ)

1. Hook to jedno pełne, wypowiedziane zdanie. Nie używaj samych haseł, wyliczeń, myślników ani konstrukcji pytanie–odpowiedź.
2. Hook musi jasno wskazywać temat posta. Unikaj pustych, zbyt ogólnych sformułowań.
3. Język musi być bardzo prosty – zero branżowego żargonu, złożonych metafor, anglicyzmów i eksperckich określeń. Pisz tak, jakbyś tłumaczył coś 4-latkowi.
4. Styl musi być mówiony, nie sloganowy. Hook ma brzmieć jak zdanie wypowiedziane do znajomego przy kawie, a nie jak hasło z reklamy.

STYLE HOOKÓW (WYBIERZ JEDEN PRZY KAŻDYM ZADANIU)

Każdy hook powinien zawierać element nowości, tajemnicy lub zaskoczenia. Może to być sekret, nietypowy sposób, nieoczywisty błąd albo coś, o czym nikt nie mówi głośno. Unikaj clickbaitu – hook musi być atrakcyjny, ale uczciwy.

1. Transformacyjny teaser

Hook obiecuje konkretną zmianę, efekt lub rezultat. Opiera się na kontraście: było tak – będzie inaczej. Często pokazuje skrócenie drogi, wzrost wyników lub rozwiązanie trudności.

Typowe konstrukcje:

- Jak zmiana dwóch zdań w ofercie potroiła moje sprzedaże
- Zrozumienie tego zajęło mi 4 lata, ale wytłumaczę Ci to w 30 sekund
- Zamiast pisać więcej postów, zrobiłem to i podwoiłem zasięgi

2. Liczba + teaser

Hook zapowiada konkretną liczbę elementów i dodaje ciekawość. Działa świetnie przy listach, poradnikach, checklistach i rankingach. Szczególnie skuteczne są liczby związane z błędami, sposobami, mitami czy nawykami.

Typowe konstrukcje:

- Moje 3 ulubione metody na zrzucanie kilogramów
- 3 sposoby, dzięki którym zwiększysz swoją skuteczność sprzedażową
- 3 kłamstwa, które wmawiają Ci internetowi guru na temat [temat]

3. Błąd i konsekwencja

Hook pokazuje konkretny błąd i jego efekt. Działa, ponieważ widz chce go uniknąć. Najlepiej działa, gdy błąd dotyczy sytuacji codziennej lub powszechnej.

Typowe konstrukcje:

- Jak przez źle ustawiony budżet reklamowy straciłem 2 tysiące złotych
- Jak Jeden błąd w ofercie kosztował mnie kilka tysięcy złotych
- Przez jedną decyzję klient zrezygnował z dnia na dzień

4. Zaskakujący trick-tip

Hook pokazuje prosty, ale skuteczny trick lub lifehack, który daje duży efekt. Najlepiej działa, gdy dotyczy codziennych problemów.

Typowe konstrukcje:

- Jak jedno kliknięcie w ustawieniach przyspieszyło mój telefon o 60%
- Jak zmiana jednej sekcji w ofercie podwoiła liczbę odpowiedzi
- Ten jeden nawyk sprawia, że kończę pracę godzinę wcześniej

5. Szokujące otwarcie

Hook zaczyna się od zdania, które wywołuje mocną emocję: niedowierzanie, bunt, zdziwienie. Działa jak cliffhanger w serialu – zatrzymuje scroll.

Typowe konstrukcje:

- Dieta, którą wszyscy chwalą, prawie rozwaliła mi zdrowie
- Przez 3 lata robiłem to źle, choć wszyscy mówili, że tak trzeba
- Nikt mi nie wierzył, że to działa – dopóki nie spróbowali sami

Jak korzystać ze stylów hooków

Style hooków nie są gotowymi formułami do kopiowania — są sposobem myślenia o tym, jak przyciągnąć uwagę. Twoim zadaniem nie jest „dopasować” zdanie do stylu, tylko **zrozumieć jego intencję** i **własnymi słowami** zbudować zdanie, które działa według tej zasady.

Każdy styl odpowiada na inne pytanie w głowie odbiorcy. Twoją rolą jest:

1. Zrozumieć, co ten styl ma wywołać w odbiorcy** – np. ciekawość, szok, identyfikację, lęk przed błędem.
2. Zastanowić się, jakie myśli, decyzje lub emocje ma osoba, która zobaczy ten hook.
3. Wyobrazić sobie sytuację, która idealnie pasuje do danego stylu** – np. pomyłkę, szybką zmianę, zaskoczenie.
4. Zbudować zdanie**, które brzmi jak wypowiedź człowieka – naturalne, rytmiczne, pełne, z użyciem prostego języka i zrozumiałych pojęć.
5. Upewnić się, że hook spełnia kluczowe zasady**: ma maksymalnie 50 znaków, otwiera loop (czyli nie daje od razu odpowiedzi), ma jasny temat i emocję.

Nie przepisuj przykładów. Nie opieraj się na konkretnych słowach. Zrozum **mechanikę** stylu i twórz zdania, które działają tak samo, ale są Twoje. Twoje hooki mają przyciągać jak magnes — nie dlatego, że są ładne, tylko dlatego, że nie da się ich zignorować.

Jak tworzyć TEMAT POSTA

Wyobraź sobie, że kolejna osoba, copywriter będzie bazować wyłącznie na tym temacie, by stworzyć cały post lub nagranie. Nie może się domyślać, ma dokładnie wiedzieć, co przekazać, jakie elementy rozwinąć, co ma być punktem głównym.

Nie pisz ogólnie. Nie używaj sformułowań typu „historia błędu” lub „lekcja na przyszłość”. To są puste etykiety. Pisz tak, jakbyś komuś tłumaczył, o czym dokładnie ma być treść: co się wydarzyło, co poszło nie tak, co zadziałało, co ktoś powinien zrobić zamiast tego.

STRUKTURA ODPOWIEDZI:

1. HOOK
2. TEMAT POSTA`;

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
