
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../shared/cors.ts";
import { generateDeploymentId, generateCacheBuster, getCurrentTimestamp } from "../shared/utils.ts";
import { callOpenAI, createErrorResponse } from "../shared/openai.ts";
import { processHookResponse, constructHookPrompt } from "./hook-service.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Version tracking to help detect updates - increment this when making changes
const FUNCTION_VERSION = "v1.6.0";

// Generate a deployment ID to track specific deployments
const DEPLOYMENT_ID = generateDeploymentId();

// Define a hardcoded prompt to use if the environment variable is not available
const HARDCODED_PROMPT = `
Jesteś ekspertem od marketingu w mediach społecznościowych.

Twoim zadaniem jest przygotowanie:
1. 3-5 angażujących hooków (pierwszych zdań) do posta na social media
2. Temat posta
3. Sugerowana forma (np. post tekstowy, karuzela, wideo)
4. Call to action (wezwanie do działania, np. "Sprawdź więcej", "Zapisz się", itp.)

Bazuj na dostarczonych danych o grupie docelowej i celu reklamy.
Dostosuj styl do platformy (Meta, LinkedIn, TikTok).

Zwróć wynik jako JSON w formacie:
{
  "hooks": ["Hook 1", "Hook 2", "Hook 3"],
  "theme": "Temat posta",
  "form": "Forma posta",
  "cta": "Call to action"
}

Hooks powinny być:
- Przyciągające uwagę
- Jasno wskazujące temat
- Napisane prostym językiem
- Budzące emocje (ciekawość, zaskoczenie)
`;

// THIS IS IMPORTANT: We'll only use hardcoded prompt to ensure consistent behavior
function getSystemPrompt(): string {
  console.log(`[${getCurrentTimestamp()}] USING HARDCODED PROMPT ONLY - NO ENV VARIABLES`);
  console.log(`[${getCurrentTimestamp()}] Prompt length: ${HARDCODED_PROMPT.length} characters`);
  return HARDCODED_PROMPT;
}

// Log startup information
console.log(`[STARTUP][${DEPLOYMENT_ID}] SocialHookAgent initialized with version ${FUNCTION_VERSION}`);
console.log(`[STARTUP][${DEPLOYMENT_ID}] USING HARDCODED PROMPT ONLY - Function will ignore env variables`);
console.log(`[STARTUP][${DEPLOYMENT_ID}] Hardcoded prompt length: ${HARDCODED_PROMPT.length} characters`);

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = getCurrentTimestamp();
  console.log(`[${startTime}][REQ:${requestId}] SocialHookAgent received request:`, req.method, req.url);
  console.log(`[${startTime}][REQ:${requestId}] Using function version: ${FUNCTION_VERSION}, deployment: ${DEPLOYMENT_ID}`);
  
  // Handle OPTIONS requests for CORS preflight
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  try {
    // Parse request data
    const requestData = await req.json().catch(err => {
      console.error(`[${startTime}][REQ:${requestId}] Error parsing JSON request:`, err);
      throw new Error("Invalid JSON in request body");
    });
    
    const { targetAudience, advertisingGoal, platform, cacheBuster, timestamp } = requestData;
    
    if (!targetAudience) {
      console.error(`[${startTime}][REQ:${requestId}] Missing target audience data`);
      return new Response(
        JSON.stringify({ error: 'Brak danych o grupie docelowej' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the system prompt (hardcoded only)
    const SYSTEM_PROMPT = getSystemPrompt();
    
    // Log prompt information
    console.log(`[${startTime}][REQ:${requestId}] SYSTEM PROMPT LENGTH: ${SYSTEM_PROMPT.length} characters`);
    console.log(`[${startTime}][REQ:${requestId}] SYSTEM PROMPT FIRST 100 CHARS: ${SYSTEM_PROMPT.substring(0, 100)}...`);
    console.log(`[${startTime}][REQ:${requestId}] SYSTEM PROMPT SOURCE: HARDCODED - ENV VARIABLES IGNORED`);
    
    // Construct user prompt
    const userPrompt = constructHookPrompt(requestData, requestId, DEPLOYMENT_ID, FUNCTION_VERSION);
    
    // Add anti-caching measures
    const requestTimestamp = timestamp || startTime;
    const cacheBusterValue = generateCacheBuster(requestId, DEPLOYMENT_ID);
    
    // Call OpenAI
    const data = await callOpenAI(userPrompt, SYSTEM_PROMPT, openAIApiKey, {
      requestId,
      timestamp: requestTimestamp,
      cacheBuster: cacheBusterValue,
      deploymentId: DEPLOYMENT_ID,
      functionVersion: FUNCTION_VERSION,
      model: 'gpt-4o-mini'
    });
    
    const responseText = data.choices[0].message.content;
    
    // Log complete response for debugging
    console.log(`[${startTime}][REQ:${requestId}] Raw response length: ${responseText.length} chars`);
    console.log(`[${startTime}][REQ:${requestId}] Raw response preview: ${responseText.substring(0, 200)}...`);
    console.log(`[${startTime}][REQ:${requestId}] RESPONSE FULL: ${responseText}`);
    
    // Process response
    const processedResponse = processHookResponse(responseText);
    
    // Add test hooks for verification purposes
    if (requestData.testMode === true || requestData.test === true) {
      console.log(`[${startTime}][REQ:${requestId}] Test mode detected, adding test hooks`);
      processedResponse.hooks.push("TEST_HOOK_HARDCODED_v1.6.0");
      processedResponse.testMode = true;
    }
    
    // Add metadata
    processedResponse.version = FUNCTION_VERSION;
    processedResponse.deploymentId = DEPLOYMENT_ID;
    processedResponse.promptSource = 'HARDCODED_ONLY';
    processedResponse.promptUsed = SYSTEM_PROMPT.substring(0, 100) + "...";
    processedResponse.requestId = requestId;
    
    // Add debug information
    processedResponse.debug = {
      promptSource: 'HARDCODED_ONLY - ENV VARIABLES IGNORED',
      timestamp: startTime,
      functionVersion: FUNCTION_VERSION,
      promptFirstChars: SYSTEM_PROMPT.substring(0, 100)
    };
    
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
    const timestamp = getCurrentTimestamp();
    console.error(`[${timestamp}][REQ:${requestId}] Error in social-hook-agent:`, error);
    
    return createErrorResponse(error, {
      version: FUNCTION_VERSION,
      deploymentId: DEPLOYMENT_ID,
      timestamp: timestamp,
      requestId: requestId,
      debug: {
        promptSource: 'HARDCODED_ONLY - ENV VARIABLES IGNORED'
      }
    });
  }
});
