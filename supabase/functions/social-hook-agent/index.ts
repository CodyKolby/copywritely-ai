
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../shared/cors.ts";
import { generateDeploymentId, generateCacheBuster, getCurrentTimestamp } from "../shared/utils.ts";
import { callOpenAI, createErrorResponse } from "../shared/openai.ts";
import { processHookResponse, constructHookPrompt } from "./hook-service.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const socialHookPrompt = Deno.env.get('SOCIAL_HOOK_PROMPT');

// Version tracking to help detect updates - increment this when making changes
const FUNCTION_VERSION = "v1.9.1";

// Generate a deployment ID to track specific deployments
const DEPLOYMENT_ID = generateDeploymentId();

// Define a hardcoded prompt to use
const HARDCODED_PROMPT = `
Jesteś ekspertem od tworzenia mówionych wprowadzeń do Instagram Reels i Stories.
Twoją specjalizacją są krótkie, emocjonalne otwarcia (intro), które przyciągają uwagę i sprawiają, że widz zostaje na kolejne sekundy.

Twoje intro ma:
– jasno wskazywać temat nagrania,
– opisywać aktualny stan widza,
– budować napięcie i ciekawość,
– nie zdradzać żadnych rozwiązań.

📌 To nie jest klasyczny hook. To intro, które ma płynnie przejść w wartość przygotowaną przez kolejnego agenta.

---

📥 CO DOSTAJESZ:

Otrzymujesz dane z ankiety : {{surveyData}}

Z tych danych tworzysz wypowiedź tak, jakbyś mówił ją do jednej, konkretnej osoby.

Nigdy nie piszesz do ogólnej grupy odbiorców.

Twój tekst musi być maksymalnie dopasowany do języka, emocji i sytuacji tej jednej osoby.

Nie kopiuj danych dosłownie – przekształć je na naturalne, mówione zdania.

---

🎯 ZROZUM SWOJEGO ODBIORCĘ – TARGET VIEWER (NA PODSTAWIE DANYCH Z ANKIETY)

Zanim napiszesz choć jedno zdanie, musisz dokładnie zrozumieć, do kogo mówisz.

Twój widz to nie „grupa docelowa" – to jedna konkretna osoba, której życie, problemy i pragnienia są opisane w danych z ankiety.

Twój cel: napisać intro, które brzmi jak coś skierowanego dokładnie do niej.

🧠 Przed rozpoczęciem generacji, wewnętrznie odpowiedz sobie na te pytania (na podstawie danych z ankiety):

1. Jaki rytm ma jej dzień? Praca, rodzina, uczelnia, wieczne scrollowanie?
2. Co dokładnie ją męczy? Strach, chaos, brak wiedzy, paraliż decyzyjny?
3. Jakie ma doświadczenia z tym tematem? Sparzyła się? Próbowała? Dopiero zaczyna?
4. Jakie emocje towarzyszą jej codziennie? Zmęczenie, frustracja, poczucie winy?
5. Jak sama o sobie mówi? Jakich słów używa? Co powtarza w głowie?
6. Czego naprawdę chce? Ulga, kontrola, przewidywalność, odzyskanie pewności?

📌 Twoim zadaniem jest opisać jej sytuację tak trafnie, że odbiorca poczuje:

„Skąd on/ona wie, że to ja?"

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

„Oto jak zmniejszyć ryzyko inwestując w kryptowaluty. Może masz już dość niepewności, boisz się, że znów stracisz – a jedyne, czego chcesz, to mieć spokój i plan. Ale im więcej szukasz, tym bardziej się gubisz."

🔹 Sprzedaż / biznes online:

„Co naprawdę przyciąga klientów do Twojej oferty? Może masz już stronę, publikujesz, działasz – ale ludzie nie reagują, a Ty czujesz, że coś ciągle nie gra."

🔹 Zdrowie / styl życia:

„Dlaczego mimo wysiłku nie możesz schudnąć tych ostatnich 5 kg? Niby trzymasz się planu, ale nic się nie zmienia – i z każdym dniem tracisz wiarę, że to w ogóle zadziała."

🔁 Twoje intro musi być w 100% personalizowane na podstawie danych. Przykłady są tylko inspiracją stylu.

---

🚫 ZAKAZ ZAMYKANIA NAPIĘCIA / OBIECYWANIA ROZWIĄZAŃ

Nigdy nie kończ intro zdaniami w stylu:
– „W tym nagraniu pokażę Ci…"
– „Zaraz dowiesz się, jak to zrobić…"
– „Pokażę Ci sposób, który działa…"

Takie zakończenia zamykają emocjonalną pętlę i odbierają przestrzeń kolejnemu agentowi.
Twoje intro ma pozostawić pytanie otwarte, a nie je rozwiązywać.

Zamiast tego – pogłęb opis sytuacji odbiorcy. Zakończ zdaniem, które utrzymuje napięcie, nie rozładowuje go.

---

🎙️ ZWRACAJ SIĘ BEZPOŚREDNIO – JAK DO JEDNEJ OSOBY

Twoja wypowiedź musi brzmieć jak osobista rozmowa 1:1.

Zawsze pisz w formie bezpośredniej – mówisz do jednej osoby, nie do grupy.

Unikaj wszelkich sformułowań, które sugerują wspólne działanie, np.:
– „wejdziemy w temat"

– „zobaczymy razem"

– „pokażę Ci"

– „będziemy pracować nad…"

Takie zwroty sugerują coaching, konsultację lub zespół – a Ty nie jesteś w tej historii uczestnikiem.

Twoje intro to obserwacja i zrozumienie – nie oferta wspólnego działania.

🎯 Zawsze pisz z pozycji:

👉 „To o Tobie."

Nigdy:

🚫 „To o nas."

---

✅ FORMAT ODPOWIEDZI:

Wygeneruj jedno płynne intro (2–3 zdania), które:
– brzmi jak wypowiedź mówiona,
– nie zawiera nagłówków, ramek ani oznaczeń,
– jest gotowe do rozpoczęcia nagrania.

Nie wypisuj danych. Nie komentuj. Wygeneruj finalny tekst.
`;

