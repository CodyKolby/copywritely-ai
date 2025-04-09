
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Expanded CORS headers to accept all necessary custom headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma, expires, x-no-cache, x-cache-buster, x-timestamp, x-random',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400', // 24 hours
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Define a clear, customizable system prompt for the SocialHookAgent
// ===== EDITABLE PROMPT BEGINS HERE =====
// Feel free to customize this prompt according to your needs
const SYSTEM_PROMPT = `Jesteś doświadczonym specjalistą od mediów społecznościowych i marketingu. 
Twoim zadaniem jest stworzenie angażujących hooków (pierwsze zdania) do postów w mediach społecznościowych, które przyciągną uwagę określonej grupy docelowej.

Bazując na dostarczonych informacjach o grupie docelowej i celu reklamy, stwórz trzy różne, chwytliwe hooki, które będą skutecznie angażować odbiorców.

Dodatkowo określ ogólną tematykę, która najlepiej rezonuje z tą grupą docelową, oraz zaproponuj optymalną formę postu (np. karuzela, post tekstowy, wideo, itp.).

Odpowiedź podaj w formacie JSON:
{
  "hooks": ["hook1", "hook2", "hook3"],
  "theme": "Ogólna tematyka, która powinna zainteresować grupę docelową",
  "form": "Zalecana forma postu",
  "cta": "Sugerowane wezwanie do działania"
}`;
// ===== EDITABLE PROMPT ENDS HERE =====

// Version tracking to help detect updates
const FUNCTION_VERSION = "v1.0.0";

console.log(`[STARTUP] SocialHookAgent initialized with version ${FUNCTION_VERSION}`);
console.log(`[STARTUP] Current system prompt: "${SYSTEM_PROMPT}"`);

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = new Date().toISOString();
  console.log(`[${startTime}][REQ:${requestId}] SocialHookAgent received request:`, req.method, req.url);
  console.log(`[${startTime}][REQ:${requestId}] Using function version: ${FUNCTION_VERSION}`);
  console.log(`[${startTime}][REQ:${requestId}] Current system prompt: "${SYSTEM_PROMPT}"`);
  
  // Handle OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    console.log(`[${startTime}][REQ:${requestId}] Handling OPTIONS preflight request`);
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    // Parse request data
    const requestData = await req.json().catch(err => {
      console.error(`[${startTime}][REQ:${requestId}] Error parsing JSON request:`, err);
      throw new Error("Invalid JSON in request body");
    });
    
    const { targetAudience, advertisingGoal, platform, cacheBuster, timestamp } = requestData;
    
    console.log(`[${startTime}][REQ:${requestId}] Processing request:`, { 
      targetAudienceId: targetAudience?.id, 
      advertisingGoal, 
      platform,
      timestamp: timestamp || startTime,
      cacheBuster: cacheBuster || 'none'
    });
    
    if (!targetAudience) {
      console.error(`[${startTime}][REQ:${requestId}] Missing target audience data`);
      return new Response(
        JSON.stringify({ error: 'Brak danych o grupie docelowej' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Prepare platform info
    const platformInfo = `Platforma: ${platform || 'Meta (Instagram/Facebook)'}`;
    
    // Construct prompt with provided data
    const userPrompt = `Timestamp to avoid caching: ${startTime}
    Random value to break cache: ${Math.random().toString(36).substring(2, 15)}
    Request ID: ${requestId}
    
    Oto dane o grupie docelowej:
    ${JSON.stringify(targetAudience, null, 2)}
    
    Cel reklamy: ${advertisingGoal || 'Brak określonego celu'}
    
    ${platformInfo}
    
    Bazując na powyższych informacjach, stwórz 3 angażujące hooki, określ tematykę oraz najlepszą formę posta w social media.`;
    
    // Log the prompt for debugging
    console.log(`[${startTime}][REQ:${requestId}] SYSTEM PROMPT BEING USED:`, SYSTEM_PROMPT);
    console.log(`[${startTime}][REQ:${requestId}] USER PROMPT BEING USED:`, userPrompt);
    
    // Add anti-caching measures
    const requestTimestamp = timestamp || new Date().toISOString();
    const cacheBusterValue = cacheBuster || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Get response from OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Cache-Buster': cacheBusterValue,
        'X-Timestamp': requestTimestamp,
        'X-Random': Math.random().toString(36).substring(2, 15),
        'X-Request-ID': requestId
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
      console.error(`[${startTime}][REQ:${requestId}] OpenAI API error:`, errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await openAIResponse.json();
    let responseText = data.choices[0].message.content;
    
    // Log complete response for debugging
    console.log(`[${startTime}][REQ:${requestId}] Raw SocialHookAgent response:`, responseText);
    
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
        console.error(`[${startTime}][REQ:${requestId}] Failed to parse JSON response:`, e);
        
        // If not parseable as JSON, manually extract hooks, theme and form
        const hooksMatch = responseText.match(/hooks.*?[\[\{]([^\]\}]+)[\]\}]/is);
        const themeMatch = responseText.match(/theme["\s:]+([^"]+)["]/is);
        const formMatch = responseText.match(/form["\s:]+([^"]+)["]/is);
        const ctaMatch = responseText.match(/cta["\s:]+([^"]+)["]/is);
        
        // Extract hooks
        let hooks = [];
        if (hooksMatch && hooksMatch[1]) {
          hooks = hooksMatch[1].split(',').map(h => h.replace(/["]/g, '').trim());
          if (hooks.length === 0) {
            hooks = ["Nie udało się wygenerować hooków"];
          }
        } else {
          hooks = ["Nie udało się wygenerować hooków"];
        }
        
        processedResponse = {
          hooks: hooks,
          theme: themeMatch ? themeMatch[1].trim() : "Nie udało się określić tematyki",
          form: formMatch ? formMatch[1].trim() : "post tekstowy",
          cta: ctaMatch ? ctaMatch[1].trim() : "Sprawdź więcej"
        };
      }
    } catch (e) {
      console.error(`[${startTime}][REQ:${requestId}] Error processing response:`, e);
      processedResponse = {
        hooks: ["Nie udało się wygenerować hooków"],
        theme: "Nie udało się określić tematyki",
        form: "post tekstowy",
        cta: "Sprawdź więcej"
      };
    }
    
    // Ensure we have valid hooks array
    if (!processedResponse.hooks || !Array.isArray(processedResponse.hooks) || processedResponse.hooks.length === 0) {
      console.warn(`[${startTime}][REQ:${requestId}] Generated invalid hooks format, creating fallback`);
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
    
    // Ensure CTA exists
    if (!processedResponse.cta) {
      processedResponse.cta = "Sprawdź więcej";
    }
    
    // Add test hooks for verification purposes
    if (requestData.testMode === true || requestData.test === true) {
      console.log(`[${startTime}][REQ:${requestId}] Test mode detected, adding test hooks`);
      processedResponse.hooks.push("TESTHOOK4");
      processedResponse.testMode = true;
    }
    
    console.log(`[${startTime}][REQ:${requestId}] Processed SocialHookAgent response:`, processedResponse);
    
    // Add version info to help track which version is running
    processedResponse.version = FUNCTION_VERSION;
    processedResponse.promptUsed = SYSTEM_PROMPT;
    processedResponse.requestId = requestId;
    
    return new Response(
      JSON.stringify(processedResponse),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } 
      }
    );
    
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}][REQ:${requestId}] Error in social-hook-agent:`, error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error", 
        version: FUNCTION_VERSION,
        promptUsed: SYSTEM_PROMPT,
        timestamp: timestamp,
        requestId: requestId
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } 
      }
    );
  }
});
