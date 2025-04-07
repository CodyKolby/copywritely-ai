
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuration
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// CORS headers - including cache-control headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma, expires, x-no-cache',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log("Otrzymano zapytanie do UI Cleaner:", req.method, req.url);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log("Obsługa zapytania preflight OPTIONS");
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    console.log("Przetwarzanie zapytania POST dla UI Cleaner");
    
    // Parse request data
    const requestData = await req.json();
    const { prompt, emailContent } = requestData;
    
    if (!emailContent) {
      return new Response(
        JSON.stringify({ error: 'Brak treści do przetworzenia' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Log received data
    console.log(`Długość treści email: ${emailContent.length} znaków`);
    console.log(`Fragment treści (pierwsze 100 znaków): ${emailContent.substring(0, 100)}...`);
    console.log(`Otrzymany prompt: ${prompt.substring(0, 100)}...`);
    
    // Validate OpenAI API key
    if (!openAIApiKey) {
      console.error('Brak klucza API OpenAI');
      return new Response(
        JSON.stringify({ error: 'Brak skonfigurowanego klucza OpenAI API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log that we're about to call OpenAI
    console.log(`Wysyłam zapytanie do OpenAI dla UI Cleaner`);
    
    // Call OpenAI to clean and format the email content
    // Use the provided prompt directly as the system prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: emailContent }
        ],
        temperature: 0.3, // Lower temperature for more consistent formatting
        max_tokens: 2000,
      }),
    });

    // Check if OpenAI response is successful
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Błąd API OpenAI:', errorData);
      
      // Return the original content if there's an error
      return new Response(
        JSON.stringify({ 
          cleanedContent: emailContent,
          error: 'Błąd podczas formatowania treści', 
          details: errorData 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse OpenAI response
    const data = await response.json();
    console.log("Otrzymano odpowiedź z OpenAI dla UI Cleaner");
    
    // Extract cleaned content from OpenAI response
    const cleanedContent = data.choices[0].message.content;
    console.log(`Długość sformatowanej treści: ${cleanedContent.length} znaków`);
    console.log(`Fragment sformatowanej treści (pierwsze 100 znaków): ${cleanedContent.substring(0, 100)}...`);
    
    // Prepare response object
    const responseObject = {
      cleanedContent: cleanedContent,
      timestamp: new Date().toISOString(),
      requestId: `ui-cleaner-${Date.now()}`
    };
    
    console.log(`Wysyłam odpowiedź UI Cleaner`);
    
    // Send response
    return new Response(
      JSON.stringify(responseObject),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Nieobsłużony błąd w funkcji ui-cleaner:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Nieoczekiwany błąd',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
