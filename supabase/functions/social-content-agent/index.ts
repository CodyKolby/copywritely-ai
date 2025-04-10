
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../shared/cors.ts";
import { generateDeploymentId, generateCacheBuster, getCurrentTimestamp } from "../shared/utils.ts";
import { callOpenAI, createErrorResponse } from "../shared/openai.ts";
import { constructContentPrompt } from "./content-service.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Version tracking to help detect updates
const FUNCTION_VERSION = "v1.4.0"; // Incremented for new prompt handling logic

// Generate a deployment ID to track specific deployments
const DEPLOYMENT_ID = generateDeploymentId();

// Default prompt as fallback
const DEFAULT_PROMPT = `
Masz napisać "TESTCONTENT"
`;

// CRITICAL: Force reload the environment variable directly each time
const getEnvPrompt = () => {
  try {
    const promptValue = Deno.env.get('SOCIAL_CONTENT_PROMPT');
    return promptValue || null;
  } catch (err) {
    console.error(`[${getCurrentTimestamp()}] Error accessing SOCIAL_CONTENT_PROMPT:`, err);
    return null;
  }
};

// Log startup information with enhanced debugging
console.log(`[STARTUP][${DEPLOYMENT_ID}] SocialContentAgent initialized with version ${FUNCTION_VERSION}`);
console.log(`[STARTUP][${DEPLOYMENT_ID}] Environment variable keys available:`, JSON.stringify(Object.keys(Deno.env.toObject())));
console.log(`[STARTUP][${DEPLOYMENT_ID}] SOCIAL_CONTENT_PROMPT exists:`, Deno.env.get('SOCIAL_CONTENT_PROMPT') !== undefined);
console.log(`[STARTUP][${DEPLOYMENT_ID}] SOCIAL_CONTENT_PROMPT empty:`, Deno.env.get('SOCIAL_CONTENT_PROMPT') === "");
console.log(`[STARTUP][${DEPLOYMENT_ID}] SOCIAL_CONTENT_PROMPT first 50 chars:`, (Deno.env.get('SOCIAL_CONTENT_PROMPT') || "").substring(0, 50));

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = getCurrentTimestamp();
  console.log(`[${startTime}][REQ:${requestId}] SocialContentAgent received request:`, req.method, req.url);
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
    
    console.log(`[${startTime}][REQ:${requestId}] Request data received with keys:`, Object.keys(requestData));
    
    const { targetAudience, advertisingGoal, platform, hookOutput, cacheBuster, timestamp, selectedHook } = requestData;
    
    console.log(`[${startTime}][REQ:${requestId}] Processing request with:`, { 
      targetAudienceId: targetAudience?.id, 
      advertisingGoal, 
      platform,
      hookOutputPresent: !!hookOutput,
      selectedHook: selectedHook || (hookOutput?.hooks?.[0] || 'Brak hooka'),
      timestamp: timestamp || startTime,
      cacheBuster: cacheBuster || 'none'
    });
    
    // CRITICAL: Load system prompt directly from environment each time
    // This bypasses any potential caching of the environment variable
    const envPrompt = getEnvPrompt();
    const SYSTEM_PROMPT = envPrompt || DEFAULT_PROMPT;
    
    // Even more logging about the prompt
    console.log(`[${startTime}][REQ:${requestId}] CRITICAL PROMPT DEBUG:`);
    console.log(`[${startTime}][REQ:${requestId}] - Env var direct check:`, Deno.env.get('SOCIAL_CONTENT_PROMPT') !== undefined);
    console.log(`[${startTime}][REQ:${requestId}] - Env var length:`, (Deno.env.get('SOCIAL_CONTENT_PROMPT') || "").length);
    console.log(`[${startTime}][REQ:${requestId}] - Env var first 100 chars:`, (Deno.env.get('SOCIAL_CONTENT_PROMPT') || "").substring(0, 100));
    console.log(`[${startTime}][REQ:${requestId}] - Using prompt source:`, envPrompt ? 'ENVIRONMENT' : 'DEFAULT');
    console.log(`[${startTime}][REQ:${requestId}] - Final system prompt:`, SYSTEM_PROMPT);
    
    // Log env var status with every request
    console.log(`[${startTime}][REQ:${requestId}] Env var debug - SOCIAL_CONTENT_PROMPT:`, {
      exists: Deno.env.get('SOCIAL_CONTENT_PROMPT') !== undefined,
      empty: Deno.env.get('SOCIAL_CONTENT_PROMPT') === "",
      length: (Deno.env.get('SOCIAL_CONTENT_PROMPT') || "").length,
      using: envPrompt ? 'YES' : 'NO'
    });
    
    // Validate input data
    if (!targetAudience) {
      console.error(`[${startTime}][REQ:${requestId}] Missing target audience data`);
      return new Response(
        JSON.stringify({ error: 'Brak danych o grupie docelowej' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate hook output
    if (!hookOutput || !hookOutput.hooks || hookOutput.hooks.length === 0) {
      console.error(`[${startTime}][REQ:${requestId}] Invalid or missing hook output:`, hookOutput);
      return new Response(
        JSON.stringify({ 
          error: 'Brak lub nieprawidłowe dane o hookach',
          hookOutput: hookOutput || 'undefined'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
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
            promptExists: Deno.env.get('SOCIAL_CONTENT_PROMPT') !== undefined,
            promptEmpty: Deno.env.get('SOCIAL_CONTENT_PROMPT') === ""
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Print full information about hooks for debugging
    console.log(`[${startTime}][REQ:${requestId}] Hook output details:`, {
      hooks: hookOutput.hooks,
      theme: hookOutput.theme,
      form: hookOutput.form,
      cta: hookOutput.cta
    });
    
    // Construct prompt for agent
    const userPrompt = constructContentPrompt(requestData, requestId, DEPLOYMENT_ID, FUNCTION_VERSION);
    
    // Log prompt information
    console.log(`[${startTime}][REQ:${requestId}] SYSTEM PROMPT LENGTH: ${SYSTEM_PROMPT.length} characters`);
    console.log(`[${startTime}][REQ:${requestId}] SYSTEM PROMPT SOURCE: ${envPrompt ? 'ENVIRONMENT VARIABLE' : 'DEFAULT FALLBACK'}`);
    console.log(`[${startTime}][REQ:${requestId}] SYSTEM PROMPT FULL: ${SYSTEM_PROMPT}`);
    console.log(`[${startTime}][REQ:${requestId}] USER PROMPT LENGTH: ${userPrompt.length} characters`);
    
    // Prepare cache busting and metadata
    const currentTimestamp = timestamp || startTime;
    const requestCacheBuster = generateCacheBuster(requestId, DEPLOYMENT_ID);
    
    // Get response from OpenAI with cache-busting headers
    console.log(`[${startTime}][REQ:${requestId}] Sending request to OpenAI API with cache-busting parameters`);
    
    const data = await callOpenAI(userPrompt, SYSTEM_PROMPT, openAIApiKey, {
      requestId,
      timestamp: currentTimestamp,
      cacheBuster: requestCacheBuster,
      deploymentId: DEPLOYMENT_ID,
      functionVersion: FUNCTION_VERSION,
      model: 'gpt-4o-mini'
    });

    const responseText = data.choices[0].message.content;
    
    // Log complete response from API
    console.log(`[${startTime}][REQ:${requestId}] Raw OpenAI response length: ${responseText.length} chars`);
    console.log(`[${startTime}][REQ:${requestId}] Raw response preview: ${responseText.substring(0, 200)}...`);
    
    // Determine which hook was used
    const hookToUse = selectedHook || hookOutput.hooks[0];
    
    // Create a result with the raw response for debugging
    const result = {
      content: responseText,
      selectedHook: hookToUse,
      theme: hookOutput.theme || 'Ogólna tematyka',
      form: hookOutput.form || 'post tekstowy',
      cta: hookOutput.cta || 'Sprawdź więcej',
      platform: platform || 'Meta (Instagram/Facebook)',
      promptSource: envPrompt ? 'environment' : 'default',
      promptUsed: SYSTEM_PROMPT.substring(0, 100) + "...",
      debug: {
        systemPromptSource: envPrompt ? 'environment' : 'default',
        systemPromptLength: SYSTEM_PROMPT.length,
        envVarExists: Deno.env.get('SOCIAL_CONTENT_PROMPT') !== undefined,
        envVarEmpty: Deno.env.get('SOCIAL_CONTENT_PROMPT') === "",
        envVarLength: (Deno.env.get('SOCIAL_CONTENT_PROMPT') || "").length,
        usingEnvPrompt: envPrompt ? true : false,
        timestamp: startTime
      },
      version: FUNCTION_VERSION,
      deploymentId: DEPLOYMENT_ID,
      requestId: requestId
    };
    
    console.log(`[${startTime}][REQ:${requestId}] Final response sent with content length: ${result.content.length} chars`);
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          // Add extra no-cache headers to response
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } 
      }
    );
    
  } catch (error) {
    const timestamp = getCurrentTimestamp();
    console.error(`[${timestamp}][REQ:${requestId}] Error in social-content-agent:`, error);
    
    return createErrorResponse(error, {
      timestamp: timestamp,
      requestId: requestId,
      deploymentId: DEPLOYMENT_ID,
      version: FUNCTION_VERSION,
      debug: {
        envVarExists: Deno.env.get('SOCIAL_CONTENT_PROMPT') !== undefined,
        envVarEmpty: Deno.env.get('SOCIAL_CONTENT_PROMPT') === "",
        envVarLength: (Deno.env.get('SOCIAL_CONTENT_PROMPT') || "").length,
        envKeys: Object.keys(Deno.env.toObject())
      }
    });
  }
});
