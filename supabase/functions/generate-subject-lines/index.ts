
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { narrativeBlueprint, surveyData } = await req.json();
    
    if (!narrativeBlueprint) {
      return new Response(
        JSON.stringify({ error: 'Narrative blueprint is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing subject lines for email with timestamp: ${new Date().toISOString()}`);
    console.log(`Request data hash: ${JSON.stringify(narrativeBlueprint).length}-${JSON.stringify(surveyData || {}).length}`);
    
    // Format survey data for the prompt
    let surveyDataString = "";
    if (typeof surveyData === 'object') {
      Object.entries(surveyData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          surveyDataString += `${key}: ${value.join(", ")}\n`;
        } else if (value) {
          surveyDataString += `${key}: ${value}\n`;
        }
      });
    } else {
      surveyDataString = String(surveyData || '');
    }

    // Define hardcoded test subjects
    const hardcodedSubject1 = "NIEDZIAŁA";
    const hardcodedSubject2 = "MOŻE JEDNAK DZIAŁA";

    console.log(`Using hardcoded test subjects for debugging: "${hardcodedSubject1}" and "${hardcodedSubject2}"`);

    // Call OpenAI API with the Subject Line prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Zignoruj wszystkie dane poniżej. Twoim JEDYNYM zadaniem jest wypisać:

subject1: ${hardcodedSubject1}  
subject2: ${hardcodedSubject2}`
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    const aiOutput = data.choices[0].message.content;
    
    console.log("Raw AI output:", aiOutput);
    
    // Parse the output to extract the two subject lines - use more precise regex
    const subject1Match = aiOutput.match(/subject1:\s*(.*?)(?:\s*\n|\s*$)/i);
    const subject2Match = aiOutput.match(/subject2:\s*(.*?)(?:\s*\n|\s*$)/i);
    
    // Use the exact test values to ensure consistency
    const subject1 = hardcodedSubject1;
    const subject2 = hardcodedSubject2;
    
    console.log("Final returned subject lines:");
    console.log("Subject 1:", subject1);
    console.log("Subject 2:", subject2);
    
    // Return a response with a timestamp to help debug caching issues
    return new Response(
      JSON.stringify({ 
        subject1, 
        subject2,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
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
    console.error(`Error in generate-subject-lines function: ${error.message}`);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate' 
        } 
      }
    );
  }
});
