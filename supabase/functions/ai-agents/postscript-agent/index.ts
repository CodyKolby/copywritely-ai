
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// System prompt for PostscriptAgent
const SYSTEM_PROMPT = `Jesteś PostscriptAgentem, ekspertem w tworzeniu angażujących treści i mocnych wezwań do działania (CTA) w postach w mediach społecznościowych.

Twoje zadanie:
1. Na podstawie danych o grupie docelowej, celu reklamy i wyjścia PosthookAgenta
2. Stworzyć pełną treść postu dopasowaną do platformy
3. Dodać skuteczne wezwanie do działania (CTA)
4. Optymalizować treść pod kątem angażowania odbiorców

Dopasuj styl do wskazanej platformy:
- Meta (Instagram/Facebook): wizualny, emocjonalny z wyraźnym CTA
- TikTok: krótki, dynamiczny, conversational z silnym hasłem do działania
- LinkedIn: wartościowy, profesjonalny, budujący autorytet z biznesowym CTA

Zwróć pełną treść postu w formacie JSON z polami:
- content: główna treść postu (włącznie z hookiem)
- cta: wyraźne wezwanie do działania`;

console.log("PostscriptAgent Edge Function initialized");

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
