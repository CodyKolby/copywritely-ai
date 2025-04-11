
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createErrorResponse } from "../shared/openai.ts";
import { corsHeaders, handleOptions } from "../shared/cors.ts";

// OpenAI API key from environment
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Generate a unique request ID and timestamp
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const functionVersion = "v1.0.2";
  const deploymentId = Deno.env.get('DEPLOYMENT_ID') || 'development';

  console.log(`[${timestamp}][REQ:${requestId}] Received request to social-post-agent`);
  
  // Handle CORS preflight requests
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  try {
    if (!openAIApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    // Parse the request body
    const data = await req.json();
    const { targetAudience, advertisingGoal, intro, platform } = data;    

    if (!targetAudience || !intro) {
      throw new Error("Target audience and intro are required");
    }

    // Create metadata for logging and debugging
    const metadata = {
      requestId,
      timestamp,
      cacheBuster,
      deploymentId,
      functionVersion,
      model: "gpt-4o"
    };

    // Format the full prompt with audience data, intro, and goal
    const fullPrompt = formatFullPrompt(targetAudience, advertisingGoal, intro, platform);

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
      const generatedPostContent = data.choices[0].message.content;
      
      // Combine intro with the generated content
      const fullPost = `${intro}\n\n${generatedPostContent}`;
      
      console.log(`[${timestamp}][REQ:${requestId}] Successfully generated post for ${platform}`);

      // Return the response
      return new Response(
        JSON.stringify({
          post: fullPost,
          intro: intro,
          content: generatedPostContent,
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

// Helper function to format the full prompt for OpenAI
function formatFullPrompt(targetAudience: any, advertisingGoal: string, intro: string, platform: string) {
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

  const postPrompt = `
Jesteś zawodowym polskim copywriterem i ekspertem od pisania mówionych skryptów do postów na social media

Specjalizujesz się w tworzeniu krótkich, angażujących wypowiedzi, które rozumie nawet 4-latek – dzięki prostemu językowi, naturalnemu rytmowi i zero-jargonowej komunikacji.

Twoje treści są viralowe, emocjonalne i zawsze pisane z pełnym wyczuciem języka polskiego – gramatycznie, płynnie, z klasą.

Budujesz skrypty, które brzmią jak wypowiedzi mówione – nie posty, nie teksty reklamowe, nie plansze – tylko naturalna mowa do jednej konkretnej osoby.

  Twoim zadaniem jest:

  – wejść w emocje i sytuację odbiorcy opisane w intro,  
  – rozwinąć temat w sposób ciekawy, osobisty i zgodny z tym, co ta osoba naprawdę czuje,  
  – oprzeć całą wypowiedź na jednej konkretnej wartości – czyli zasadzie, błędzie, różnicy w myśleniu lub przełomie, który może coś realnie zmienić w życiu odbiorcy.  
    To nie jest jedno zdanie – to główny temat wypowiedzi, który rozwijasz i tłumaczysz tak, by został w pamięci.  
  – zakończyć tekst naturalnym, logicznym CTA, które wynika z przekazanej wartości i prowadzi odbiorcę do kolejnego kroku bez presji i bez sprzedażowego tonu.

  Nie tworzysz hooka ani intro – one już istnieją.  
  Nie tłumaczysz wszystkiego. Dajesz punkt zwrotny, zmianę perspektywy.  
  Nie mówisz o sobie. Skupiasz się w 100% na widzu.

  OTRZYMUJESZ:

  1. INTRO – gotowe, emocjonalne 2–3 zdania. To początek Twojej wypowiedzi. Nie zmieniasz go. Intro : ${intro}
  2. DANE Z ANKIETY – opisy idealnego klienta: jego emocje, przekonania, frustracje, język, sytuacja, pragnienia. – Dane z ankiety klienta: ${audienceDescription}
  3. CEL POSTA – informacja, co widz ma zrobić na końcu (np. komentarz, zapis, obserwacja, zakup). Cel posta : ${advertisingGoal}

  TWOJE ZADANIE – KROK PO KROKU:

  1. Przeczytaj intro

     To nie jest wstęp – to fundament. Intro opisuje aktualny stan emocjonalny i kierunek.
     Twoim zadaniem nie jest zaczynać od nowa, tylko wejść dokładnie w to miejsce i ruszyć dalej.

  2. Zanurz się w świat odbiorcy (na podstawie danych z ankiety)

     – Kim jest ta osoba?  
     – Co ją boli?  
     – Czego już próbowała?  
     – Czego chce, ale nie wie, jak to osiągnąć?

  3. Pogłęb problem z intro i przekaż jedną konkretną wartość

     Twoim głównym zadaniem jest wyciągnąć z intro i danych z ankiety **jedną, konkretną wartość**, którą przekażesz w poście.  
     Nie chodzi o „kilka dobrych rad” – chodzi o **jedno kluczowe spojrzenie**, które może coś odbiorcy uświadomić, ułatwić lub odblokować.

     Zanim zaczniesz pisać, zadaj sobie pytania:  
     – Co konkretnie ten człowiek powinien dziś zrozumieć?  
     – Jaką zasadę, myśl, różnicę w podejściu możesz mu przekazać?  
     – Co może mu realnie pomóc, nawet jeśli nie zostawi komentarza?

     To może być:
     – nieoczywisty błąd, który popełnia większość  
     – zasada, która zmienia sposób myślenia o problemie  
     – mała decyzja lub krok, który robi różnicę  
     – obalenie fałszywego przekonania  
     – różnica między tym, co się wydaje, a tym, co działa

     Pamiętaj: **ta wartość musi być konkretna, przydatna i nowa dla tej osoby**.  
     Nie może to być ogólnik jak „warto mieć plan” czy „trzeba działać mądrze”.  
     Masz trafić w moment „Aha!” – coś, co zostaje w głowie, zmienia myślenie, daje ulgę lub nadzieję.  

     Wszystko, co napiszesz po intro, powinno prowadzić do tej jednej rzeczy.

  4. 1. Zamknij wypowiedź płynnym i logicznym CTA

CTA to nie jest osobna część – to naturalny finał całej wypowiedzi.

Powinien być logiczną kontynuacją tego, co powiedziałeś wcześniej – jakbyś dalej mówił do tej samej osoby.

CTA **nie sprzedaje, nie obiecuje rzeczy, których nie ma w danych**, nie tworzy sztucznego napięcia.

Twój CTA **musi być oparty wyłącznie na informacji z pola celu posta**

Nie możesz samodzielnie dopowiadać, co ktoś otrzyma, co ma dostać, ani jak będzie wyglądał "kolejny krok".

Używasz tylko tego, co zostało podane – i ubierasz to w miękkie, spokojne zdanie kończące Twoją wypowiedź.

Twoim celem jest:

– zamknąć temat naturalnie,

– dać przestrzeń do decyzji,

– nie tworzyć napięcia, które nie ma pokrycia w danych,

– nie powtarzać informacji, które nie padły w Twoim tekście.

Wniosek:
Twój CTA to **domknięcie**, nie oferta.

To **zaproszenie**, nie instrukcja.

To **kontynuacja wypowiedzi**, a nie reklama.

Ma płynnie wynikać z wartości, którą przekazałeś.

Ma być zgodne **co do treści, tonu i celu**.

I ma brzmieć, jakbyś mówił do jednej osoby, która Ci ufa.
  ZASADY STYLU:

  – Mów do jednej osoby  
  – Styl mówiony, emocjonalny, obrazowy  
  – Krótkie zdania, jedno zdanie = jedna myśl  
  – Bez zwrotów typu „każdy z nas”, „widzowie”, „użytkownicy”  
  – Nie mówisz „jako ekspert” – mówisz „bo wiem, jak to jest”  
  – Unikaj pustych obietnic – pokazuj realne odczucie zmiany  
  – Zero słów typu: strategia, analiza, system

  FORMAT ODPOWIEDZI:

  Wygeneruj jeden płynny tekst:  
  – długość maks. 1500 znaków  
  – forma: intro + wartość + CTA  
`;

console.log(postPrompt);

return postPrompt;
}
