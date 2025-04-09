
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
const SYSTEM_PROMPT = `Twoim zadaniem jest po prostu napisanie słowa "TEST" i tyle`;

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
    
    // Prepare variables for the prompt template
    const surveyData = JSON.stringify(targetAudience, null, 2);
    const postTheme = validatedPosthookOutput.theme;
    
    // Replace the template variables in the system prompt
    let customizedSystemPrompt = SYSTEM_PROMPT;
    customizedSystemPrompt = customizedSystemPrompt.replace('{{surveyData}}', surveyData);
    customizedSystemPrompt = customizedSystemPrompt.replace('{{selectedHook}}', selectedHook);
    customizedSystemPrompt = customizedSystemPrompt.replace('{{postTheme}}', postTheme);
    customizedSystemPrompt = customizedSystemPrompt.replace('{{platformInfo}}', platformInfo);
    
    console.log("CUSTOMIZED SYSTEM PROMPT (first 300 chars):", customizedSystemPrompt.substring(0, 300));
    
    // Construct prompt for agent
    const userPrompt = `Napisz tekst postu dla mediów społecznościowych, który zaczyna się od hooka: "${selectedHook}". 
    Tematyka: ${validatedPosthookOutput.theme}. 
    Platforma: ${platform || 'Meta (Instagram/Facebook)'}
    Forma: ${validatedPosthookOutput.form}
    Cel reklamy: ${advertisingGoal || 'Brak określonego celu'}`;
    
    // Log the prompt for debugging
    console.log("User prompt for PostscriptAgent:", userPrompt);
    
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
          { role: 'system', content: customizedSystemPrompt },
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
    console.log("Raw OpenAI response:", responseText);
    
    // Extract content and CTA from the response
    let content = responseText;
    let cta = "Skontaktuj się z nami, aby dowiedzieć się więcej.";
    
    // Try to find a CTA in the text
    const ctaIdentifiers = [
      "CTA:", "Wezwanie do działania:", 
      "#CTA", "Call to action:", 
      "WEZWANIE DO DZIAŁANIA", "CALL TO ACTION"
    ];
    
    // Look for any CTA identifier in the text
    let ctaIndex = -1;
    for (const identifier of ctaIdentifiers) {
      const idx = responseText.lastIndexOf(identifier);
      if (idx !== -1 && (ctaIndex === -1 || idx > ctaIndex)) {
        ctaIndex = idx;
      }
    }
    
    // If we found a CTA, split the content
    if (ctaIndex !== -1) {
      content = responseText.substring(0, ctaIndex).trim();
      // Extract text after the identifier
      const afterIdentifier = responseText.substring(ctaIndex);
      // Find the first colon after the identifier
      const colonIndex = afterIdentifier.indexOf(':');
      if (colonIndex !== -1) {
        cta = afterIdentifier.substring(colonIndex + 1).trim();
      } else {
        // If no colon, try to use everything after the identifier
        cta = afterIdentifier.substring(afterIdentifier.indexOf(' ')).trim();
      }
    }
    
    // Create the final response object
    const processedResponse = { 
      content: content || selectedHook,
      cta: cta
    };
    
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
