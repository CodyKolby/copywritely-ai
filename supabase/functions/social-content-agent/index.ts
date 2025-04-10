
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../shared/cors.ts";
import { generateDeploymentId, generateCacheBuster, getCurrentTimestamp } from "../shared/utils.ts";
import { callOpenAI, createErrorResponse } from "../shared/openai.ts";
import { constructContentPrompt } from "./content-service.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Version tracking to help detect updates
const FUNCTION_VERSION = "v1.7.0"; 

// Generate a deployment ID to track specific deployments
const DEPLOYMENT_ID = generateDeploymentId();

// Define a hardcoded prompt to use
const HARDCODED_PROMPT = `
TWOIM ZADANIEM JEST NAPISANE "TESTSCRIPT"
`;

// Log startup information
console.log(`[STARTUP][${DEPLOYMENT_ID}] SocialContentAgent initialized with version ${FUNCTION_VERSION}`);
console.log(`[STARTUP][${DEPLOYMENT_ID}] Using HARDCODED prompt length: ${HARDCODED_PROMPT.length} characters`);
console.log(`[STARTUP][${DEPLOYMENT_ID}] Hardcoded prompt first 100 chars: ${HARDCODED_PROMPT.substring(0, 100)}`);

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
    
    const { targetAudience, advertisingGoal, platform, hookOutput, cacheBuster, timestamp, selectedHook } = requestData;
    
    // Log request summary
    console.log(`[${startTime}][REQ:${requestId}] Processing request with:`, { 
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
      console.error(`[${startTime}][REQ:${requestId}] Missing target audience data`);
      return new Response(
        JSON.stringify({ error: 'Brak danych o grupie docelowej' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
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
    
    // Use hardcoded prompt
    const SYSTEM_PROMPT = HARDCODED_PROMPT;
    
    // Log prompt information
    console.log(`[${startTime}][REQ:${requestId}] SYSTEM PROMPT LENGTH: ${SYSTEM_PROMPT.length} characters`);
    console.log(`[${startTime}][REQ:${requestId}] SYSTEM PROMPT FIRST 100 CHARS: ${SYSTEM_PROMPT.substring(0, 100)}...`);
    console.log(`[${startTime}][REQ:${requestId}] SYSTEM PROMPT SOURCE: HARDCODED IN CODE v${FUNCTION_VERSION}`);
    
    // Print hook output for debugging
    console.log(`[${startTime}][REQ:${requestId}] Hook output details:`, {
      hooks: hookOutput.hooks,
      theme: hookOutput.theme,
      form: hookOutput.form,
      cta: hookOutput.cta
    });
    
    // Construct prompt for agent
    const userPrompt = constructContentPrompt(requestData, requestId, DEPLOYMENT_ID, FUNCTION_VERSION);
    
    // Prepare cache busting and metadata
    const currentTimestamp = timestamp || startTime;
    const requestCacheBuster = generateCacheBuster(requestId, DEPLOYMENT_ID);
    
    // Call OpenAI
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
    
    // Log response
    console.log(`[${startTime}][REQ:${requestId}] Raw response length: ${responseText.length} chars`);
    console.log(`[${startTime}][REQ:${requestId}] Raw response preview: ${responseText.substring(0, 200)}...`);
    
    // Determine which hook was used
    const hookToUse = selectedHook || hookOutput.hooks[0];
    
    // Create result with metadata
    const result = {
      content: responseText,
      selectedHook: hookToUse,
      theme: hookOutput.theme || 'Ogólna tematyka',
      form: hookOutput.form || 'post tekstowy',
      cta: hookOutput.cta || 'Sprawdź więcej',
      platform: platform || 'Meta (Instagram/Facebook)',
      promptSource: 'HARDCODED_IN_CODE',
      promptUsed: SYSTEM_PROMPT.substring(0, 100) + "...",
      debugInfo: {
        systemPromptSource: 'HARDCODED_IN_CODE',
        systemPromptLength: SYSTEM_PROMPT.length,
        timestamp: startTime,
        functionVersion: FUNCTION_VERSION,
        promptFirstChars: SYSTEM_PROMPT.substring(0, 100),
        fullPrompt: SYSTEM_PROMPT
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
        promptSource: 'HARDCODED_IN_CODE'
      }
    });
  }
});
