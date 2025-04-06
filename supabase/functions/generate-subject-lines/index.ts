
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
    let data;
    try {
      data = JSON.parse(rawBody);
      console.log(`[${requestId}] JSON parsing successful`);
    } catch (parseError) {
      console.error(`[${requestId}] Failed to parse JSON:`, parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { narrativeBlueprint, surveyData } = data;
    
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
    
    // Construct a prompt using the narrative blueprint
    // This is a simplified version - you would typically use more sophisticated prompt engineering
    const prompt = `Based on the following narrative blueprint:
- Emotional points: ${narrativeBlueprint.punktyemocjonalne}
- Email style: ${narrativeBlueprint.stylmaila}
- Narrative axis: ${narrativeBlueprint.osnarracyjna}

Generate two compelling email subject lines that will attract the attention of the target audience.
Format your response exactly as follows (replace examples with your generated content):

subject1: Your first compelling subject line here
subject2: Your second compelling subject line here
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
    
    const responseData = await response.json();
    const aiOutput = responseData.choices[0].message.content;
    
    console.log(`[${requestId}] 🤖 Raw AI output:`, aiOutput);
    
    // Parse the subject lines from the AI output
    let subject1 = "Default subject 1";
    let subject2 = "Default subject 2";
    
    try {
      // Extract subject lines using regex
      const subject1Match = aiOutput.match(/subject1:\s*(.+?)($|\n)/i);
      const subject2Match = aiOutput.match(/subject2:\s*(.+?)($|\n)/i);
      
      if (subject1Match && subject1Match[1]) {
        subject1 = subject1Match[1].trim();
      }
      
      if (subject2Match && subject2Match[1]) {
        subject2 = subject2Match[1].trim();
      }
      
      console.log(`[${requestId}] Extracted subject lines successfully`);
    } catch (parseError) {
      console.error(`[${requestId}] Failed to parse subject lines from AI output:`, parseError);
      console.log(`[${requestId}] Using default subject lines`);
    }
    
    console.log(`[${requestId}] 📋 Final subject lines:`);
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
