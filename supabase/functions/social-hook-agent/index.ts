
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../shared/cors.ts";
import { generateDeploymentId, generateCacheBuster, getCurrentTimestamp } from "../shared/utils.ts";
import { callOpenAI, createErrorResponse } from "../shared/openai.ts";
import { processHookResponse, constructHookPrompt } from "./hook-service.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const socialHookPrompt = Deno.env.get('SOCIAL_HOOK_PROMPT');

// Version tracking to help detect updates - increment this when making changes
const FUNCTION_VERSION = "v1.9.0";

// Generate a deployment ID to track specific deployments
const DEPLOYMENT_ID = generateDeploymentId();

// Define a hardcoded prompt to use
const HARDCODED_PROMPT = `
Twoim jedynym zadaniem jest napisanie słowa "10kwietnia2009"
`;

// Log startup information
console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] SocialHookAgent initialized with version ${FUNCTION_VERSION}`);
console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] Using HARDCODED prompt length: ${HARDCODED_PROMPT.length} characters`);
console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] Hardcoded prompt full: ${HARDCODED_PROMPT}`);

// Check if there's an environment variable prompt
if (socialHookPrompt) {
  console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] Found SOCIAL_HOOK_PROMPT env variable of length: ${socialHookPrompt.length}`);
  console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] ENV prompt first 100 chars: ${socialHookPrompt.substring(0, 100)}`);
  console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] !!! We will IGNORE this and use HARDCODED_PROMPT instead !!!`);
} else {
  console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] No SOCIAL_HOOK_PROMPT env variable found, using hardcoded prompt`);
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = getCurrentTimestamp();
  console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] SocialHookAgent received request:`, req.method, req.url);
  console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Using function version: ${FUNCTION_VERSION}, deployment: ${DEPLOYMENT_ID}`);
  
  // Handle OPTIONS requests for CORS preflight
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  try {
    // Log full request headers for debugging cache issues
    const headersLog = {};
    req.headers.forEach((value, key) => {
      headersLog[key] = value;
    });
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Request headers:`, JSON.stringify(headersLog));
    
    // Parse request data
    const requestData = await req.json().catch(err => {
      console.error(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Error parsing JSON request:`, err);
      throw new Error("Invalid JSON in request body");
    });
    
    const { targetAudience, advertisingGoal, platform, cacheBuster, timestamp } = requestData;
    
    if (!targetAudience) {
      console.error(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Missing target audience data`);
      return new Response(
        JSON.stringify({ error: 'Brak danych o grupie docelowej' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Use hardcoded prompt - FORCE THIS
    const SYSTEM_PROMPT = HARDCODED_PROMPT;
    
    // Log prompt information
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] PROMPT SOURCE: HARDCODED_IN_CODE v${FUNCTION_VERSION}`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] SYSTEM PROMPT LENGTH: ${SYSTEM_PROMPT.length} characters`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] SYSTEM PROMPT FULL:\n${SYSTEM_PROMPT}`);
    
    // Construct user prompt
    const userPrompt = constructHookPrompt(requestData, requestId, DEPLOYMENT_ID, FUNCTION_VERSION);
    
    // Add anti-caching measures
    const requestTimestamp = timestamp || startTime;
    const cacheBusterValue = generateCacheBuster(requestId, DEPLOYMENT_ID);
    
    // Call OpenAI with additional headers to prevent caching
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Calling OpenAI API with model: gpt-4o-mini`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Cache buster: ${cacheBusterValue}`);
    
    const data = await callOpenAI(userPrompt, SYSTEM_PROMPT, openAIApiKey, {
      requestId,
      timestamp: requestTimestamp,
      cacheBuster: cacheBusterValue,
      deploymentId: DEPLOYMENT_ID,
      functionVersion: FUNCTION_VERSION,
      model: 'gpt-4o-mini',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-No-Cache': Date.now().toString()
      }
    });
    
    const responseText = data.choices[0].message.content;
    
    // Log complete response for debugging
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Raw response length: ${responseText.length} chars`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Raw response full:\n${responseText}`);
    
    // Process response
    const processedResponse = processHookResponse(responseText);
    
    // Add test hooks for verification purposes
    if (requestData.testMode === true || requestData.test === true) {
      console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Test mode detected, adding test hooks`);
      processedResponse.hooks = ["TEST_HOOK_v1.9.0"];
      processedResponse.testMode = true;
    }
    
    // CRITICAL: Ensure we only have one hook
    if (processedResponse.hooks && processedResponse.hooks.length > 1) {
      console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Multiple hooks detected (${processedResponse.hooks.length}), keeping only the first one`);
      processedResponse.hooks = [processedResponse.hooks[0]];
    }
    
    // If no hooks were generated, create a consistent test hook
    if (!processedResponse.hooks || processedResponse.hooks.length === 0) {
      console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] No hooks detected, creating default test hook`);
      processedResponse.hooks = ["TESTHOOK_v1.9.0"];
    }
    
    // Add metadata
    processedResponse.version = FUNCTION_VERSION;
    processedResponse.deploymentId = DEPLOYMENT_ID;
    processedResponse.promptSource = 'HARDCODED_IN_CODE';
    processedResponse.promptUsed = SYSTEM_PROMPT;
    processedResponse.requestId = requestId;
    
    // Add debug information
    processedResponse.debug = {
      timestamp: startTime,
      functionVersion: FUNCTION_VERSION,
      deploymentId: DEPLOYMENT_ID,
      promptSource: 'HARDCODED_IN_CODE',
      promptFirstChars: SYSTEM_PROMPT.substring(0, 100),
      fullPrompt: SYSTEM_PROMPT,
      requestHeaders: headersLog,
      responseUrl: req.url,
      responseText: responseText
    };
    
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Returning processed response with hooks:`, JSON.stringify(processedResponse.hooks));
    
    return new Response(
      JSON.stringify(processedResponse),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Function-Version': FUNCTION_VERSION,
          'X-Deployment-Id': DEPLOYMENT_ID,
          'X-Cache-Buster': Date.now().toString(),
          'X-Prompt-Source': 'HARDCODED_IN_CODE'
        } 
      }
    );
    
  } catch (error) {
    const timestamp = getCurrentTimestamp();
    console.error(`[${timestamp}][REQ:${requestId}][${FUNCTION_VERSION}] Error in social-hook-agent:`, error);
    
    return createErrorResponse(error, {
      version: FUNCTION_VERSION,
      deploymentId: DEPLOYMENT_ID,
      timestamp: timestamp,
      requestId: requestId,
      debug: {
        promptSource: 'HARDCODED_IN_CODE',
        hardcodedPrompt: HARDCODED_PROMPT
      }
    });
  }
});
