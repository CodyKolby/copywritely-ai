
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
const SYSTEM_PROMPT = `Twoim jedynym zadaniem jest napisać "TESTHOOK2"`;
// ===== EDITABLE PROMPT ENDS HERE =====

// Force redeployment marker: v1.0.2
console.log("PosthookAgent Edge Function initialized with custom prompt v1.0.2");

serve(async (req) => {
  console.log("PosthookAgent received request:", req.method, req.url);
  console.log("Using prompt version v1.0.2:", SYSTEM_PROMPT.substring(0, 50));
  
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
    
    const { targetAudience, advertisingGoal, platform } = requestData;
    
    console.log("PosthookAgent processing request:", { 
      targetAudienceId: targetAudience?.id, 
      advertisingGoal, 
      platform 
    });
    
    if (!targetAudience) {
      console.error("Missing target audience data");
      return new Response(
        JSON.stringify({ error: 'Brak danych o grupie docelowej' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Prepare platform info
    const platformInfo = `Platforma: ${platform || 'Meta (Instagram/Facebook)'}`;
    
    // Construct prompt with survey data
    const userPrompt = `Oto dane o grupie docelowej:
    ${JSON.stringify(targetAudience, null, 2)}
    
    Cel reklamy: ${advertisingGoal || 'Brak określonego celu'}
    
    ${platformInfo}
    
    Stwórz hook, określ tematykę i formę postu.`;
    
    // Log the prompt for debugging
    console.log("Prompt for PosthookAgent:", userPrompt);
    console.log("System prompt being used:", SYSTEM_PROMPT.substring(0, 100) + "...");
    
    // Add anti-caching measures
    const timestamp = new Date().toISOString();
    const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Get response from OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Cache-Buster': cacheBuster,
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
    
    // Add version info to help track which version is running
    processedResponse.version = "v1.0.2";
    processedResponse.promptUsed = SYSTEM_PROMPT.substring(0, 20) + "...";
    
    return new Response(
      JSON.stringify(processedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in posthook-agent:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error", 
        version: "v1.0.2-error",
        promptUsed: SYSTEM_PROMPT.substring(0, 20) + "..."
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
