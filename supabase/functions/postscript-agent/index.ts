
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

// System prompt for PostscriptAgent - THIS IS THE DEFINITIVE PROMPT
const SYSTEM_PROMPT = `napisz po prostu słowo 'TEST'`;

console.log("PostscriptAgent Edge Function initialized with new debugging - version 5");
console.log(`Complete system prompt being used: "${SYSTEM_PROMPT}"`);

serve(async (req) => {
  // Track execution with timestamps
  const startTime = new Date().toISOString();
  console.log(`[${startTime}] PostscriptAgent received request:`, req.method, req.url);
  console.log(`[${startTime}] DEBUGVER5: Complete rebuild with updated prompt to 'TEST'`);
  console.log(`[${startTime}] Current system prompt: "${SYSTEM_PROMPT}"`);
  
  // Handle OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    console.log(`[${startTime}] Handling OPTIONS preflight request`);
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    // Parse request data
    const requestData = await req.json().catch(err => {
      console.error(`[${startTime}] Error parsing JSON request:`, err);
      throw new Error("Invalid JSON in request body");
    });
    
    console.log(`[${startTime}] Request data received:`, JSON.stringify(requestData).substring(0, 500));
    
    const { targetAudience, advertisingGoal, platform, posthookOutput } = requestData;
    
    console.log(`[${startTime}] Processing request with:`, { 
      targetAudienceId: targetAudience?.id, 
      advertisingGoal, 
      platform,
      posthookOutputPresent: !!posthookOutput
    });
    
    if (!targetAudience || !posthookOutput) {
      console.error(`[${startTime}] Missing required data:`, {
        hasTargetAudience: !!targetAudience,
        hasPosthookOutput: !!posthookOutput
      });
      return new Response(
        JSON.stringify({ error: 'Brak wymaganych danych' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[${startTime}] Target audience data:`, JSON.stringify(targetAudience).substring(0, 300));
    console.log(`[${startTime}] Posthook output:`, JSON.stringify(posthookOutput));
    
    // Force a clear timestamp to avoid caching
    const timestamp = new Date().toISOString();
    
    // Construct prompt for agent with our forced timestamp to avoid caching
    const userPrompt = `Timestamp to avoid caching: ${timestamp}
    
    Oto dane o grupie docelowej:
    ${JSON.stringify(targetAudience, null, 2)}
    
    Cel reklamy: ${advertisingGoal || 'Brak określonego celu'}
    
    Wybrany hook: ${posthookOutput?.hooks?.[0] || 'Brak hooka'}
    
    Tematyka postu: ${posthookOutput?.theme || 'Brak określonej tematyki'}
    
    Platforma: ${platform || 'Meta (Instagram/Facebook)'}`;
    
    // Log the prompts for debugging
    console.log(`[${startTime}] SYSTEM PROMPT BEING USED:`, SYSTEM_PROMPT);
    console.log(`[${startTime}] USER PROMPT BEING USED (with timestamp):`, userPrompt);
    
    // Get response from OpenAI
    console.log(`[${startTime}] Sending request to OpenAI API`);
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
      console.error(`[${startTime}] OpenAI API error:`, errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await openAIResponse.json();
    let responseText = data.choices[0].message.content;
    
    // Log complete response from API
    console.log(`[${startTime}] Raw OpenAI response:`, responseText);
    
    // Create a result with the raw response for debugging
    const result = {
      content: responseText,
      rawResponse: responseText,
      debugInfo: {
        systemPromptUsed: SYSTEM_PROMPT,
        timestamp: startTime,
        version: "DEBUGVER5"
      }
    };
    
    console.log(`[${startTime}] Final response sent:`, JSON.stringify(result).substring(0, 500));
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] Error in postscript-agent:`, error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error",
        timestamp: timestamp,
        debugInfo: {
          systemPromptUsed: SYSTEM_PROMPT,
          version: "DEBUGVER5-ERROR"
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
