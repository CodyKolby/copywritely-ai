
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma, expires, x-no-cache',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
};

// Default UI Cleaner prompt
const DEFAULT_UI_CLEANER_PROMPT = `Jesteś zaawansowanym copywriterem odpowiedzialnym za edytowanie gotowych maili marketingowych w języku polskim. Twoim zadaniem nie jest zmiana treści, ale poprawa jej formy i czytelności.

Zasady edycji, które muszą zostać ściśle przestrzegane:

1. Rozbijaj długie akapity, tak aby każdy akapit zawierał tylko jedno zdanie.

2. Zachowuj pustą linijkę między akapitami, aby ułatwić czytanie.

3. Usuń wszystkie myślniki oraz wszelkie formy mianowników lub list. Zamiast nich twórz pełne zdania.

4. Skup się tylko na formie tekstu, nie zmieniaj jego sensu ani tonacji.

5. Nie dodawaj nowych treści ani nie skracaj istniejących.

6. Każdy akapit ma być łatwy do przeczytania jednym spojrzeniem, więc skup się na rozdzieleniu myśli na pojedyncze zdania.

Te zasady muszą być spełnione w 100%, nie są opcjonalne.

Treść, którą otrzymasz, będzie gotowym mailem marketingowym.`;

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = new Date().toISOString();
  
  console.log(`=== UI CLEANER START [${requestId}] ===`);
  console.log(`🔍 [${requestId}] Timestamp: ${startTime}`);
  console.log(`🔍 [${requestId}] Method: ${req.method}`);
  console.log(`🔍 [${requestId}] URL: ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[${requestId}] UI-CLEANER: Handling OPTIONS preflight request`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if this is a test request from URL param
    const url = new URL(req.url);
    const isTestRequest = url.searchParams.get('test') === 'true';
    
    // Get raw request body for logging first
    const rawBody = await req.text();
    console.log(`[${requestId}] UI-CLEANER: Raw request body length: ${rawBody.length} chars`);
    
    // Check for test request in the body
    const isTestViaBody = rawBody.includes('"test":"connection"') || rawBody.length < 20;
    
    if (isTestRequest || isTestViaBody) {
      console.log(`[${requestId}] UI-CLEANER: Handling test request`);
      return new Response(
        JSON.stringify({
          cleanedContent: "To jest testowa treść wyczyszczona przez UI Cleaner.",
          status: "success",
          message: "Test connection successful",
          timestamp: startTime,
          requestId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // For regular requests, parse the JSON body
    let requestData;
    try {
      requestData = JSON.parse(rawBody);
      console.log(`[${requestId}] UI-CLEANER: JSON parsing successful`);
    } catch (parseError) {
      console.error(`[${requestId}] UI-CLEANER: Failed to parse JSON:`, parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body', details: parseError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { 
      prompt = DEFAULT_UI_CLEANER_PROMPT,
      emailContent,
      _timestamp,
      _nonce 
    } = requestData;
    
    if (!emailContent) {
      console.error(`[${requestId}] UI-CLEANER: Missing email content`);
      return new Response(
        JSON.stringify({ error: 'Email content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] UI-CLEANER: Processing email content with length: ${emailContent.length} chars`);
    
    // Check if we have an OpenAI API key
    if (!OPENAI_API_KEY) {
      console.error(`[${requestId}] UI-CLEANER: OpenAI API key is missing`);
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[${requestId}] UI-CLEANER: Calling OpenAI API...`);

    // Retry mechanism for OpenAI API calls
    let attempts = 0;
    const maxAttempts = 3;
    let apiResponse;
    let lastError;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[${requestId}] UI-CLEANER: API call attempt ${attempts}/${maxAttempts}`);
      
      try {
        apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Request-ID': requestId,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: prompt },
              { role: 'user', content: emailContent }
            ],
            temperature: 0.5,
            max_tokens: 3000,
          }),
        });
        
        if (apiResponse.ok) {
          console.log(`[${requestId}] UI-CLEANER: OpenAI API responded with status ${apiResponse.status}`);
          break;
        } else {
          const errorData = await apiResponse.json().catch(() => ({}));
          lastError = `OpenAI API returned status ${apiResponse.status}: ${JSON.stringify(errorData)}`;
          console.error(`[${requestId}] UI-CLEANER: ${lastError}`);
          
          if (apiResponse.status === 429 || apiResponse.status >= 500) {
            console.log(`[${requestId}] UI-CLEANER: Retrying in ${attempts * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, attempts * 1000));
            continue;
          } else {
            throw new Error(lastError);
          }
        }
      } catch (error) {
        console.error(`[${requestId}] UI-CLEANER: Fetch error on attempt ${attempts}:`, error);
        lastError = error;
        
        if (attempts < maxAttempts) {
          console.log(`[${requestId}] UI-CLEANER: Retrying in ${attempts * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
          continue;
        }
      }
    }
    
    // If we've exhausted all attempts without a successful response
    if (!apiResponse || !apiResponse.ok) {
      throw new Error(lastError || `Failed to get response from OpenAI after ${maxAttempts} attempts`);
    }

    const responseData = await apiResponse.json();
    const cleanedContent = responseData.choices[0].message.content;
    
    console.log(`[${requestId}] UI-CLEANER: Cleaned content length: ${cleanedContent.length} chars`);
    
    console.log(`[${requestId}] UI-CLEANER: Email content cleaned successfully`);
    
    return new Response(
      JSON.stringify({
        cleanedContent,
        originalLength: emailContent.length,
        cleanedLength: cleanedContent.length,
        timestamp: startTime,
        requestId
      }),
      { headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } 
      }
    );
  } catch (error) {
    console.error(`[${requestId}] UI-CLEANER: Error in ui-cleaner function:`, error.message);
    console.error(error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        timestamp: startTime,
        requestId
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } finally {
    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
    console.log(`=== UI CLEANER END [${requestId}] (Duration: ${duration}ms) ===`);
  }
});
