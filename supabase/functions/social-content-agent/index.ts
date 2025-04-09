
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

// Define a clear, customizable system prompt for the SocialContentAgent
// ===== EDITABLE PROMPT BEGINS HERE =====
// Feel free to customize this prompt according to your needs
const SYSTEM_PROMPT = `Napisz mi słowo "TESTKOKOL"`;
// ===== EDITABLE PROMPT ENDS HERE =====

// Version tracking to help detect updates
const FUNCTION_VERSION = "v1.0.0";

console.log(`[STARTUP] SocialContentAgent initialized with version ${FUNCTION_VERSION}`);
console.log(`[STARTUP] Current system prompt: "${SYSTEM_PROMPT}"`);

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = new Date().toISOString();
  console.log(`[${startTime}][REQ:${requestId}] SocialContentAgent received request:`, req.method, req.url);
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
    
    console.log(`[${startTime}][REQ:${requestId}] Request data received:`, JSON.stringify(requestData).substring(0, 500));
    
    const { targetAudience, advertisingGoal, platform, hookOutput, cacheBuster, timestamp, selectedHook } = requestData;
    
    console.log(`[${startTime}][REQ:${requestId}] Processing request with:`, { 
      targetAudienceId: targetAudience?.id, 
      advertisingGoal, 
      platform,
      hookOutputPresent: !!hookOutput,
      selectedHook: selectedHook || (hookOutput?.hooks?.[0] || 'Brak hooka'),
      timestamp: timestamp || startTime,
      cacheBuster: cacheBuster || 'none'
    });
    
    if (!targetAudience || !hookOutput) {
      console.error(`[${startTime}][REQ:${requestId}] Missing required data:`, {
        hasTargetAudience: !!targetAudience,
        hasHookOutput: !!hookOutput
      });
      return new Response(
        JSON.stringify({ error: 'Brak wymaganych danych' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[${startTime}][REQ:${requestId}] Target audience data:`, JSON.stringify(targetAudience).substring(0, 300));
    console.log(`[${startTime}][REQ:${requestId}] Hook output:`, JSON.stringify(hookOutput));
    
    // Force a clear timestamp and random value to avoid caching
    const currentTimestamp = timestamp || startTime;
    const randomValue = Math.random().toString(36).substring(2, 15);
    const requestCacheBuster = cacheBuster || `${Date.now()}-${randomValue}`;
    
    // Determine which hook to use
    const hookToUse = selectedHook || hookOutput.hooks[0];
    
    // Construct prompt for agent with our forced timestamp to avoid caching
    const userPrompt = `Timestamp to avoid caching: ${currentTimestamp}
    Random value to break cache: ${requestCacheBuster}
    Request ID: ${requestId}
    
    Oto dane o grupie docelowej:
    ${JSON.stringify(targetAudience, null, 2)}
    
    Cel reklamy: ${advertisingGoal || 'Brak określonego celu'}
    
    Wybrany hook: ${hookToUse}
    
    Tematyka posta: ${hookOutput.theme || 'Brak określonej tematyki'}
    
    Sugerowana forma: ${hookOutput.form || 'post tekstowy'}
    
    Platforma: ${platform || 'Meta (Instagram/Facebook)'}
    
    Wezwanie do działania: ${hookOutput.cta || 'Sprawdź więcej'}`;
    
    // Log the prompts for debugging
    console.log(`[${startTime}][REQ:${requestId}] SYSTEM PROMPT BEING USED:`, SYSTEM_PROMPT);
    console.log(`[${startTime}][REQ:${requestId}] USER PROMPT BEING USED (with anti-cache measures):`, userPrompt);
    
    // Get response from OpenAI with cache-busting headers
    console.log(`[${startTime}][REQ:${requestId}] Sending request to OpenAI API with cache-busting parameters`);
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Request-ID': requestId,
        'X-Timestamp': currentTimestamp,
        'X-Cache-Buster': requestCacheBuster,
        'X-Random': randomValue
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
    
    // Log complete response from API
    console.log(`[${startTime}][REQ:${requestId}] Raw OpenAI response:`, responseText);
    
    // Create a result with the raw response for debugging
    const result = {
      content: responseText,
      selectedHook: hookToUse,
      theme: hookOutput.theme || 'Ogólna tematyka',
      form: hookOutput.form || 'post tekstowy',
      cta: hookOutput.cta || 'Sprawdź więcej',
      platform: platform || 'Meta (Instagram/Facebook)',
      debugInfo: {
        systemPromptUsed: SYSTEM_PROMPT,
        timestamp: startTime,
        requestId: requestId,
        functionVersion: FUNCTION_VERSION
      }
    };
    
    console.log(`[${startTime}][REQ:${requestId}] Final response sent:`, JSON.stringify(result).substring(0, 500));
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          // Add extra no-cache headers to response
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } 
      }
    );
    
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}][REQ:${requestId}] Error in social-content-agent:`, error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error",
        timestamp: timestamp,
        requestId: requestId,
        debugInfo: {
          systemPromptUsed: SYSTEM_PROMPT,
          functionVersion: FUNCTION_VERSION
        }
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
