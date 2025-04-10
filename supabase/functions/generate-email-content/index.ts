
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
  console.log("Otrzymano zapytanie do generate-email-content:", req.method, req.url);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log("Obsługa zapytania preflight OPTIONS");
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    console.log("Przetwarzanie zapytania POST dla generacji treści email");
    
    // Parse request data
    const requestData = await req.json();
    const { prompt, structureType, debugMode } = requestData;
    
    // Log received data
    console.log(`Typ struktury maila: ${structureType}`);
    console.log(`Długość promptu: ${prompt.length} znaków`);
    console.log(`Tryb debugowania: ${debugMode ? 'włączony' : 'wyłączony'}`);
    
    // For debug mode, return mock response without calling OpenAI
    if (debugMode) {
      console.log("Tryb debugowania - zwracam przykładową odpowiedź bez wywoływania OpenAI");
      
      const debugResponse = {
        emailContent: `DEBUG MODE: To jest przykładowa treść maila w strukturze ${structureType}.\n\n` +
                      `Struktura ${structureType === 'PAS' ? 'Problem-Agitacja-Rozwiązanie' : 'Customer Journey Narrative'}.\n\n` +
                      `Ta odpowiedź została wygenerowana w trybie debugowania bez wywoływania OpenAI.`,
        structureUsed: structureType,
        timestamp: new Date().toISOString(),
        requestId: `debug-${Date.now()}`,
        debugInfo: { promptLength: prompt.length }
      };
      
      return new Response(
        JSON.stringify(debugResponse),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate OpenAI API key
    if (!openAIApiKey) {
      console.error('Brak klucza API OpenAI');
      return new Response(
        JSON.stringify({ error: 'Brak skonfigurowanego klucza OpenAI API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log that we're about to call OpenAI
    console.log(`Wysyłam zapytanie do OpenAI dla struktury: ${structureType}`);
    console.log(`Fragment promptu (pierwsze 100 znaków): ${prompt.substring(0, 100)}...`);
    
    // Set the system prompt based on structure type
    let systemPrompt = "Jesteś ekspertem od tworzenia treści emaili marketingowych w języku polskim.";
    
    // Call OpenAI to generate email content
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    // Check if OpenAI response is successful
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Błąd API OpenAI:', errorData);
      return new Response(
        JSON.stringify({ 
          error: 'Błąd podczas generowania treści email', 
          details: errorData 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse OpenAI response
    const data = await response.json();
    console.log("Otrzymano odpowiedź z OpenAI");
    
    // Extract email content from OpenAI response
    const emailContent = data.choices[0].message.content;
    console.log(`Długość wygenerowanej treści: ${emailContent.length} znaków`);
    console.log(`Fragment wygenerowanej treści (pierwsze 100 znaków): ${emailContent.substring(0, 100)}...`);
    
    // Prepare response object
    const responseObject = {
      emailContent: emailContent,
      structureUsed: structureType,
      timestamp: new Date().toISOString(),
      requestId: `email-content-${Date.now()}`,
      rawOutput: data,
      rawPrompt: prompt.substring(0, 500) + (prompt.length > 500 ? '...' : '')
    };
    
    console.log(`Wysyłam odpowiedź dla struktury ${structureType}`);
    
    // Send response
    return new Response(
      JSON.stringify(responseObject),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Nieobsłużony błąd w funkcji generate-email-content:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Nieoczekiwany błąd',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
