
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
const SYSTEM_PROMPT = `Napisz po prostu słowo "TEST123"`;

console.log("PostscriptAgent Edge Function initialized v3");
console.log(`Current complete system prompt: "${SYSTEM_PROMPT}"`);
console.log(`First 300 chars of system prompt: "${SYSTEM_PROMPT.substring(0, 300)}"`);

serve(async (req) => {
  console.log("PostscriptAgent received request:", req.method, req.url);
  console.log("CLEAN IMPLEMENTATION - REBUILT FROM SCRATCH");
  
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
    console.log("User prompt for PostscriptAgent:", userPrompt);
    console.log(`System prompt being used: "${SYSTEM_PROMPT}"`);
    
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
    console.log(`Raw OpenAI response: "${responseText}"`);
    
    // Return exactly what we got from the API, without further processing
    // This will help us verify that the system prompt is working
    const result = {
      content: responseText,
      rawResponse: responseText
    };
    
    console.log("Final response being sent to client:", result);
    
    return new Response(
      JSON.stringify(result),
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
