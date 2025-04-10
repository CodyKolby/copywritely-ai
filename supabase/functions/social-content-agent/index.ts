
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../shared/cors.ts";
import { generateDeploymentId, generateCacheBuster, getCurrentTimestamp } from "../shared/utils.ts";
import { callOpenAI, createErrorResponse } from "../shared/openai.ts";
import { constructContentPrompt } from "./content-service.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const socialContentPrompt = Deno.env.get('SOCIAL_CONTENT_PROMPT');

// Version tracking to help detect updates - ENSURE THIS IS ALWAYS UPDATED TO MATCH social-hook-agent
const FUNCTION_VERSION = "v1.8.0"; 

// Generate a deployment ID to track specific deployments
const DEPLOYMENT_ID = generateDeploymentId();

// Define a hardcoded prompt to use - CRITICAL: This is the only prompt that should be used
const HARDCODED_PROMPT = `
TWOIM ZADANIEM JEST NAPISANIE "DOMINIKKOLBER"
`;

// Log startup information with clear identifiers
console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] SocialContentAgent initialized with version ${FUNCTION_VERSION}`);
console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] Using HARDCODED prompt length: ${HARDCODED_PROMPT.length} characters`);
console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] Hardcoded prompt full:\n${HARDCODED_PROMPT}`);

// Check if there's an environment variable prompt - log info but WE WILL NOT USE IT
if (socialContentPrompt) {
  console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] Found SOCIAL_CONTENT_PROMPT env variable of length: ${socialContentPrompt.length}`);
  console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] ENV prompt first 100 chars: ${socialContentPrompt.substring(0, 100)}`);
  console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] !!! IMPORTANT: We will IGNORE this and use HARDCODED_PROMPT instead !!!`);
} else {
  console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] No SOCIAL_CONTENT_PROMPT env variable found, using hardcoded prompt`);
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = getCurrentTimestamp();
  console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] SocialContentAgent received request:`, req.method, req.url);
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
    
    const { targetAudience, advertisingGoal, platform, hookOutput, cacheBuster, timestamp, selectedHook } = requestData;
    
    // Log request summary
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Processing request with:`, { 
      targetAudienceId: targetAudience?.id, 
      advertisingGoal,
      platform,
      hookOutputPresent: !!hookOutput,
      selectedHook: selectedHook || (hookOutput?.hooks?.[0] || 'Brak hooka'),
      timestamp: timestamp || startTime,
      cacheBuster: cacheBuster || 'none'
    });
    
    // Input validation
    if (!targetAudience) {
      console.error(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Missing target audience data`);
      return new Response(
        JSON.stringify({ error: 'Brak danych o grupie docelowej' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!hookOutput || !hookOutput.hooks || hookOutput.hooks.length === 0) {
      console.error(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Invalid or missing hook output:`, hookOutput);
      return new Response(
        JSON.stringify({ 
          error: 'Brak lub nieprawidłowe dane o hookach',
          hookOutput: hookOutput || 'undefined'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Log hook response details to see where it's coming from
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Hook response metadata:`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Hook response version: ${hookOutput.version || 'unknown'}`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Hook response deploymentId: ${hookOutput.deploymentId || 'unknown'}`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Hook response requestId: ${hookOutput.requestId || 'unknown'}`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Hook response promptSource: ${hookOutput.promptSource || 'unknown'}`);
    
    // CRITICAL: ALWAYS use hardcoded prompt - NEVER use environment variable
    const SYSTEM_PROMPT = HARDCODED_PROMPT;
    
    // Log prompt information with clear indicators of source
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] PROMPT SOURCE: HARDCODED_IN_CODE v${FUNCTION_VERSION}`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] SYSTEM PROMPT LENGTH: ${SYSTEM_PROMPT.length} characters`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] SYSTEM PROMPT FULL:\n${SYSTEM_PROMPT}`);
    
    // Print hook output for debugging
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Hook output details:`, {
      hooks: hookOutput.hooks?.map(h => h?.substring(0, 50)),
      theme: hookOutput.theme,
      form: hookOutput.form,
      cta: hookOutput.cta
    });
    
    // Construct prompt for agent
    const userPrompt = constructContentPrompt(requestData, requestId, DEPLOYMENT_ID, FUNCTION_VERSION);
    
    // Prepare cache busting and metadata
    const currentTimestamp = timestamp || startTime;
    const requestCacheBuster = generateCacheBuster(requestId, DEPLOYMENT_ID);
    
    // Call OpenAI with additional headers to prevent caching
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Sending request to OpenAI API with model: gpt-4o-mini`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Cache-busting parameters: ${requestCacheBuster}, ${currentTimestamp}`);
    
    const data = await callOpenAI(userPrompt, SYSTEM_PROMPT, openAIApiKey, {
      requestId,
      timestamp: currentTimestamp,
      cacheBuster: requestCacheBuster,
      deploymentId: DEPLOYMENT_ID,
      functionVersion: FUNCTION_VERSION,
      model: 'gpt-4o-mini',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    const responseText = data.choices[0].message.content;
    
    // Log response
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Raw response length: ${responseText.length} chars`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Raw response full:\n${responseText}`);
    
    // Determine which hook was used
    const hookToUse = selectedHook || hookOutput.hooks[0];
    
    // Create result with metadata - CRITICAL to set version and promptSource correctly
    const result = {
      content: responseText,
      selectedHook: hookToUse,
      theme: hookOutput.theme || 'Ogólna tematyka',
      form: hookOutput.form || 'post tekstowy',
      cta: hookOutput.cta || 'Sprawdź więcej',
      platform: platform || 'Meta (Instagram/Facebook)',
      promptSource: 'HARDCODED_IN_CODE',
      promptUsed: SYSTEM_PROMPT,
      debugInfo: {
        systemPromptSource: 'HARDCODED_IN_CODE',
        systemPromptLength: SYSTEM_PROMPT.length,
        timestamp: startTime,
        requestId: requestId,
        functionVersion: FUNCTION_VERSION,
        promptFullText: SYSTEM_PROMPT,
        hookResponseVersion: hookOutput.version || 'unknown',
        hookResponseDeploymentId: hookOutput.deploymentId || 'unknown'
      },
      version: FUNCTION_VERSION,
      deploymentId: DEPLOYMENT_ID,
      requestId: requestId
    };
    
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Final response sent with version ${FUNCTION_VERSION}, promptSource: HARDCODED_IN_CODE`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Response object: ${JSON.stringify(result).slice(0, 500)}...`);
    
    return new Response(
      JSON.stringify(result),
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
    console.error(`[${timestamp}][REQ:${requestId}][${FUNCTION_VERSION}] Error in social-content-agent:`, error);
    
    return createErrorResponse(error, {
      timestamp: timestamp,
      requestId: requestId,
      deploymentId: DEPLOYMENT_ID,
      version: FUNCTION_VERSION,
      debug: {
        promptSource: 'HARDCODED_IN_CODE'
      }
    });
  }
});
