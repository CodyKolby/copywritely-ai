
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../shared/cors.ts";
import { generateDeploymentId, generateCacheBuster, getCurrentTimestamp } from "../shared/utils.ts";
import { callOpenAI, createErrorResponse } from "../shared/openai.ts";
import { processHookResponse, constructHookPrompt } from "./hook-service.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Version tracking to help detect updates
const FUNCTION_VERSION = "v1.4.0"; // Incremented for new prompt handling logic

// Generate a deployment ID to track specific deployments
const DEPLOYMENT_ID = generateDeploymentId();

// Get system prompt from environment variable with fallback
const DEFAULT_PROMPT = `
MASZ NAPISAĆ "TESTHOOK"
`;

// CRITICAL: Force reload the environment variable directly each time
const getEnvPrompt = () => {
  try {
    const promptValue = Deno.env.get('SOCIAL_HOOK_PROMPT');
    return promptValue || null;
  } catch (err) {
    console.error(`[${getCurrentTimestamp()}] Error accessing SOCIAL_HOOK_PROMPT:`, err);
    return null;
  }
};

// Log startup information with enhanced debugging
console.log(`[STARTUP][${DEPLOYMENT_ID}] SocialHookAgent initialized with version ${FUNCTION_VERSION}`);
console.log(`[STARTUP][${DEPLOYMENT_ID}] Environment variable keys available:`, JSON.stringify(Object.keys(Deno.env.toObject())));
console.log(`[STARTUP][${DEPLOYMENT_ID}] SOCIAL_HOOK_PROMPT exists:`, Deno.env.get('SOCIAL_HOOK_PROMPT') !== undefined);
console.log(`[STARTUP][${DEPLOYMENT_ID}] SOCIAL_HOOK_PROMPT empty:`, Deno.env.get('SOCIAL_HOOK_PROMPT') === "");
console.log(`[STARTUP][${DEPLOYMENT_ID}] SOCIAL_HOOK_PROMPT first 50 chars:`, (Deno.env.get('SOCIAL_HOOK_PROMPT') || "").substring(0, 50));

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
    
    console.log(`[${startTime}][REQ:${requestId}] Processing request:`, { 
      targetAudienceId: targetAudience?.id, 
      advertisingGoal, 
      platform,
      timestamp: timestamp || startTime,
      cacheBuster: cacheBuster || 'none'
    });
    
    if (!targetAudience) {
      console.error(`[${startTime}][REQ:${requestId}] Missing target audience data`);
      return new Response(
        JSON.stringify({ error: 'Brak danych o grupie docelowej' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // CRITICAL: Load system prompt directly from environment each time
    // This bypasses any potential caching of the environment variable
    const envPrompt = getEnvPrompt();
    const SYSTEM_PROMPT = envPrompt || DEFAULT_PROMPT;
    
    // Even more logging about the prompt
    console.log(`[${startTime}][REQ:${requestId}] CRITICAL PROMPT DEBUG:`);
    console.log(`[${startTime}][REQ:${requestId}] - Env var direct check:`, Deno.env.get('SOCIAL_HOOK_PROMPT') !== undefined);
    console.log(`[${startTime}][REQ:${requestId}] - Env var length:`, (Deno.env.get('SOCIAL_HOOK_PROMPT') || "").length);
    console.log(`[${startTime}][REQ:${requestId}] - Env var first 100 chars:`, (Deno.env.get('SOCIAL_HOOK_PROMPT') || "").substring(0, 100));
    console.log(`[${startTime}][REQ:${requestId}] - Using prompt source:`, envPrompt ? 'ENVIRONMENT' : 'DEFAULT');
    console.log(`[${startTime}][REQ:${requestId}] - Final system prompt:`, SYSTEM_PROMPT);
    
    // Validate system prompt
    if (!SYSTEM_PROMPT || SYSTEM_PROMPT.length < 10) {
      console.error(`[${startTime}][REQ:${requestId}] System prompt is invalid or too short: "${SYSTEM_PROMPT}"`);
      return new Response(
        JSON.stringify({ 
          error: 'System prompt is invalid or missing',
          promptLength: SYSTEM_PROMPT?.length || 0,
          promptSource: envPrompt ? 'environment' : 'default',
          deploymentId: DEPLOYMENT_ID,
          environmentDebug: {
            envKeys: Object.keys(Deno.env.toObject()),
            promptExists: Deno.env.get('SOCIAL_HOOK_PROMPT') !== undefined,
            promptEmpty: Deno.env.get('SOCIAL_HOOK_PROMPT') === ""
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Log env var status with every request
    console.log(`[${startTime}][REQ:${requestId}] Env var debug - SOCIAL_HOOK_PROMPT:`, {
      exists: Deno.env.get('SOCIAL_HOOK_PROMPT') !== undefined,
      empty: Deno.env.get('SOCIAL_HOOK_PROMPT') === "",
      length: (Deno.env.get('SOCIAL_HOOK_PROMPT') || "").length,
      using: envPrompt ? 'YES' : 'NO'
    });
    
    // Construct prompt with provided data
    const userPrompt = constructHookPrompt(requestData, requestId, DEPLOYMENT_ID, FUNCTION_VERSION);
    
    // Log prompt information
    console.log(`[${startTime}][REQ:${requestId}] SYSTEM PROMPT LENGTH: ${SYSTEM_PROMPT.length} characters`);
    console.log(`[${startTime}][REQ:${requestId}] SYSTEM PROMPT SOURCE: ${envPrompt ? 'ENVIRONMENT VARIABLE' : 'DEFAULT FALLBACK'}`);
    console.log(`[${startTime}][REQ:${requestId}] SYSTEM PROMPT FULL: ${SYSTEM_PROMPT}`);
    console.log(`[${startTime}][REQ:${requestId}] USER PROMPT LENGTH: ${userPrompt.length} characters`);
    
    // Add anti-caching measures
    const requestTimestamp = timestamp || startTime;
    const cacheBusterValue = generateCacheBuster(requestId, DEPLOYMENT_ID);
    
    // Get response from OpenAI
    const data = await callOpenAI(userPrompt, SYSTEM_PROMPT, openAIApiKey, {
      requestId,
      timestamp: requestTimestamp,
      cacheBuster: cacheBusterValue,
      deploymentId: DEPLOYMENT_ID,
      functionVersion: FUNCTION_VERSION,
      model: 'gpt-4o-mini'
    });
    
    let responseText = data.choices[0].message.content;
    
    // Log complete response for debugging
    console.log(`[${startTime}][REQ:${requestId}] Raw SocialHookAgent response length: ${responseText.length} chars`);
    console.log(`[${startTime}][REQ:${requestId}] Raw response preview: ${responseText.substring(0, 200)}...`);
    
    // Process response to extract hooks, theme, and form
    let processedResponse = processHookResponse(responseText);
    
    // Add test hooks for verification purposes
    if (requestData.testMode === true || requestData.test === true) {
      console.log(`[${startTime}][REQ:${requestId}] Test mode detected, adding test hooks`);
      processedResponse.hooks.push("TESTHOOK4");
      processedResponse.testMode = true;
    }
    
    console.log(`[${startTime}][REQ:${requestId}] Processed SocialHookAgent response:`, processedResponse);
    
    // Add deployment and prompt info to help track which version is running
    processedResponse.version = FUNCTION_VERSION;
    processedResponse.deploymentId = DEPLOYMENT_ID;
    processedResponse.promptSource = envPrompt ? 'environment' : 'default';
    processedResponse.promptUsed = SYSTEM_PROMPT.substring(0, 100) + "...";
    processedResponse.requestId = requestId;
    
    // Add debug information about env vars
    processedResponse.debug = {
      envVarExists: Deno.env.get('SOCIAL_HOOK_PROMPT') !== undefined,
      envVarEmpty: Deno.env.get('SOCIAL_HOOK_PROMPT') === "",
      envVarLength: (Deno.env.get('SOCIAL_HOOK_PROMPT') || "").length,
      usingEnvPrompt: envPrompt ? true : false,
      timestamp: startTime
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
      promptSource: getEnvPrompt() ? 'environment' : 'default',
      systemPromptLength: getEnvPrompt()?.length || 0,
      timestamp: timestamp,
      requestId: requestId,
      debug: {
        envVarExists: Deno.env.get('SOCIAL_HOOK_PROMPT') !== undefined,
        envVarEmpty: Deno.env.get('SOCIAL_HOOK_PROMPT') === "",
        envKeys: Object.keys(Deno.env.toObject())
      }
    });
  }
});
