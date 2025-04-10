
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../shared/cors.ts";
import { generateDeploymentId, generateCacheBuster, getCurrentTimestamp } from "../shared/utils.ts";
import { callOpenAI, createErrorResponse } from "../shared/openai.ts";
import { constructContentPrompt } from "./content-service.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const socialContentPrompt = Deno.env.get('SOCIAL_CONTENT_PROMPT');

// Version tracking - IMPORTANT: Update this with each prompt change to force redeployment
const FUNCTION_VERSION = "v1.9.2"; // Incremented to force redeployment 

// Generate a new deployment ID each time
const DEPLOYMENT_ID = generateDeploymentId();

// Define your hardcoded prompt here
const HARDCODED_PROMPT = `Napisz słowo "PROSZENIECHDZIALA"
`;

// Add a unique identifier at the end of the prompt to break any caching
const PROMPT_ID = `${Math.random().toString(36).substring(2, 10)}`;
const VERIFICATION_PHRASE = `PROMPT_VERSION_${FUNCTION_VERSION}_${DEPLOYMENT_ID}_${PROMPT_ID}`;

// Log startup information with clear identifiers
console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] SocialContentAgent initialized with version ${FUNCTION_VERSION}`);
console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] Using HARDCODED prompt length: ${HARDCODED_PROMPT.length} characters`);
console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] Verification phrase: ${VERIFICATION_PHRASE}`);
console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] FIRST 200 CHARS OF PROMPT: ${HARDCODED_PROMPT.substring(0, 200)}...`);
console.log(`[STARTUP][${DEPLOYMENT_ID}][${FUNCTION_VERSION}] LAST 200 CHARS OF PROMPT: ...${HARDCODED_PROMPT.substring(HARDCODED_PROMPT.length - 200)}`);

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
  console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Verification phrase: ${VERIFICATION_PHRASE}`);
  
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
    
    const { targetAudience, advertisingGoal, platform, hookOutput, cacheBuster, timestamp } = requestData;
    
    // Log request summary
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Processing request with:`, { 
      targetAudienceId: targetAudience?.id, 
      advertisingGoal,
      platform,
      hookOutputPresent: !!hookOutput,
      finalIntro: hookOutput?.finalIntro || 'No intro provided',
      timestamp: timestamp || startTime,
      cacheBuster: cacheBuster || 'none'
    });
    
    // Log the full raw hookOutput to help debugging
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] RAW HOOK OUTPUT:`, JSON.stringify(hookOutput));
    
    // Input validation
    if (!targetAudience) {
      console.error(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Missing target audience data`);
      return new Response(
        JSON.stringify({ error: 'Brak danych o grupie docelowej' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!hookOutput || !hookOutput.finalIntro) {
      console.error(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Invalid or missing hook output:`, hookOutput);
      return new Response(
        JSON.stringify({ 
          error: 'Brak lub nieprawidłowe dane intro',
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
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] FINAL INTRO: ${hookOutput.finalIntro}`);
    
    // CRITICAL: ALWAYS use hardcoded prompt - NEVER use environment variable
    // Add the verification phrase to the prompt to ensure it's the current version
    const SYSTEM_PROMPT = `${HARDCODED_PROMPT}\n\nVerification: ${VERIFICATION_PHRASE}`;
    
    // Log prompt information with clear indicators of source
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] PROMPT SOURCE: HARDCODED_IN_CODE v${FUNCTION_VERSION}`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] SYSTEM PROMPT LENGTH: ${SYSTEM_PROMPT.length} characters`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] FIRST 200 CHARS OF PROMPT: ${SYSTEM_PROMPT.substring(0, 200)}...`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] LAST 200 CHARS OF PROMPT: ...${SYSTEM_PROMPT.substring(SYSTEM_PROMPT.length - 200)}`);
    
    // Print hook output for debugging
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Hook output details:`, {
      finalIntro: hookOutput.finalIntro?.substring(0, 100) + '...',
    });
    
    // Construct prompt for agent
    const userPrompt = constructContentPrompt(requestData, requestId, DEPLOYMENT_ID, FUNCTION_VERSION);
    
    // Prepare cache busting and metadata
    const currentTimestamp = timestamp || startTime;
    const requestCacheBuster = `${generateCacheBuster(requestId, DEPLOYMENT_ID)}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Call OpenAI with additional headers to prevent caching
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Sending request to OpenAI API with model: gpt-4o-mini`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Cache-busting parameters: ${requestCacheBuster}, ${currentTimestamp}`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Verification phrase: ${VERIFICATION_PHRASE}`);
    
    const openAIHeaders = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-No-Cache': Date.now().toString(),
      'X-Cache-Buster': requestCacheBuster,
      'X-Request-ID': requestId,
      'X-Deployment-ID': DEPLOYMENT_ID,
      'X-Verification': VERIFICATION_PHRASE
    };
    
    const data = await callOpenAI(userPrompt, SYSTEM_PROMPT, openAIApiKey, {
      requestId,
      timestamp: currentTimestamp,
      cacheBuster: requestCacheBuster,
      deploymentId: DEPLOYMENT_ID,
      functionVersion: FUNCTION_VERSION,
      model: 'gpt-4o-mini',
      headers: openAIHeaders
    });

    const responseText = data.choices[0].message.content;
    
    // Log response
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Raw response length: ${responseText.length} chars`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Raw response first 200 chars:\n${responseText.substring(0, 200)}...`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Raw response last 200 chars:...\n${responseText.substring(responseText.length - 200)}`);
    
    // Get the final intro that was used
    const finalIntro = hookOutput.finalIntro;
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Using finalIntro: "${finalIntro}"`);
    
    // Create result with metadata - CRITICAL to set version and promptSource correctly
    const result = {
      content: responseText,
      finalIntro: finalIntro,
      platform: platform || 'Meta (Instagram/Facebook)',
      promptSource: 'HARDCODED_IN_CODE',
      promptVersion: FUNCTION_VERSION,
      verificationPhrase: VERIFICATION_PHRASE,
      debugInfo: {
        systemPromptSource: 'HARDCODED_IN_CODE',
        systemPromptLength: SYSTEM_PROMPT.length,
        timestamp: startTime,
        requestId: requestId,
        functionVersion: FUNCTION_VERSION,
        promptFirstChars: SYSTEM_PROMPT.substring(0, 100) + "...",
        promptLastChars: "..." + SYSTEM_PROMPT.substring(SYSTEM_PROMPT.length - 100),
        finalIntroText: finalIntro
      },
      version: FUNCTION_VERSION,
      deploymentId: DEPLOYMENT_ID,
      requestId: requestId
    };
    
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Final response sent with version ${FUNCTION_VERSION}, promptSource: HARDCODED_IN_CODE`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Response object keys: ${Object.keys(result).join(', ')}`);
    console.log(`[${startTime}][REQ:${requestId}][${FUNCTION_VERSION}] Verification phrase: ${VERIFICATION_PHRASE}`);
    
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
          'X-Prompt-Source': 'HARDCODED_IN_CODE',
          'X-Verification': VERIFICATION_PHRASE
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
        promptSource: 'HARDCODED_IN_CODE',
        hardcodedPromptLength: HARDCODED_PROMPT.length,
        verificationPhrase: VERIFICATION_PHRASE
      }
    });
  }
});
