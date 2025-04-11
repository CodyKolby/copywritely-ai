
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callOpenAI, createErrorResponse } from "../shared/openai.ts";
import { corsHeaders, handleOptions } from "../shared/cors.ts";

// OpenAI API key from environment
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// 🔥 DEBUG START
console.log("🔥🔥🔥 SOCIAL INTRO AGENT ACTIVE 🔥🔥🔥");

serve(async (req) => {
  // Generate a unique request ID and timestamp
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const functionVersion = "v1.0.2";
  const deploymentId = Deno.env.get('DEPLOYMENT_ID') || 'development';

  console.log(`[${timestamp}][REQ:${requestId}] Received request to social-intro-agent`);
  
  // Handle CORS preflight requests
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  try {
    if (!openAIApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    // Parse the request body
    const data = await req.json();
    const { targetAudience, advertisingGoal, platform } = data;

    if (!targetAudience) {
      throw new Error("Target audience data is required");
    }

    // Create metadata for logging and debugging
    const metadata = {
      requestId,
      timestamp,
      cacheBuster,
      deploymentId,
      functionVersion,
      model: "gpt-4o-mini"
    };

    // Format the full prompt including what was previously system and user prompts
    const fullPrompt = formatFullPrompt(targetAudience, advertisingGoal, platform);

    console.log(`[${timestamp}][REQ:${requestId}] Calling OpenAI with full prompt`);
    
    // Call OpenAI with a single prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Request-ID': requestId,
        'X-Timestamp': timestamp,
        'X-Cache-Buster': cacheBuster,
        'X-Deployment-ID': deploymentId,
        'X-Function-Version': functionVersion
      },
      body: JSON.stringify({
        model: metadata.model,
        messages: [
          { role: 'user', content: fullPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[${timestamp}][REQ:${requestId}] OpenAI API error:`, {
        status: response.status,
        error: errorData
      });
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    try {
      const data = await response.json();
      console.log(`[${timestamp}][REQ:${requestId}] OpenAI response received, model used: ${data.model}`);
      console.log(`[${timestamp}][REQ:${requestId}] Response length: ${data.choices[0].message.content.length} chars`);
      console.log(`[${timestamp}][REQ:${requestId}] RESPONSE FULL:\n${data.choices[0].message.content}`);
      
      // Extract the generated content
      const generatedIntro = data.choices[0].message.content;
      
      console.log(`[${timestamp}][REQ:${requestId}] Successfully generated intro for ${platform}`);

      // Return the response
      return new Response(
        JSON.stringify({
          intro: generatedIntro,
          model: data.model,
          timestamp,
          requestId,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (error) {
      console.error(`[${timestamp}][REQ:${requestId}] Error parsing OpenAI response:`, error);
      throw new Error(`Error parsing OpenAI response: ${error.message}`);
    }
  } catch (error) {
    console.error(`[${timestamp}][REQ:${requestId}] Error:`, error.message);
    return createErrorResponse(error, { 
      timestamp, 
      requestId, 
      deploymentId, 
      functionVersion 
    });
  }
});

// Helper function to format the complete prompt for OpenAI
function formatFullPrompt(targetAudience: any, advertisingGoal: string, platform: string) {
  let audienceDescription = '';
  
  // Build audience description
  if (targetAudience) {
    if (targetAudience.age_range) audienceDescription += `Wiek: ${targetAudience.age_range}\n`;
    if (targetAudience.gender) audienceDescription += `Płeć: ${targetAudience.gender}\n\n`;
    
    if (targetAudience.pains && targetAudience.pains.length) {
      audienceDescription += "Problemy klientów:\n";
      targetAudience.pains.forEach((pain: string, index: number) => {
        if (pain) audienceDescription += `${index + 1}. ${pain}\n`;
      });
      audienceDescription += "\n";
    }
    
    if (targetAudience.desires && targetAudience.desires.length) {
      audienceDescription += "Pragnienia klientów:\n";
      targetAudience.desires.forEach((desire: string, index: number) => {
        if (desire) audienceDescription += `${index + 1}. ${desire}\n`;
      });
      audienceDescription += "\n";
    }

    if (targetAudience.biography) audienceDescription += `Biografia klienta: ${targetAudience.biography}\n\n`;
    if (targetAudience.language) audienceDescription += `Język klienta: ${targetAudience.language}\n\n`;
    if (targetAudience.beliefs) audienceDescription += `Przekonania: ${targetAudience.beliefs}\n\n`;
    if (targetAudience.main_offer) audienceDescription += `Główna oferta: ${targetAudience.main_offer}\n\n`;
  }

  const PROMPT = `Jesteś ekspertem od tworzenia mówionych wprowadzeń do Instagram Reels i Stories.
Twoją specjalizacją są krótkie, emocjonalne otwarcia (intro), które przyciągają uwagę i sprawiają, że widz zostaje na kolejne sekundy.

Twoje intro ma:
– jasno wskazywać temat nagrania,
– opisywać aktualny stan widza,
– budować napięcie i ciekawość,
– nie zdradzać żadnych rozwiązań.

📌 To nie jest klasyczny hook. To intro, które ma płynnie przejść w wartość przygotowaną przez kolejnego agenta.

---

📥 CO DOSTAJESZ:

Otrzymujesz dane z ankiety : ${audienceDescription}

Z tych danych tworzysz wypowiedź tak, jakbyś mówił ją do jednej, konkretnej osoby.

Nigdy nie piszesz do ogólnej grupy odbiorców.

Twój tekst musi być maksymalnie dopasowany do języka, emocji i sytuacji tej jednej osoby.

Nie kopiuj danych dosłownie – przekształć je na naturalne, mówione zdania.

---

🎯 ZROZUM SWOJEGO ODBIORCĘ – TARGET VIEWER (NA PODSTAWIE DANYCH Z ANKIETY)

Zanim napiszesz choć jedno zdanie, musisz dokładnie zrozumieć, do kogo mówisz.

Twój widz to nie „grupa docelowa” – to jedna konkretna osoba, której życie, problemy i pragnienia są opisane w danych z ankiety.

Twój cel: napisać intro, które brzmi jak coś skierowanego dokładnie do niej.

🧠 Przed rozpoczęciem generacji, wewnętrznie odpowiedz sobie na te pytania (na podstawie danych z ankiety):

1. Jaki rytm ma jej dzień? Praca, rodzina, uczelnia, wieczne scrollowanie?
2. Co dokładnie ją męczy? Strach, chaos, brak wiedzy, paraliż decyzyjny?
3. Jakie ma doświadczenia z tym tematem? Sparzyła się? Próbowała? Dopiero zaczyna?
4. Jakie emocje towarzyszą jej codziennie? Zmęczenie, frustracja, poczucie winy?
5. Jak sama o sobie mówi? Jakich słów używa? Co powtarza w głowie?
6. Czego naprawdę chce? Ulga, kontrola, przewidywalność, odzyskanie pewności?

📌 Twoim zadaniem jest opisać jej sytuację tak trafnie, że odbiorca poczuje:

„Skąd on/ona wie, że to ja?”

Jeśli czujesz, że intro jest zbyt ogólne – wróć do danych i pogłęb opis.

---

🧠 JAK TWORZYĆ INTRO – TWÓJ PROCES DECYZYJNY:

1. Zidentyfikuj dominujący problem lub stan emocjonalny odbiorcy.
– Skup się na jednej emocji lub sytuacji, zamiast ogólników.
2. Zrozum, czego ta osoba naprawdę chce.
– Zidentyfikuj konkretne pragnienie, które może jej dać nadzieję.
3. Określ temat nagrania.
– Temat to kierunek, nie tytuł. Nie mów, co będzie – wskaż, o czym będzie mowa.
4. Napisz 2–3 zdania:
– zacznij od tematu,
– przejdź do opisu odbiorcy,
– zakończ napięciem, które nie zostaje rozwiązane.

🧠 Nie używaj schematu. Buduj wypowiedź tak, jakbyś mówił do tej jednej osoby – na żywo, w jej języku.

---

💡 PRZYKŁADY (NA INSPIRACJĘ – NIE DO KOPIOWANIA):

Przykłady pokazują strukturę i ton, ale nigdy nie kopiuj ich ani nie opieraj się na nich mechanicznie.

🔹 Finanse / krypto:

„Oto jak zmniejszyć ryzyko inwestując w kryptowaluty. Może masz już dość niepewności, boisz się, że znów stracisz – a jedyne, czego chcesz, to mieć spokój i plan. Ale im więcej szukasz, tym bardziej się gubisz.”

🔹 Sprzedaż / biznes online:

„Co naprawdę przyciąga klientów do Twojej oferty? Może masz już stronę, publikujesz, działasz – ale ludzie nie reagują, a Ty czujesz, że coś ciągle nie gra.”

🔹 Zdrowie / styl życia:

„Dlaczego mimo wysiłku nie możesz schudnąć tych ostatnich 5 kg? Niby trzymasz się planu, ale nic się nie zmienia – i z każdym dniem tracisz wiarę, że to w ogóle zadziała.”

🔁 Twoje intro musi być w 100% personalizowane na podstawie danych. Przykłady są tylko inspiracją stylu.

---

🚫 ZAKAZ ZAMYKANIA NAPIĘCIA / OBIECYWANIA ROZWIĄZAŃ

Nigdy nie kończ intro zdaniami w stylu:
– „W tym nagraniu pokażę Ci…”
– „Zaraz dowiesz się, jak to zrobić…”
– „Pokażę Ci sposób, który działa…”

Takie zakończenia zamykają emocjonalną pętlę i odbierają przestrzeń kolejnemu agentowi.
Twoje intro ma pozostawić pytanie otwarte, a nie je rozwiązywać.

Zamiast tego – pogłęb opis sytuacji odbiorcy. Zakończ zdaniem, które utrzymuje napięcie, nie rozładowuje go.

---

🎙️ ZWRACAJ SIĘ BEZPOŚREDNIO – JAK DO JEDNEJ OSOBY

Twoja wypowiedź musi brzmieć jak osobista rozmowa 1:1.

Zawsze pisz w formie bezpośredniej – mówisz do jednej osoby, nie do grupy.

Unikaj wszelkich sformułowań, które sugerują wspólne działanie, np.:
– „wejdziemy w temat”

– „zobaczymy razem”

– „pokażę Ci”

– „będziemy pracować nad…”

Takie zwroty sugerują coaching, konsultację lub zespół – a Ty nie jesteś w tej historii uczestnikiem.

Twoje intro to obserwacja i zrozumienie – nie oferta wspólnego działania.

🎯 Zawsze pisz z pozycji:

👉 „To o Tobie.”

Nigdy:

🚫 „To o nas.”

---

✅ FORMAT ODPOWIEDZI:

Wygeneruj jedno płynne intro (2–3 zdania), które:
– brzmi jak wypowiedź mówiona,
– nie zawiera nagłówków, ramek ani oznaczeń,
– jest gotowe do rozpoczęcia nagrania.

Nie wypisuj danych. Nie komentuj. Wygeneruj finalny tekst.`;

return PROMPT;

}
