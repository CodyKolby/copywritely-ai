
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

// Define a clear, customizable system prompt for the PostscriptAgent
// ===== EDITABLE PROMPT BEGINS HERE =====
// Feel free to customize this prompt according to your needs
const SYSTEM_PROMPT = `Twoim jedynym zadaniem jest napisać "TESTSCRIPT"`;
// ===== EDITABLE PROMPT ENDS HERE =====

// Force redeployment marker: v1.0.2
console.log(`PostscriptAgent initialized with version v1.0.2 and prompt: "${SYSTEM_PROMPT.substring(0, 100)}..."`);

serve(async (req) => {
  // Track execution with timestamps and add a unique request ID
  const requestId = crypto.randomUUID();
  const startTime = new Date().toISOString();
  console.log(`[${startTime}][REQ:${requestId}] PostscriptAgent received request:`, req.method, req.url);
  console.log(`[${startTime}][REQ:${requestId}] Current system prompt: "${SYSTEM_PROMPT.substring(0, 100)}..."`);
  
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
    
    const { targetAudience, advertisingGoal, platform, posthookOutput } = requestData;
    
    console.log(`[${startTime}][REQ:${requestId}] Processing request with:`, { 
      targetAudienceId: targetAudience?.id, 
      advertisingGoal, 
      platform,
      posthookOutputPresent: !!posthookOutput
    });
    
    if (!targetAudience || !posthookOutput) {
      console.error(`[${startTime}][REQ:${requestId}] Missing required data:`, {
        hasTargetAudience: !!targetAudience,
        hasPosthookOutput: !!posthookOutput
      });
      return new Response(
        JSON.stringify({ error: 'Brak wymaganych danych' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[${startTime}][REQ:${requestId}] Target audience data:`, JSON.stringify(targetAudience).substring(0, 300));
    console.log(`[${startTime}][REQ:${requestId}] Posthook output:`, JSON.stringify(posthookOutput));
    
    // Force a clear timestamp and random value to avoid caching
    const timestamp = new Date().toISOString();
    const randomValue = Math.random().toString(36).substring(2, 15);
    
    // Construct prompt for agent with our forced timestamp to avoid caching
    const userPrompt = `Timestamp to avoid caching: ${timestamp}
    Random value to break cache: ${randomValue}
    Request ID: ${requestId}
    
    Oto dane o grupie docelowej:
    ${JSON.stringify(targetAudience, null, 2)}
    
    Cel reklamy: ${advertisingGoal || 'Brak określonego celu'}
    
    Wybrany hook: ${posthookOutput?.hooks?.[0] || 'Brak hooka'}
    
    Tematyka postu: ${posthookOutput?.theme || 'Brak określonej tematyki'}
    
    Platforma: ${platform || 'Meta (Instagram/Facebook)'}`;
    
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
        'X-Timestamp': timestamp
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
      debugInfo: {
        systemPromptUsed: SYSTEM_PROMPT,
        timestamp: startTime,
        requestId: requestId,
        promptVersion: "V14-CUSTOM-" + new Date().toISOString()
      }
    };
    
    console.log(`[${startTime}][REQ:${requestId}] Final response sent:`, JSON.stringify(result).substring(0, 500));
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
        } 
      }
    );
    
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}][REQ:${requestId}] Error in postscript-agent:`, error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error",
        timestamp: timestamp,
        requestId: requestId,
        debugInfo: {
          systemPromptUsed: SYSTEM_PROMPT,
          version: "V14-ERROR-" + new Date().toISOString()
        }
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    );
  }
});
