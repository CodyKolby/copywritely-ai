
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../shared/cors.ts";
import { generateDeploymentId, generateCacheBuster, getCurrentTimestamp } from "../shared/utils.ts";
import { callOpenAI, createErrorResponse } from "../shared/openai.ts";
import { processHookResponse, constructHookPrompt } from "./hook-service.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Version tracking to help detect updates - increment this when making changes
const FUNCTION_VERSION = "v1.7.0";

// Generate a deployment ID to track specific deployments
const DEPLOYMENT_ID = generateDeploymentId();

// Define a hardcoded prompt to use
const HARDCODED_PROMPT = `
Jesteś ekspertem od marketingu w mediach społecznościowych. Twoim zadaniem jest przygotowanie hooków, które przyciągną uwagę odbiorców.
Hooki powinny być krótkie, chwytliwe i związane z tematem reklamy. Wygeneruj minimum 3 różne hooki.

Dodatkowo określ także, w jakiej formie będzie post (np. post tekstowy, carousel, reels itp.) oraz sugerowane wezwanie do działania (CTA).

Odpowiedź przedstaw w formie:

HOOKI:
1. [Hook 1]
2. [Hook 2]
3. [Hook 3]

TEMAT: [Określ główną tematykę/motyw przewodni]
FORMA: [Preferowany format posta]
WEZWANIE DO DZIAŁANIA: [Sugerowane CTA]
`;

// Log startup information
console.log(`[STARTUP][${DEPLOYMENT_ID}] SocialHookAgent initialized with version ${FUNCTION_VERSION}`);
console.log(`[STARTUP][${DEPLOYMENT_ID}] Using HARDCODED prompt length: ${HARDCODED_PROMPT.length} characters`);
console.log(`[STARTUP][${DEPLOYMENT_ID}] Hardcoded prompt first 100 chars: ${HARDCODED_PROMPT.substring(0, 100)}`);

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
    
    // Use hardcoded prompt
    const SYSTEM_PROMPT = HARDCODED_PROMPT;
    
    // Log prompt information
    console.log(`[${startTime}][REQ:${requestId}] SYSTEM PROMPT LENGTH: ${SYSTEM_PROMPT.length} characters`);
    console.log(`[${startTime}][REQ:${requestId}] SYSTEM PROMPT FIRST 100 CHARS: ${SYSTEM_PROMPT.substring(0, 100)}...`);
    console.log(`[${startTime}][REQ:${requestId}] SYSTEM PROMPT SOURCE: HARDCODED IN CODE v${FUNCTION_VERSION}`);
    
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
    
    // Process response
    const processedResponse = processHookResponse(responseText);
    
    // Add test hooks for verification purposes
    if (requestData.testMode === true || requestData.test === true) {
      console.log(`[${startTime}][REQ:${requestId}] Test mode detected, adding test hooks`);
      processedResponse.hooks.push(`TEST_HOOK_v${FUNCTION_VERSION}`);
      processedResponse.testMode = true;
    }
    
    // Add metadata
    processedResponse.version = FUNCTION_VERSION;
    processedResponse.deploymentId = DEPLOYMENT_ID;
    processedResponse.promptSource = 'HARDCODED_IN_CODE';
    processedResponse.promptUsed = SYSTEM_PROMPT.substring(0, 100) + "...";
    processedResponse.requestId = requestId;
    
    // Add debug information
    processedResponse.debug = {
      promptSource: 'HARDCODED_IN_CODE',
      timestamp: startTime,
      functionVersion: FUNCTION_VERSION,
      promptFirstChars: SYSTEM_PROMPT.substring(0, 100),
      fullPrompt: SYSTEM_PROMPT
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
        promptSource: 'HARDCODED_IN_CODE'
      }
    });
  }
});
