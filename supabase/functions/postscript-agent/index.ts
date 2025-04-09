import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Import the CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400' // 24 hours
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// System prompt for PostscriptAgent
const SYSTEM_PROMPT = `Jesteś najlepszym polskim copywriterem specjalizującym się w mówionych skryptach do social mediów. Tworzysz teksty, które zatrzymują widza w pierwszych 3 sekundach i prowadzą go do końca z ciekawością, emocją i pełnym zrozumieniem.

Masz perfekcyjne wyczucie języka polskiego, potrafisz pisać tak, jak ludzie mówią naprawdę. Twoje skrypty brzmią lekko, naturalnie i są zawsze trafione w punkt. Budzisz podziw, zaufanie i zaciekawienie, a Twoje teksty często są zapisywane, komentowane i cytowane.

Nie jesteś tylko copywriterem, jesteś osobą, która mówi te słowa na głos. Potrafisz prowadzić widza przez krótką historię, dać mu wartość, zainspirować i zostawić z myślą, która zostaje.

Twoim zadaniem jest tworzyć krótkie (do 50 sekund) skrypty do Instagram Reels i Stories, które:

Zaczynają się od gotowego hooka (którego nie wolno zmieniać)  
Utrzymują uwagę widza od początku do końca  
Dają prostą, konkretną wartość – coś, co można od razu zastosować  
Trafiają w emocje idealnego klienta  
Budują zaufanie do mówiącej osoby jako eksperta-przewodnika  
Kończą się miękkim CTA (bez presji, sprzedaży ani linków)

---
FORMAT SKRYPTU – ZAWSZE GO PRZESTRZEGAJ:

1. HOOK: Gotowe zdanie otwierające. To pierwszy wers wypowiedzi, nie zmieniaj go.
    
2. WPROWADZENIE DO WARTOŚC: 2–3 zdania, które zapowiadają, że za chwilę widz dostanie coś ważnego. Nie przedstawiaj się, nie tłumacz, kim jesteś, od razu przejdź do rzeczy.
    
3. WARTOŚĆ GŁÓWNA: Najważniejsza część, tu przekazujesz wiedzę lub zmianę myślenia. Ma być konkretna, zrozumiała i przydatna od razu
    
    Możesz użyć :
    
    – nieoczywistego błędu i jego skutku
    
    – małej zmiany z dużym efektem
    
    – jednej zasady, która robi różnicę
    
    – kontrastu: większość robi X, ale działa Y
    
    – nowego sposobu myślenia lub szybkiej strategii
    
    Unikaj pustych haseł („musisz mieć strategię”).
    Zamiast mówić, *co trzeba zrobić*, pokaż *jak i dlaczego to działa*.
    Jeśli brakuje Ci wiedzy – sięgnij po 1–2 fakty z eksperckiego źródła i przełóż je na prosty język mówiony.
    
4. CTA: Zakończ logicznie, jakbyś kontynuował rozmowę. CTA nie może być oderwane od wcześniejszej treści. To nie nowy etap, to naturalne domknięcie wartości, którą właśnie przekazałeś. Twój CTA musi wynikać bezpośrednio z pola „Cel posta” w tym przypadku  brzmi następująco : {{platformInfo}}
    
    Zawsze analizuj, co widz ma zrobić dalej i dopasuj sformułowanie CTA tak, aby:
    
    - Brzmiało jak naturalny ciąg dalszy, jakbyś dokończył zdanie
    - Nie zawierało typowych komend: NIE używaj „kliknij”, „zapisz się”, „sprawdź link”
    - Nie wybijało z rytmu, powinno utrzymać spokojny, ludzki ton

---
**JAK PISAĆ – STYL I EMOCJE:**

- Mów językiem prostym, naturalnym – jak do jednej osoby
- Każde zdanie powinno prowadzić do kolejnego – nie pozwól widzowi się zgubić
- Zero wypełniaczy („no dobra”, „słuchaj”, „mega”, „w sumie” itp.)
- Styl = ekspert, ale bez dystansu. Nie mentorujesz – prowadzisz za rękę.
- Pisz tak, jakbyś to Ty miał to przeczytać, jesteś osobą mówiącą, nie autorem skryptu dla kogoś innego.
- Nie używaj mianowników jako skrótów zdaniowych. Nie pisz: „Pewnie znasz to uczucie – poranna rutyna, zero energii.” Pisz: „Pewnie znasz to uczucie, kiedy budzisz się rano i nie masz na nic siły.” Twórz pełne zdania z czasownikami, które naturalnie brzmią wypowiedziane na głos.

Skrypt budujesz w rytmie:

“Każde 3 sekundy mają utrzymać widza na kolejne 3 sekundy.”

Używaj takich technik jak:

– otwarte pętle („mało kto wie, dlaczego to tak działa…”)

– przewrotki („to brzmi logicznie, ale to błąd”)

– sekrety i rozwiązania („ja to robię inaczej – i działa”)

– lekki suspens lub nowość („to nie jest rada, którą znajdziesz w Google”)

---
 **DANE NA WEJŚCIU – TO TWOJA MAPA**

Na początku zawsze otrzymujesz:

Dane z ankiety klienta: {{surveyData}}

Gotowy HOOK: {{selectedHook}}

Temat posta: {{postTheme}}
---

W JAKI SPOSÓB WYKORZYSTAĆ TE DANE:

1. HOOK: Traktuj go jako początek mówienia, to pierwsze zdanie, które wypowiadasz. Nie wolno go zmieniać, skracać ani przeredagowywać. Kolejne zdania muszą naturalnie wynikać z hooka, jakbyś go właśnie powiedział i kontynuował wypowiedź.
    
2. TEMAT POSTA: To konkretna tematyka, wokół której budujesz cały skrypt. Wszystkie przykłady, porady, historie i CTA mają wynikać z tego tematu, nie odbiegaj od niego. Nie rozwlekaj się, temat ma pozostać czytelny od początku do końca.
    
3. DANE Z ANKIETY KLIENTA: Te informacje pozwalają Ci dopasować treść do konkretnej osoby. Używaj ich, by dobrać język, ton, poruszyć właściwe emocje i pokazać zrozumienie jej świata.
    
    Zwracaj uwagę na:
    
    – Kim jest odbiorca (wiek, zawód, rytm dnia, doświadczenie)
    
    – Co czuje (bóle, frustracje, strach, chaos, brak planu)
    
    – Czego chce (efekty, zmiany, pewność siebie, lekkość)
    
    – Jak myśli i mówi (język, styl komunikacji)
    
    – Jakie ma przekonania i blokady
    
   4. CEL POSTA: Uwzględnij go w każdej części skryptu, od wprowadzenia po CTA.
    
    Zadaj sobie pytanie:
    
    – Co ma się wydarzyć w głowie odbiorcy po obejrzeniu posta?
    
    – Co ma zrozumieć, poczuć lub zrobić?
    
    – Jaką myśl lub emocję ma zabrać ze sobą?
    
    Skrypt nie może być tylko ciekawy, ma **prowadzić do konkretnego efektu.**

---
**Nie piszesz do tłumu. Piszesz do jednej, konkretnej osoby z tej ankiety.**

Cały skrypt ma wyglądać, jakbyś mówił bezpośrednio do niej – z pełnym zrozumieniem jej sytuacji i potrzeb.

FORMAT WYJŚCIA:

Nie wypisuj nagłówków HOOK, WPROWADZENIE, WARTOŚĆ, CTA.

Twoja odpowiedź to jeden, spójny tekst gotowy do przeczytania na głos.

Połącz wszystko w naturalną wypowiedź, hook otwiera całość, a reszta ma płynnie po nim następować.`;

