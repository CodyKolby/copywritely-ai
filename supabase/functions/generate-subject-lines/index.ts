
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

// Enhanced CORS headers with all required fields
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma, expires, x-no-cache',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  console.log(`🚀 [${timestamp}] Request received - ID: ${requestId}`);
  console.log(`🔍 [${requestId}] Method: ${req.method}, URL: ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[${requestId}] Handling OPTIONS preflight request`);
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Read raw body as text first for debugging
    const rawBody = await req.text();
    console.log(`[${requestId}] 🧾 RAW REQUEST BODY LENGTH: ${rawBody.length} chars`);
    console.log(`[${requestId}] 🧾 RAW REQUEST BODY (first 500 chars): ${rawBody.substring(0, 500)}...`);

    // Parse JSON manually after logging raw body
    let data;
    try {
      data = JSON.parse(rawBody);
      console.log(`[${requestId}] ✅ JSON parsing successful`);
    } catch (parseError) {
      console.error(`[${requestId}] ❌ Failed to parse JSON:`, parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body', details: parseError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { prompt, debugMode, requestId: clientRequestId } = data;
    console.log(`[${requestId}] 🔗 Client request ID: ${clientRequestId || 'Not provided'}`);
    
    if (!prompt) {
      console.log(`[${requestId}] ❌ Missing prompt parameter`);
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] 📦 Prompt length: ${prompt.length} chars`);
    console.log(`[${requestId}] 🆔 Debug mode: ${debugMode ? 'enabled' : 'disabled'}`);
    
    if (debugMode) {
      // Return debug response immediately without calling OpenAI
      console.log(`[${requestId}] 🧪 Debug mode enabled, returning test subjects`);
      return new Response(
        JSON.stringify({
          subject1: "DEBUG SUBJECT 1: " + new Date().toISOString(),
          subject2: "DEBUG SUBJECT 2: " + new Date().toISOString(),
          timestamp: timestamp,
          requestId: requestId,
          rawPrompt: prompt.substring(0, 200) + "..." // We only return a preview of the prompt
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!OPENAI_API_KEY) {
      console.error(`[${requestId}] ❌ OpenAI API key is missing`);
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[${requestId}] 🧠 SENDING REQUEST TO OPENAI`);
    console.log(`[${requestId}] 🧠 PROMPT PREVIEW: ${prompt.substring(0, 200)}...`);

    // Retry mechanism for OpenAI API calls
    let attempts = 0;
    const maxAttempts = 3;
    let response;
    let lastError;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[${requestId}] 🔄 API call attempt ${attempts}/${maxAttempts}`);
      
      try {
        // Call OpenAI API with the provided prompt
        response = await fetch('https://api.openai.com/v1/chat/completions', {
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
              {
                role: 'system',
                content: 'Jesteś ekspertem od tworzenia przyciągających uwagę linii tytułowych dla emaili marketingowych.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 300
          }),
        });
        
        // If the request was successful, break out of the retry loop
        if (response.ok) {
          console.log(`[${requestId}] ✅ OpenAI API responded with status ${response.status}`);
          break;
        } else {
          const errorData = await response.json().catch(() => ({}));
          lastError = `OpenAI API returned status ${response.status}: ${JSON.stringify(errorData)}`;
          console.error(`[${requestId}] ❌ ${lastError}`);
          
          if (response.status === 429 || response.status >= 500) {
            // For rate limiting (429) or server errors (5xx), we'll retry
            console.log(`[${requestId}] ⏱️ Retrying in ${attempts * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, attempts * 1000));
            continue;
          } else {
            // For other errors like 400, 401, etc., don't retry
            throw new Error(lastError);
          }
        }
      } catch (error) {
        console.error(`[${requestId}] ❌ Fetch error on attempt ${attempts}:`, error);
        lastError = error;
        
        // For network errors, we'll retry
        if (attempts < maxAttempts) {
          console.log(`[${requestId}] ⏱️ Retrying in ${attempts * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
          continue;
        }
      }
    }
    
    // If we've exhausted all attempts without a successful response
    if (!response || !response.ok) {
      throw new Error(lastError || `Failed to get response from OpenAI after ${maxAttempts} attempts`);
    }
    
    const responseData = await response.json();
    const aiOutput = responseData.choices[0].message.content;
    
    console.log(`[${requestId}] 🤖 Raw AI output length: ${aiOutput.length} chars`);
    console.log(`[${requestId}] 🤖 Raw AI output: ${aiOutput}`);
    
    // Parse the subject lines from the AI output with improved regex patterns
    let subject1 = "Default subject 1";
    let subject2 = "Default subject 2";
    
    try {
      // Enhanced regex for more flexible parsing
      // Look for patterns like "Subject 1: ...", "Subject1: ...", "1. ..." or explicit labels
      const subject1Patterns = [
        /subject\s*1\s*[:=]\s*(.+?)(?=$|\n|\r|subject\s*2)/i,
        /subject1\s*[:=]\s*(.+?)(?=$|\n|\r|subject2)/i,
        /1\.\s*(.+?)(?=$|\n|\r|2\.)/i,
        /pierwszy\s+tytu[łl]\s*[:=]\s*(.+?)(?=$|\n|\r)/i,
        /first\s+subject\s*[:=]\s*(.+?)(?=$|\n|\r)/i,
      ];
      
      const subject2Patterns = [
        /subject\s*2\s*[:=]\s*(.+?)(?=$|\n|\r)/i,
        /subject2\s*[:=]\s*(.+?)(?=$|\n|\r)/i,
        /2\.\s*(.+?)(?=$|\n|\r)/i,
        /drugi\s+tytu[łl]\s*[:=]\s*(.+?)(?=$|\n|\r)/i,
        /second\s+subject\s*[:=]\s*(.+?)(?=$|\n|\r)/i,
      ];
      
      // Try all patterns for subject 1
      for (const pattern of subject1Patterns) {
        const match = aiOutput.match(pattern);
        if (match && match[1]) {
          subject1 = match[1].trim();
          console.log(`[${requestId}] ✅ Found subject1 with pattern:`, pattern);
          break;
        }
      }
      
      // Try all patterns for subject 2
      for (const pattern of subject2Patterns) {
        const match = aiOutput.match(pattern);
        if (match && match[1]) {
          subject2 = match[1].trim();
          console.log(`[${requestId}] ✅ Found subject2 with pattern:`, pattern);
          break;
        }
      }
      
      // Special case: if the response is very short and clearly formatted
      if (aiOutput.split('\n').length <= 3) {
        const lines = aiOutput.split('\n').filter(line => line.trim().length > 0);
        if (lines.length >= 2 && !subject1.includes("Default")) {
          subject1 = lines[0].replace(/^[^:]*:\s*/, '').trim();
          subject2 = lines[1].replace(/^[^:]*:\s*/, '').trim();
          console.log(`[${requestId}] ✅ Using simple line-based extraction for subjects`);
        }
      }
      
      // If we have just two lines and nothing worked, use them directly
      if ((subject1 === "Default subject 1" || subject2 === "Default subject 2") && aiOutput.split('\n').length <= 3) {
        const lines = aiOutput.split('\n').filter(line => line.trim().length > 0);
        if (lines.length >= 2) {
          if (subject1 === "Default subject 1") subject1 = lines[0].trim();
          if (subject2 === "Default subject 2") subject2 = lines[1].trim();
          console.log(`[${requestId}] ✅ Fallback to direct line extraction`);
        }
      }
      
      // Handle the case where the subject is the entire output and doesn't contain any identifiers
      if (subject1 === "Default subject 1" && subject2 === "Default subject 2" && aiOutput.trim().length < 200) {
        // If it's a short output with no identifiers, try to split it intelligently
        const possibleSubjects = aiOutput.split(/\n|\.|\?|!/);
        const filteredSubjects = possibleSubjects.filter(s => s.trim().length > 5);
        
        if (filteredSubjects.length >= 2) {
          subject1 = filteredSubjects[0].trim();
          subject2 = filteredSubjects[1].trim();
          console.log(`[${requestId}] ✅ Using intelligent splitting for subjects`);
        } else if (filteredSubjects.length === 1) {
          // If there's only one good sentence, use it for both (better than nothing)
          subject1 = filteredSubjects[0].trim();
          subject2 = filteredSubjects[0].trim();
          console.log(`[${requestId}] ⚠️ Only found one good subject, duplicating it`);
        }
      }
      
      // Final check - if we still have defaults but have content, just use the first 100 chars
      if (subject1 === "Default subject 1" && aiOutput.trim().length > 0) {
        subject1 = aiOutput.trim().substring(0, 100);
        console.log(`[${requestId}] ⚠️ Falling back to raw output substring for subject1`);
      }
      
      if (subject2 === "Default subject 2" && aiOutput.trim().length > 0) {
        const secondHalf = aiOutput.trim().substring(aiOutput.length / 2);
        subject2 = secondHalf.substring(0, 100);
        console.log(`[${requestId}] ⚠️ Falling back to raw output substring for subject2`);
      }
      
      console.log(`[${requestId}] ✅ Successfully extracted subject lines`);
    } catch (parseError) {
      console.error(`[${requestId}] ❌ Failed to parse subject lines from AI output:`, parseError);
      console.log(`[${requestId}] ❌ Raw AI output that failed parsing:`, aiOutput);
      
      // Last resort: if parsing failed completely, use a portion of the raw output
      if (aiOutput && aiOutput.trim().length > 0) {
        // Split the output in half and use as subjects
        const midpoint = Math.floor(aiOutput.length / 2);
        subject1 = aiOutput.substring(0, midpoint).split('\n')[0].trim();
        subject2 = aiOutput.substring(midpoint).split('\n')[0].trim();
        
        // Truncate if too long
        if (subject1.length > 100) subject1 = subject1.substring(0, 97) + '...';
        if (subject2.length > 100) subject2 = subject2.substring(0, 97) + '...';
        
        console.log(`[${requestId}] ⚠️ Using emergency fallback for subject extraction`);
      }
    }
    
    console.log(`[${requestId}] 📋 Final subject lines:`);
    console.log(`[${requestId}] 📋 Subject 1: ${subject1}`);
    console.log(`[${requestId}] 📋 Subject 2: ${subject2}`);
    
    // Return a response with a timestamp and all debug info to help debug caching issues
    return new Response(
      JSON.stringify({ 
        subject1, 
        subject2,
        rawPrompt: prompt.substring(0, 300) + "...", // Return only a preview of the prompt
        timestamp: timestamp,
        requestId: requestId,
        rawOutput: aiOutput
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
    console.error(`❌ [${timestamp}] [${requestId}] Error in generate-subject-lines:`, error.message);
    console.error(error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: timestamp,
        requestId: requestId
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } 
      }
    );
  }
});
