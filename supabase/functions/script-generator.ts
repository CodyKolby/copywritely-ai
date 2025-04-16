
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Properly configured CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma, expires, x-no-cache',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// System prompt for ScriptGeneratorAI
const SYSTEM_PROMPT = `Jesteś ekspertem od tworzenia skryptów reklamowych.

Twoim zadaniem jest napisanie treści głównej reklamy, która będzie pasować do podanego hooka i angle. 
Nie dodawaj własnego początku ani zakończenia - skupiaj się tylko na głównej treści.

Dostosuj styl i ton do podanego szablonu reklamowego (np. TikTok, VSL, post na FB).`;

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = new Date().toISOString();
  
  console.log(`=== SCRIPT GENERATOR START (${requestId}) ===`);
  console.log('Timestamp:', startTime);
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Handle CORS preflight requests - ensure proper status and headers
  if (req.method === 'OPTIONS') {
    console.log(`[${startTime}][REQ:${requestId}] Handling OPTIONS preflight request`);
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    console.log(`[${startTime}][REQ:${requestId}] Processing POST request`);
    
    // Parse request body as text first for logging
    const requestText = await req.text();
    console.log(`[${startTime}][REQ:${requestId}] Raw request body length: ${requestText.length} chars`);
    console.log(`[${startTime}][REQ:${requestId}] Raw request preview: ${requestText.substring(0, 200)}...`);
    
    // Parse the text as JSON
    let parsedData;
    try {
      parsedData = JSON.parse(requestText);
      console.log(`[${startTime}][REQ:${requestId}] JSON parsed successfully`);
    } catch (parseError) {
      console.error(`[${startTime}][REQ:${requestId}] JSON parse error:`, parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { targetAudience, templateType, selectedHook, selectedAngle } = parsedData;
    
    console.log('=== REQUEST DATA ===');
    console.log('Template Type:', templateType);
    console.log('Selected Hook:', selectedHook);
    console.log('Selected Angle:', selectedAngle);
    console.log('Target Audience:', JSON.stringify(targetAudience, null, 2));

    // Validate required parameters
    if (!selectedHook || !selectedAngle || !templateType) {
      console.error(`[${startTime}][REQ:${requestId}] Missing required parameters`);
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters', 
          details: 'selectedHook, selectedAngle, and templateType are required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Format audience description
    const audienceDescription = formatAudienceDescription(targetAudience);
    
    console.log('=== SYSTEM PROMPT ===');
    console.log(SYSTEM_PROMPT);
    
    const prompt = `
# Informacje o grupie docelowej
${audienceDescription}

# Wybrany hook
${selectedHook}

# Wybrany angle
${selectedAngle}

# Typ szablonu reklamowego
${templateType}

Na podstawie powyższych informacji, napisz treść główną reklamy, która będzie pasować do podanego hooka i angle.
`;

    console.log('=== USER PROMPT ===');
    console.log(prompt);

    // Call OpenAI API with retry logic
    let attempts = 0;
    const maxAttempts = 3;
    let openaiResponse;
    let lastError;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[${startTime}][REQ:${requestId}] OpenAI API call attempt ${attempts}/${maxAttempts}`);
      
      try {
        console.log(`[${startTime}][REQ:${requestId}] Sending request to OpenAI...`);
        openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 2000,  // Zwiększona wartość z defaultowej
          }),
        });
        
        if (openaiResponse.ok) {
          console.log(`[${startTime}][REQ:${requestId}] OpenAI API responded OK (status ${openaiResponse.status})`);
          break;
        } else {
          const errorData = await openaiResponse.json();
          lastError = `OpenAI API error (status ${openaiResponse.status}): ${JSON.stringify(errorData)}`;
          console.error(`[${startTime}][REQ:${requestId}] ${lastError}`);
          
          // For rate limiting (429) or server errors (5xx), we'll retry
          if (openaiResponse.status === 429 || openaiResponse.status >= 500) {
            console.log(`[${startTime}][REQ:${requestId}] Retrying in ${attempts * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, attempts * 1000));
            continue;
          } else {
            // For other errors like 400 (bad request), don't retry
            throw new Error(lastError);
          }
        }
      } catch (error) {
        console.error(`[${startTime}][REQ:${requestId}] Fetch error on attempt ${attempts}:`, error);
        lastError = error.message || String(error);
        
        if (attempts < maxAttempts) {
          console.log(`[${startTime}][REQ:${requestId}] Retrying in ${attempts * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
        }
      }
    }

    // If we've exhausted all attempts without a successful response
    if (!openaiResponse || !openaiResponse.ok) {
      throw new Error(lastError || `Failed to get response from OpenAI after ${maxAttempts} attempts`);
    }

    // Parse response
    const data = await openaiResponse.json();
    const scriptContent = data.choices[0].message.content;
    
    console.log(`[${startTime}][REQ:${requestId}] Generated content length: ${scriptContent.length} chars`);
    console.log(`[${startTime}][REQ:${requestId}] Content preview: ${scriptContent.substring(0, 300)}...`);
    console.log(`[${startTime}][REQ:${requestId}] Script generation successful`);
    
    // Return the generated script content
    return new Response(
      JSON.stringify({ 
        scriptContent,
        requestId,
        timestamp: startTime,
        modelUsed: data.model || 'gpt-4o-mini',
        tokensUsed: data.usage?.total_tokens || 'unknown'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error(`[${startTime}][REQ:${requestId}] Error in script-generator:`, error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unexpected error occurred",
        requestId,
        timestamp: startTime
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Function to format audience description for the prompt
function formatAudienceDescription(audience) {
  if (!audience) return "Brak danych o grupie docelowej.";
  
  let description = "";
  
  // Basic demographic data
  if (audience.age_range) description += `Wiek: ${audience.age_range}\n`;
  if (audience.gender) description += `Płeć: ${audience.gender}\n\n`;
  
  // Main offer
  if (audience.main_offer) description += `## Główna oferta\n${audience.main_offer}\n\n`;
  
  // Offer details
  if (audience.offer_details) description += `## Szczegóły oferty\n${audience.offer_details}\n\n`;
  
  // Client problems
  if (audience.pains && audience.pains.length > 0) {
    description += "## Problemy klientów\n";
    audience.pains.forEach((pain, index) => {
      if (pain) description += `${index + 1}. ${pain}\n`;
    });
    description += "\n";
  }
  
  // Desires
  if (audience.desires && audience.desires.length > 0) {
    description += "## Pragnienia klientów\n";
    audience.desires.forEach((desire, index) => {
      if (desire) description += `${index + 1}. ${desire}\n`;
    });
    description += "\n";
  }
  
  // Benefits
  if (audience.benefits && audience.benefits.length > 0) {
    description += "## Korzyści produktu/usługi\n";
    audience.benefits.forEach((benefit, index) => {
      if (benefit) description += `${index + 1}. ${benefit}\n`;
    });
    description += "\n";
  }
  
  // Client language
  if (audience.language) description += `## Język klienta\n${audience.language}\n\n`;
  
  // Beliefs
  if (audience.beliefs) description += `## Przekonania do zbudowania\n${audience.beliefs}\n\n`;
  
  // Biography
  if (audience.biography) description += `## Biografia klienta\n${audience.biography}\n\n`;
  
  // Competition
  if (audience.competitors && audience.competitors.length > 0) {
    description += "## Konkurencja\n";
    audience.competitors.forEach((competitor, index) => {
      if (competitor) description += `${index + 1}. ${competitor}\n`;
    });
    description += "\n";
  }
  
  // Why it works
  if (audience.why_it_works) description += `## Dlaczego produkt/usługa działa\n${audience.why_it_works}\n\n`;
  
  // Experience
  if (audience.experience) description += `## Doświadczenie sprzedawcy\n${audience.experience}\n\n`;
  
  return description;
}