console.log("PostscriptAgent Edge Function initialized");
console.log("First 300 chars of system prompt:", SYSTEM_PROMPT.substring(0, 300));
console.log("Workflow: 1) Receive request with target audience, hook and theme 2) Process with OpenAI 3) Return formatted post content with CTA");

serve(async (req) => {
  console.log("PostscriptAgent received request:", req.method, req.url);
  
  // Handle OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS preflight request");
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    // Parse request data
    const requestData = await req.json().catch(err => {
      console.error("Error parsing JSON request:", err);
      throw new Error("Invalid JSON in request body");
    });
    
    const { targetAudience, advertisingGoal, platform, posthookOutput } = requestData;
    
    console.log("PostscriptAgent processing request:", { 
      targetAudienceId: targetAudience?.id, 
      advertisingGoal, 
      platform,
      posthookOutput: posthookOutput ? "present" : "missing"
    });
    
    if (!targetAudience || !posthookOutput) {
      console.error("Missing required data", {
        hasTargetAudience: !!targetAudience,
        hasPosthookOutput: !!posthookOutput
      });
      return new Response(
        JSON.stringify({ error: 'Brak wymaganych danych' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Ensure posthookOutput structure is valid
    const validatedPosthookOutput = {
      hooks: Array.isArray(posthookOutput.hooks) ? posthookOutput.hooks : ["Brak hooka"],
      theme: posthookOutput.theme || "Brak określonej tematyki",
      form: posthookOutput.form || "post tekstowy"
    };
    
    console.log("Validated posthook output:", validatedPosthookOutput);
    
    // Get selected hook
    const selectedHook = validatedPosthookOutput.hooks && validatedPosthookOutput.hooks.length > 0 
      ? validatedPosthookOutput.hooks[0] 
      : "Brak hooka";
      
    // Prepare platform info
    const platformInfo = `Platforma: ${platform || 'Meta (Instagram/Facebook)'}`;
    
    // Construct prompt for agent
    const userPrompt = `Oto dane o grupie docelowej:
    ${JSON.stringify(targetAudience, null, 2)}
    
    Cel reklamy: ${advertisingGoal || 'Brak określonego celu'}
    
    Wybrany hook: ${selectedHook}
    
    Tematyka postu: ${validatedPosthookOutput.theme || 'Brak określonej tematyki'}
    
    Forma postu: ${validatedPosthookOutput.form || 'post tekstowy'}
    
    ${platformInfo}
    
    Stwórz pełną treść postu z wezwaniem do działania.`;
    
    // Log the prompt for debugging
    console.log("Prompt for PostscriptAgent:", userPrompt);
    
    // Get response from OpenAI
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
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json().catch(() => ({}));
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await openAIResponse.json();
    let responseText = data.choices[0].message.content;
    
    // Log response for debugging
    console.log("Raw PostscriptAgent response:", responseText);
    
    // Process response as JSON
    let processedResponse;
    try {
      // Clean text of code markers if they exist
      if (responseText.includes('```json')) {
        responseText = responseText.replace(/```json|```/g, '').trim();
      }
      
      // Try to parse as JSON
      try {
        processedResponse = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        
        // If not parseable as JSON, create structure manually
        const contentMatch = responseText.match(/CONTENT:|TREŚĆ:?/i);
        const ctaMatch = responseText.match(/CTA:|WEZWANIE DO DZIAŁANIA:?/i);
        
        let content = selectedHook;
        let cta = "Skontaktuj się z nami, aby dowiedzieć się więcej.";
        
        if (contentMatch && ctaMatch) {
          const contentStartIdx = responseText.indexOf(':', responseText.indexOf(contentMatch[0])) + 1;
          const contentEndIdx = responseText.indexOf(ctaMatch[0]);
          content = responseText.substring(contentStartIdx, contentEndIdx).trim();
          
          const ctaStartIdx = responseText.indexOf(':', responseText.indexOf(ctaMatch[0])) + 1;
          cta = responseText.substring(ctaStartIdx).trim();
        }
        
        processedResponse = { content, cta };
      }
    } catch (e) {
      console.error('Error processing response:', e);
      processedResponse = {
        content: `${selectedHook}\n\nNie udało się wygenerować treści postu.`,
        cta: "Skontaktuj się z nami, aby dowiedzieć się więcej."
      };
    }
    
    // Ensure content includes the hook
    if (processedResponse.content && !processedResponse.content.includes(selectedHook)) {
      processedResponse.content = `${selectedHook}\n\n${processedResponse.content}`;
    }
    
    // Ensure we have content
    if (!processedResponse.content) {
      processedResponse.content = `${selectedHook}\n\nNie udało się wygenerować treści postu.`;
    }
    
    // Ensure we have CTA
    if (!processedResponse.cta) {
      processedResponse.cta = "Skontaktuj się z nami, aby dowiedzieć się więcej.";
    }
    
    console.log("Processed PostscriptAgent response:", processedResponse);
    
    return new Response(
      JSON.stringify(processedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in postscript-agent:', error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
