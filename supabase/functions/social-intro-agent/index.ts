
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callOpenAI, createErrorResponse } from "../shared/openai.ts";
import { corsHeaders, handleOptions } from "../shared/cors.ts";

// OpenAI API key from environment
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// System prompt for social media intro generation
const SYSTEM_PROMPT = `
Twoim zadaniem jest napisanie słowa "TESTSYSTEM11"
`;

// 🔥 DEBUG START
console.log("🔥🔥🔥 SOCIAL INTRO AGENT ACTIVE 🔥🔥🔥");

serve(async (req) => {
  // Generate a unique request ID and timestamp
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const functionVersion = "v1.0.1";
  const deploymentId = Deno.env.get('DEPLOYMENT_ID') || 'development';

  console.log(`[${timestamp}][REQ:${requestId}] Received request to social-intro-agent`);
  
  // Handle CORS preflight requests
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  try {
    if (!openAIApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    // Parse the request body
    const data = await req.json();
    const { targetAudience, advertisingGoal, platform } = data;

    if (!targetAudience) {
      throw new Error("Target audience data is required");
    }

    // Create metadata for logging and debugging
    const metadata = {
      requestId,
      timestamp,
      cacheBuster,
      deploymentId,
      functionVersion,
      model: "gpt-4o-mini"
    };

    // Format the target audience data into a user prompt
    const userPrompt = formatPrompt(targetAudience, advertisingGoal, platform);

    console.log(`[${timestamp}][REQ:${requestId}] Calling OpenAI with user prompt`);
    
    // Call OpenAI
    const response = await callOpenAI(userPrompt, SYSTEM_PROMPT, openAIApiKey, metadata);
    
    // Extract the generated content
    const generatedIntro = response.choices[0].message.content;
    
    console.log(`[${timestamp}][REQ:${requestId}] Successfully generated intro for ${platform}`);

    // Return the response
    return new Response(
      JSON.stringify({
        intro: generatedIntro,
        model: response.model,
        timestamp,
        requestId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error(`[${timestamp}][REQ:${requestId}] Error:`, error.message);
    return createErrorResponse(error, { 
      timestamp, 
      requestId, 
      deploymentId, 
      functionVersion 
    });
  }
});

// Helper function to format the prompt for OpenAI
function formatPrompt(targetAudience: any, advertisingGoal: string, platform: string) {
  let audienceDescription = '';
  
  // Build audience description
  if (targetAudience) {
    if (targetAudience.age_range) audienceDescription += `Wiek: ${targetAudience.age_range}\n`;
    if (targetAudience.gender) audienceDescription += `Płeć: ${targetAudience.gender}\n\n`;
    
    if (targetAudience.pains && targetAudience.pains.length) {
      audienceDescription += "Problemy klientów:\n";
      targetAudience.pains.forEach((pain: string, index: number) => {
        if (pain) audienceDescription += `${index + 1}. ${pain}\n`;
      });
      audienceDescription += "\n";
    }
    
    if (targetAudience.desires && targetAudience.desires.length) {
      audienceDescription += "Pragnienia klientów:\n";
      targetAudience.desires.forEach((desire: string, index: number) => {
        if (desire) audienceDescription += `${index + 1}. ${desire}\n`;
      });
      audienceDescription += "\n";
    }

    if (targetAudience.biography) audienceDescription += `Biografia klienta: ${targetAudience.biography}\n\n`;
    if (targetAudience.language) audienceDescription += `Język klienta: ${targetAudience.language}\n\n`;
    if (targetAudience.beliefs) audienceDescription += `Przekonania: ${targetAudience.beliefs}\n\n`;
    if (targetAudience.main_offer) audienceDescription += `Główna oferta: ${targetAudience.main_offer}\n\n`;
  }

  return `
# Informacje o grupie docelowej
${audienceDescription}

# Cel marketingowy
${advertisingGoal || "Zwiększenie świadomości marki"}

# Platforma docelowa
${platform || "Meta (Facebook/Instagram)"}

Na podstawie powyższych informacji, stwórz krótkie, emocjonalne intro (2-3 zdania) które przyciągnie uwagę określonej grupy docelowej na platformie ${platform || "Meta (Facebook/Instagram)"}.

Intro powinno być mówione, naturalne, skierowane do jednej osoby, nie do grupy. Ma wprowadzać w temat i zostawiać miejsce na dalszą część postu.

Pamiętaj, aby intro było dopasowane do języka i emocji odbiorcy, odnosiło się do jego problemów i pragnień, ale nie zdradzało rozwiązań.
`;
}
