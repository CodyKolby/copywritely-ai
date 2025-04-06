
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma, x-no-cache',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  console.log(`🚀 Request received [${timestamp}] Request ID: ${requestId}`);
  
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
    console.log(`[${requestId}] 🧾 RAW REQUEST BODY:`, rawBody);

    // Parse JSON manually after logging raw body
    const { narrativeBlueprint, surveyData } = JSON.parse(rawBody);
    
    if (!narrativeBlueprint) {
      console.log(`[${requestId}] Missing narrative blueprint`);
      return new Response(
        JSON.stringify({ error: 'Narrative blueprint is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] 📦 Blueprint size: ${JSON.stringify(narrativeBlueprint).length}`);
    console.log(`[${requestId}] 📊 Survey size: ${JSON.stringify(surveyData || {}).length}`);
    console.log(`[${requestId}] 🆔 DebugFlag from frontend:`, narrativeBlueprint?.debugFlag || 'none');
    
    // Use static values for testing purposes
    const prompt = `Zignoruj wszystkie dane poniżej. Twoim JEDYNYM zadaniem jest wypisać:

subject1: debug1
subject2: debug2
`;

    console.log(`[${requestId}] 🧠 FINAL PROMPT TO OPENAI:`, prompt);

    // Call OpenAI API with the Subject Line prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`[${requestId}] OpenAI API error:`, errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    const aiOutput = data.choices[0].message.content;
    
    console.log(`[${requestId}] 🤖 Raw AI output:`, aiOutput);
    
    // Parse the output to extract the two subject lines - use more precise regex
    const subject1Match = aiOutput.match(/subject1:\s*(.*?)(?:\s*\n|\s*$)/i);
    const subject2Match = aiOutput.match(/subject2:\s*(.*?)(?:\s*\n|\s*$)/i);
    
    // Extract the subjects from the matches, or use fallbacks
    const subject1 = subject1Match && subject1Match[1] ? subject1Match[1].trim() : "Failed to parse subject1";
    const subject2 = subject2Match && subject2Match[1] ? subject2Match[1].trim() : "Failed to parse subject2";
    
    console.log(`[${requestId}] 📋 Parsed subject lines:`);
    console.log(`[${requestId}] Subject 1:`, subject1);
    console.log(`[${requestId}] Subject 2:`, subject2);
    
    // Return a response with a timestamp and all debug info to help debug caching issues
    return new Response(
      JSON.stringify({ 
        subject1, 
        subject2,
        rawPrompt: prompt,
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
    console.error(`❌ Error in generate-subject-lines function [${timestamp}] [${requestId}]: ${error.message}`);
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
