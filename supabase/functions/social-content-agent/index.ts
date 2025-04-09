
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../shared/cors.ts";
import { generateDeploymentId, generateCacheBuster, getCurrentTimestamp } from "../shared/utils.ts";
import { callOpenAI, createErrorResponse } from "../shared/openai.ts";
import { constructContentPrompt } from "./content-service.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Default prompt as fallback
const DEFAULT_PROMPT = `Zwróć sam tekst posta, który brzmi "TEST" bez żadnych dodatkowych komentarzy czy formatowania.`;

// Get system prompt from environment variable with fallback to default
const SYSTEM_PROMPT = Deno.env.get('SOCIAL_CONTENT_PROMPT') || DEFAULT_PROMPT;

// Version tracking to help detect updates
const FUNCTION_VERSION = "v1.1.0";

// Generate a deployment ID to track specific deployments
const DEPLOYMENT_ID = generateDeploymentId();

console.log(`[STARTUP][${DEPLOYMENT_ID}] SocialContentAgent initialized with version ${FUNCTION_VERSION}`);
console.log(`[STARTUP][${DEPLOYMENT_ID}] Using prompt from environment: ${Deno.env.get('SOCIAL_CONTENT_PROMPT') ? 'YES' : 'NO'}`);
console.log(`[STARTUP][${DEPLOYMENT_ID}] Current system prompt: "${SYSTEM_PROMPT}"`);

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
    
    console.log(`[${startTime}][REQ:${requestId}] Request data received:`, JSON.stringify(requestData).substring(0, 500));
    
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
    
    if (!targetAudience || !hookOutput) {
      console.error(`[${startTime}][REQ:${requestId}] Missing required data:`, {
        hasTargetAudience: !!targetAudience,
        hasHookOutput: !!hookOutput
      });
      return new Response(
        JSON.stringify({ error: 'Brak wymaganych danych' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[${startTime}][REQ:${requestId}] Target audience data:`, JSON.stringify(targetAudience).substring(0, 300));
    console.log(`[${startTime}][REQ:${requestId}] Hook output:`, JSON.stringify(hookOutput));
    
    // Construct prompt for agent
    const userPrompt = constructContentPrompt(requestData, requestId, DEPLOYMENT_ID, FUNCTION_VERSION);
    
    // Log the prompts for debugging
    console.log(`[${startTime}][REQ:${requestId}] SYSTEM PROMPT BEING USED:`, SYSTEM_PROMPT);
    console.log(`[${startTime}][REQ:${requestId}] USER PROMPT BEING USED (with anti-cache measures):`, userPrompt);
    
    // Prepare cache busting and metadata
    const currentTimestamp = timestamp || startTime;
    const randomValue = Math.random().toString(36).substring(2, 15);
    const requestCacheBuster = generateCacheBuster(requestId, DEPLOYMENT_ID);
    
    // Get response from OpenAI with cache-busting headers
    console.log(`[${startTime}][REQ:${requestId}] Sending request to OpenAI API with cache-busting parameters`);
    
    const data = await callOpenAI(userPrompt, SYSTEM_PROMPT, openAIApiKey, {
      requestId,
      timestamp: currentTimestamp,
      cacheBuster: requestCacheBuster,
      deploymentId: DEPLOYMENT_ID,
      functionVersion: FUNCTION_VERSION
    });

    const responseText = data.choices[0].message.content;
    
    // Log complete response from API
    console.log(`[${startTime}][REQ:${requestId}] Raw OpenAI response:`, responseText);
    
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
      debugInfo: {
        systemPromptUsed: SYSTEM_PROMPT,
        promptSource: Deno.env.get('SOCIAL_CONTENT_PROMPT') ? 'environment' : 'default',
        timestamp: startTime,
        requestId: requestId,
        deploymentId: DEPLOYMENT_ID,
        functionVersion: FUNCTION_VERSION
      }
    };
    
    console.log(`[${startTime}][REQ:${requestId}] Final response sent:`, JSON.stringify(result).substring(0, 500));
    
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
      debugInfo: {
        systemPromptUsed: SYSTEM_PROMPT,
        promptSource: Deno.env.get('SOCIAL_CONTENT_PROMPT') ? 'environment' : 'default',
        functionVersion: FUNCTION_VERSION
      }
    });
  }
});
