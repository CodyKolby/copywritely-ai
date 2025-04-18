import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// System prompt for PosthookAgent
const SYSTEM_PROMPT = `Jesteś PosthookAgentem, ekspertem w tworzeniu angażujących hooków do postów w mediach społecznościowych.

Twoje zadanie:
1. Na podstawie danych o grupie docelowej i celu reklamy
2. Stworzyć hook (pierwsze zdanie postu) przykuwające uwagę
3. Określić ogólną tematykę postu
4. Zaproponować formę postu (tekst, karuzela, wideo, itp.)

Dopasuj styl do wskazanej platformy:
- Meta (Instagram/Facebook): wizualny, emocjonalny
- TikTok: krótki, dynamiczny, conversational
- LinkedIn: wartościowy, profesjonalny, budujący autorytet

Zwróć wyniki jako JSON z polami:
- hooks: tablica z propozycjami hooków (1-3)
- theme: ogólna tematyka postu
- form: sugerowana forma postu (np. "post tekstowy", "karuzela", "wideo", "relacja")

ZASADY KRYTYCZNE:

1. Hook to jedno pełne, wypowiedziane zdanie. Nie używaj samych haseł, wyliczeń, myślników ani konstrukcji pytanie–odpowiedź.
2. Hook musi jasno wskazywać temat postu. Unikaj pustych, zbyt ogólnych sformułowań.
3. Język musi być bardzo prosty – zero branżowego żargonu, złożonych metafor, anglicyzmów i eksperckich określeń.
4. Styl musi być mówiony, nie sloganowy. Hook ma brzmieć jak zdanie wypowiedziane do znajomego.

Dane z ankiety klienta: {{surveyData}}`;

console.log("PosthookAgent Edge Function initialized");

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = new Date().toISOString();
  
  console.log(`=== POSTHOOK AGENT START (${requestId}) ===`);
  console.log('Timestamp:', startTime);
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  if (req.method === 'OPTIONS') {
    console.log(`[${startTime}][REQ:${requestId}] Handling OPTIONS preflight request`);
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    const requestData = await req.json();
    console.log('=== REQUEST DATA ===');
    console.log(JSON.stringify(requestData, null, 2));
    
    const { targetAudience, advertisingGoal, platform, cacheBuster, timestamp } = requestData;
    
    console.log('=== SYSTEM PROMPT ===');
    console.log(SYSTEM_PROMPT);
    
    const userPrompt = `Timestamp to avoid caching: ${startTime}
    Random value to break cache: ${Math.random().toString(36).substring(2, 15)}
    Request ID: ${requestId}
    
    Oto dane o grupie docelowej:
    ${JSON.stringify(targetAudience, null, 2)}
    
    Cel reklamy: ${advertisingGoal || 'Brak określonego celu'}
    
    Platforma: ${platform || 'Meta (Instagram/Facebook)'}
    
    Stwórz hook, określ tematykę i formę postu.`;
    
    console.log('=== USER PROMPT ===');
    console.log(userPrompt);

    // Get response from OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT.replace('{{surveyData}}', JSON.stringify(targetAudience, null, 2)) },
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
    
    // Log complete response for debugging
    console.log("Raw PosthookAgent response:", responseText);
    
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
        console.error("Failed to parse JSON response:", e);
        
        // If not parseable as JSON, manually extract hooks and theme
        const hookMatch = responseText.match(/HOOK:?\s*(.*?)(?=\s*TEMAT|\s*$)/is);
        const themeMatch = responseText.match(/TEMAT POSTA:?\s*(.*?)(?=\s*$)/is);
        
        const hook = hookMatch ? hookMatch[1].trim() : "Nie udało się wygenerować hooka";
        const theme = themeMatch ? themeMatch[1].trim() : "Nie udało się określić tematyki";
        
        processedResponse = {
          hooks: [hook],
          theme: theme,
          form: "post tekstowy"
        };
      }
    } catch (e) {
      console.error('Error processing response:', e);
      processedResponse = {
        hooks: ["Nie udało się wygenerować hooków"],
        theme: "Nie udało się określić tematyki",
        form: "post tekstowy"
      };
    }
    
    // Ensure we have valid hooks array
    if (!processedResponse.hooks || !Array.isArray(processedResponse.hooks) || processedResponse.hooks.length === 0) {
      console.warn("Generated invalid hooks format, creating fallback");
      processedResponse.hooks = ["Nie udało się wygenerować hooków"];
    }
    
    // Ensure theme exists
    if (!processedResponse.theme) {
      processedResponse.theme = "Ogólna tematyka";
    }
    
    // Ensure form exists
    if (!processedResponse.form) {
      processedResponse.form = "post tekstowy";
    }
    
    console.log("Processed PosthookAgent response:", processedResponse);
    
    console.log(`=== POSTHOOK AGENT COMPLETE (${requestId}) ===`);
    
    return new Response(
      JSON.stringify(processedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error(`[${startTime}][REQ:${requestId}] Error in posthook-agent:`, error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