// Log startup information
console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] SocialHookAgent initialized with version ${FUNCTION_VERSION}`);
console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] Using HARDCODED prompt length: ${HARDCODED_PROMPT.length} characters`);
console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] Hardcoded prompt full: ${HARDCODED_PROMPT}`);

// Check if there's an environment variable prompt
if (socialHookPrompt) {
  console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] Found SOCIAL_HOOK_PROMPT env variable of length: ${socialHookPrompt.length}`);
  console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] ENV prompt first 100 chars: ${socialHookPrompt.substring(0, 100)}`);
  console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] !!! We will IGNORE this and use HARDCODED_PROMPT instead !!!`);
} else {
  console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] No SOCIAL_HOOK_PROMPT env variable found, using hardcoded prompt`);
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = getCurrentTimestamp();
  console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] SocialHookAgent received request:`, req.method, req.url);
  console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Using function version: ${FUNCTION_VERSION}, deployment: ${DEPLOYMENT_ID}`);
  
  // Handle OPTIONS requests for CORS preflight
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  try {
    // Log full request headers for debugging cache issues
    const headersLog = {};
    req.headers.forEach((value, key) => {
      headersLog[key] = value;
    });
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Request headers:`, JSON.stringify(headersLog));
    
    // Parse request data
    const requestData = await req.json().catch(err => {
      console.error(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Error parsing JSON request:`, err);
      throw new Error("Invalid JSON in request body");
    });
    
    const { targetAudience, advertisingGoal, platform, cacheBuster, timestamp } = requestData;
    
    if (!targetAudience) {
      console.error(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Missing target audience data`);
      return new Response(
        JSON.stringify({ error: 'Brak danych o grupie docelowej' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Use hardcoded prompt - FORCE THIS
    const SYSTEM_PROMPT = HARDCODED_PROMPT;
    
    // Log prompt information
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] PROMPT SOURCE: HARDCODED_IN_CODE v${FUNCTION_VERSION}`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] SYSTEM PROMPT LENGTH: ${SYSTEM_PROMPT.length} characters`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] SYSTEM PROMPT FULL:\n${SYSTEM_PROMPT}`);
    
    // Construct user prompt
    const userPrompt = constructHookPrompt(requestData, requestId, DEPLOYMENT_ID, FUNCTION_VERSION);
    
    // Add anti-caching measures
    const requestTimestamp = timestamp || startTime;
    const cacheBusterValue = generateCacheBuster(requestId, DEPLOYMENT_ID);
    
    // Call OpenAI with additional headers to prevent caching
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Calling OpenAI API with model: gpt-4o-mini`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Cache buster: ${cacheBusterValue}`);
    
    const data = await callOpenAI(userPrompt, SYSTEM_PROMPT, openAIApiKey, {
      requestId,
      timestamp: requestTimestamp,
      cacheBuster: cacheBusterValue,
      deploymentId: DEPLOYMENT_ID,
      functionVersion: FUNCTION_VERSION,
      model: 'gpt-4o-mini',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-No-Cache': Date.now().toString()
      }
    });
    
    const responseText = data.choices[0].message.content;
    
    // Log complete response for debugging
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Raw response length: ${responseText.length} chars`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Raw response full:\n${responseText}`);
    
    // SIMPLIFY: Now we directly use the response as finalIntro
    const finalIntro = responseText.trim();
    
    // Create simplified response
    const processedResponse = {
      finalIntro,
      version: FUNCTION_VERSION,
      deploymentId: DEPLOYMENT_ID,
      promptSource: 'HARDCODED_IN_CODE',
      promptUsed: SYSTEM_PROMPT,
      requestId: requestId
    };
    
    // Add test hooks for verification purposes
    if (requestData.testMode === true || requestData.test === true) {
      console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Test mode detected, adding test data`);
      processedResponse.testMode = true;
    }
    
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Returning processed response with finalIntro:`, finalIntro.substring(0, 50) + (finalIntro.length > 50 ? '...' : ''));
    
    return new Response(
      JSON.stringify(processedResponse),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Function-Version': FUNCTION_VERSION,
          'X-Deployment-Id': DEPLOYMENT_ID,
          'X-Cache-Buster': Date.now().toString(),
          'X-Prompt-Source': 'HARDCODED_IN_CODE'
        } 
      }
    );
    
  } catch (error) {
    const timestamp = getCurrentTimestamp();
    console.error(`[${timestamp}][REQ:${requestId}][${FUNCTION_VERSION}] Error in social-hook-agent:`, error);
    
    return createErrorResponse(error, {
      version: FUNCTION_VERSION,
      deploymentId: DEPLOYMENT_ID,
      timestamp: timestamp,
      requestId: requestId,
      debug: {
        promptSource: 'HARDCODED_IN_CODE',
        hardcodedPrompt: HARDCODED_PROMPT
      }
    });
  }
});
