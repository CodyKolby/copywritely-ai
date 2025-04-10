
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Import the CORS headers with expanded allowed headers
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

// ===== EDITABLE PROMPT BEGINS HERE =====
// Feel free to customize this prompt according to your needs
const SYSTEM_PROMPT = `Twoim jedynym zadaniem jest napisać "TESTHOOK45"`;
// ===== EDITABLE PROMPT ENDS HERE =====

// Force redeployment marker: v1.0.5
const FUNCTION_VERSION = "v1.0.5";

// Log the prompt and version on function initialization
console.log(`[STARTUP] PosthookAgent Edge Function initialized with version ${FUNCTION_VERSION}`);
console.log(`[STARTUP] Current system prompt: "${SYSTEM_PROMPT}"`);

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = new Date().toISOString();
  console.log(`[${startTime}][REQ:${requestId}] PosthookAgent received request:`, req.method, req.url);
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
    
    // Construct prompt with survey data
    const userPrompt = `Timestamp to avoid caching: ${startTime}
    Random value to break cache: ${Math.random().toString(36).substring(2, 15)}
    Request ID: ${requestId}
    
    Oto dane o grupie docelowej:
    ${JSON.stringify(targetAudience, null, 2)}
    
    Cel reklamy: ${advertisingGoal || 'Brak określonego celu'}
    
    ${platformInfo}
    
    Stwórz hook, określ tematykę i formę postu.`;
    
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
        model: 'gpt-4o-mini',
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
    console.log(`[${startTime}][REQ:${requestId}] Raw PosthookAgent response:`, responseText);
    
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
      console.error(`[${startTime}][REQ:${requestId}] Error processing response:`, e);
      processedResponse = {
        hooks: ["Nie udało się wygenerować hooków"],
        theme: "Nie udało się określić tematyki",
        form: "post tekstowy"
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
    
    console.log(`[${startTime}][REQ:${requestId}] Processed PosthookAgent response:`, processedResponse);
    
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
    console.error(`[${timestamp}][REQ:${requestId}] Error in posthook-agent:`, error);
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
