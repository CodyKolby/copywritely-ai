
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuration
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// CORS headers - Updated to include cache-control, pragma, expires, and x-no-cache headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma, expires, x-no-cache',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  console.log(`=== GENERATE EMAIL CONTENT START (${requestId}) ===`);
  console.log('Timestamp:', timestamp);
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log(`[${timestamp}][REQ:${requestId}] Handling OPTIONS preflight request`);
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    console.log(`[${timestamp}][REQ:${requestId}] Processing POST request for email content generation`);
    
    // Parse request data
    const requestText = await req.text();
    let requestData;
    
    try {
      requestData = JSON.parse(requestText);
      console.log(`[${timestamp}][REQ:${requestId}] JSON parsed successfully`);
    } catch (parseError) {
      console.error(`[${timestamp}][REQ:${requestId}] JSON parse error:`, parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body', details: parseError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { prompt, structureType, debugMode } = requestData;
    
    // Log received data
    console.log(`[${timestamp}][REQ:${requestId}] Structure type: ${structureType}`);
    console.log(`[${timestamp}][REQ:${requestId}] Prompt length: ${prompt?.length || 0} chars`);
    console.log(`[${timestamp}][REQ:${requestId}] Debug mode: ${debugMode ? 'enabled' : 'disabled'}`);
    
    if (!prompt) {
      console.error(`[${timestamp}][REQ:${requestId}] Missing prompt parameter`);
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Log the prompt for debugging (only first 500 characters to avoid excessive logs)
    console.log(`[${timestamp}][REQ:${requestId}] Prompt (first 500 chars): ${prompt.substring(0, 500)}...`);
    
    // For debug mode, return mock response without calling OpenAI
    if (debugMode) {
      console.log(`[${timestamp}][REQ:${requestId}] Debug mode - returning sample response`);
      
      const debugResponse = {
        emailContent: `DEBUG MODE: To jest przykładowa treść maila w strukturze ${structureType}.\n\n` +
                      `Struktura ${structureType === 'PAS' ? 'Problem-Agitacja-Rozwiązanie' : 'Customer Journey Narrative'}.\n\n` +
                      `Ta odpowiedź została wygenerowana w trybie debugowania bez wywoływania OpenAI.`,
        structureUsed: structureType,
        timestamp: timestamp,
        requestId: requestId,
        debugInfo: { promptLength: prompt.length }
      };
      
      return new Response(
        JSON.stringify(debugResponse),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate OpenAI API key
    if (!openAIApiKey) {
      console.error(`[${timestamp}][REQ:${requestId}] OpenAI API key missing`);
      return new Response(
        JSON.stringify({ error: 'Brak skonfigurowanego klucza OpenAI API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log that we're about to call OpenAI
    console.log(`[${timestamp}][REQ:${requestId}] Sending request to OpenAI API for structure: ${structureType}`);
    
    // Set the system prompt based on structure type
    let systemPrompt = `Jesteś ekspertem od tworzenia treści emaili marketingowych w języku polskim.
Specjalizujesz się w tworzeniu emaili o strukturze ${structureType === 'PAS' 
  ? 'Problem-Agitacja-Rozwiązanie, gdzie najpierw identyfikujesz problem, następnie wzmacniasz jego znaczenie, a na koniec przedstawiasz rozwiązanie' 
  : 'Customer Journey, gdzie prowadzisz czytelnika przez narracyjną podróż od problemu do rozwiązania'}.
`;
    
    console.log(`[${timestamp}][REQ:${requestId}] System prompt: ${systemPrompt}`);
    
    // Call OpenAI to generate email content - with retry mechanism
    let response;
    let attempts = 0;
    const maxAttempts = 3;
    let lastError;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[${timestamp}][REQ:${requestId}] OpenAI API call attempt ${attempts}/${maxAttempts}`);
      
      try {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Request-ID': requestId
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 2000,  // Zwiększona wartość z 1500 do 2000
          }),
        });
        
        if (response.ok) {
          console.log(`[${timestamp}][REQ:${requestId}] OpenAI API responded OK (status ${response.status})`);
          break;
        } else {
          const errorData = await response.json();
          lastError = `OpenAI API error (status ${response.status}): ${JSON.stringify(errorData)}`;
          console.error(`[${timestamp}][REQ:${requestId}] ${lastError}`);
          
          // For rate limiting (429) or server errors (5xx), we'll retry
          if (response.status === 429 || response.status >= 500) {
            console.log(`[${timestamp}][REQ:${requestId}] Retrying in ${attempts * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, attempts * 1000));
            continue;
          } else {
            // For other errors like 400 (bad request), don't retry
            throw new Error(lastError);
          }
        }
      } catch (error) {
        console.error(`[${timestamp}][REQ:${requestId}] Fetch error on attempt ${attempts}:`, error);
        lastError = error.message || String(error);
        
        if (attempts < maxAttempts) {
          console.log(`[${timestamp}][REQ:${requestId}] Retrying in ${attempts * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
        }
      }
    }
    
    // If we've exhausted all attempts without a successful response
    if (!response || !response.ok) {
      throw new Error(lastError || `Failed to get response from OpenAI after ${maxAttempts} attempts`);
    }

    // Parse OpenAI response
    const data = await response.json();
    console.log(`[${timestamp}][REQ:${requestId}] OpenAI response received, parsing content`);
    
    // Extract email content from OpenAI response
    const emailContent = data.choices[0].message.content;
    console.log(`[${timestamp}][REQ:${requestId}] Generated content length: ${emailContent.length} chars`);
    console.log(`[${timestamp}][REQ:${requestId}] Content preview (first 300 chars): ${emailContent.substring(0, 300)}...`);
    
    // Prepare response object
    const responseObject = {
      emailContent: emailContent,
      structureUsed: structureType,
      timestamp: timestamp,
      requestId: requestId,
      modelUsed: data.model || 'gpt-4o-mini',
      tokensUsed: data.usage?.total_tokens || 'unknown',
      rawPromptPreview: prompt.substring(0, 300) + (prompt.length > 300 ? '...' : '')
    };
    
    console.log(`[${timestamp}][REQ:${requestId}] Sending response for structure ${structureType}`);
    
    // Send response
    return new Response(
      JSON.stringify(responseObject),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error(`[${timestamp}][REQ:${requestId}] Unhandled error in generate-email-content:`, error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected error',
        details: error.message || String(error),
        timestamp: timestamp,
        requestId: requestId
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
