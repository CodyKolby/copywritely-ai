import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma, expires, x-no-cache',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
};

// System prompts for different agent types
const PAS_AGENT_PROMPT = `Jesteś profesjonalnym polskim copywriterem, który specjalizuje się w tworzeniu treści marketingowych w strukturze Problem-Agitacja-Rozwiązanie (PAS). Twój styl jest przystępny, konkretny i perswazyjny. Używasz krótkich zdań, czytelnych akapitów i naturalnego języka.

Na podstawie dostarczonych danych o grupie docelowej i blueprintu narracyjnego, stwórz email w strukturze:

1. PROBLEM - zidentyfikuj główny problem/ból odbiorcy, który rezonuje emocjonalnie
2. AGITACJA - pogłęb ten problem, pokaż jego konsekwencje, niech odbiorca poczuje emocjonalny dyskomfort
3. ROZWIĄZANIE - przedstaw swoją ofertę jako idealne wyjście z sytuacji, zakończ wezwaniem do działania

Wykorzystaj poniższe zmienne w swojej pracy:
- Specyfika maila: {{specyfikamaila}}
- Punkty emocjonalne: {{punktyemocjonalne}}
- Oś narracyjna: {{osnarracyjna}}
- Dane z ankiety klienta: {{surveyData}}
- Styl maila z wyboru klienta: {{emailStyle}}
- Cel reklamy: {{advertisingGoal}}

Nie używaj zbyt wielu emotikonów, wykrzykników czy wielkich liter. Twoja siła leży w precyzyjnym dobraniu słów, które poruszają odbiorcę.`;

const CJN_AGENT_PROMPT = `Jesteś profesjonalnym polskim copywriterem, który specjalizuje się w tworzeniu treści marketingowych w strukturze Cecha-Zaleta-Nagroda (CJN). Twój styl jest przyjazny, angażujący i zorientowany na korzyści. Komunikujesz się w sposób przejrzysty i przekonujący.

Na podstawie dostarczonych danych o grupie docelowej i blueprintu narracyjnego, stwórz email w strukturze:

1. CECHA - przedstaw główne cechy produktu/usługi/oferty
2. ZALETA - wyjaśnij, jakie zalety wynikają z tych cech
3. NAGRODA - pokaż, jakie konkretne korzyści i nagrody czekają na odbiorcę

Wykorzystaj poniższe zmienne w swojej pracy:
- Specyfika maila: {{specyfikamaila}}
- Punkty emocjonalne: {{punktyemocjonalne}}
- Oś narracyjna: {{osnarracyjna}}
- Dane z ankiety klienta: {{surveyData}}
- Styl maila z wyboru klienta: {{emailStyle}}
- Cel reklamy: {{advertisingGoal}}

Buduj narrację opartą na wartości i korzyściach. Unikaj agresywnego tonu, skup się na pozytywnych emocjach i spełnieniu potrzeb odbiorcy.`;

// UI Cleaner prompt
const UI_CLEANER_PROMPT = `Jesteś zaawansowanym copywriterem odpowiedzialnym za edytowanie gotowych maili marketingowych w języku polskim. Twoim zadaniem nie jest zmiana treści, ale poprawa jej formy i czytelności.

Zasady edycji, które muszą zostać ściśle przestrzegane:

1. Rozbijaj długie akapity, tak aby każdy akapit zawierał tylko jedno zdanie.

2. Zachowuj pustą linijkę między akapitami, aby ułatwić czytanie.

3. Usuń wszystkie myślniki oraz wszelkie formy mianowników lub list. Zamiast nich twórz pełne zdania.

4. Skup się tylko na formie tekstu, nie zmieniaj jego sensu ani tonacji.

5. Nie dodawaj nowych treści ani nie skracaj istniejących.

6. Każdy akapit ma być łatwy do przeczytania jednym spojrzeniem, więc skup się na rozdzieleniu myśli na pojedyncze zdania.

Te zasady muszą być spełnione w 100%, nie są opcjonalne.`;

serve(async (req) => {
  // Generate a unique request ID for tracking
  const requestId = crypto.randomUUID();
  const startTime = new Date().toISOString();
  
  console.log(`=== EMAIL CONTENT GENERATION START [${requestId}] ===`);
  console.log(`🔍 [${requestId}] Timestamp: ${startTime}`);
  console.log(`🔍 [${requestId}] Method: ${req.method}`);
  console.log(`🔍 [${requestId}] URL: ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Handling OPTIONS preflight request`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if this is a test request from URL param
    const url = new URL(req.url);
    const isTestRequest = url.searchParams.get('test') === 'true';
    
    // Get raw request body for logging first
    const rawBody = await req.text();
    console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Raw request body length: ${rawBody.length} chars`);
    
    // Check for test request in the body
    const isTestViaBody = rawBody.includes('"test":"connection"') || rawBody.length < 20;
    
    if (isTestRequest || isTestViaBody) {
      console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Handling test request`);
      return new Response(
        JSON.stringify({
          emailContent: "To jest testowy email wygenerowany przez system.",
          structureUsed: "TEST",
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
      console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: JSON parsing successful`);
    } catch (parseError) {
      console.error(`[${requestId}] GENERATE-EMAIL-CONTENT: Failed to parse JSON:`, parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body', details: parseError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { 
      prompt, 
      structureType, 
      timestamp: clientTimestamp, 
      requestId: clientRequestId 
    } = requestData;
    
    console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Client request ID: ${clientRequestId || 'Not provided'}`);
    console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Client timestamp: ${clientTimestamp || 'Not provided'}`);
    console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Structure type: ${structureType || 'Not specified'}`);
    
    if (!prompt) {
      console.error(`[${requestId}] GENERATE-EMAIL-CONTENT: Missing prompt`);
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Select agent type - only choose between PAS and CJN agents (50/50 chance)
    let systemPrompt;
    let agentType;
    
    if (structureType) {
      if (structureType === 'PAS') {
        systemPrompt = PAS_AGENT_PROMPT;
        agentType = 'PAS';
      } else if (structureType === 'CJN') {
        systemPrompt = CJN_AGENT_PROMPT;
        agentType = 'CJN';
      } else {
        // Default to random selection if structure type is not recognized or not PAS/CJN
        agentType = Math.random() < 0.5 ? 'PAS' : 'CJN';
        systemPrompt = agentType === 'PAS' ? PAS_AGENT_PROMPT : CJN_AGENT_PROMPT;
      }
    } else {
      // Random selection if structure type is not provided (50/50)
      agentType = Math.random() < 0.5 ? 'PAS' : 'CJN';
      systemPrompt = agentType === 'PAS' ? PAS_AGENT_PROMPT : CJN_AGENT_PROMPT;
    }
    
    console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Using ${agentType} agent`);
    console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: System prompt: ${systemPrompt.substring(0, 100)}...`);

    // Check if we have an OpenAI API key
    if (!OPENAI_API_KEY) {
      console.error(`[${requestId}] GENERATE-EMAIL-CONTENT: OpenAI API key is missing`);
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Step 1: Generate email content with the selected agent
    console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Calling OpenAI API for email content generation...`);

    // Retry mechanism for OpenAI API calls
    let attempts = 0;
    const maxAttempts = 3;
    let apiResponse;
    let lastError;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: API call attempt ${attempts}/${maxAttempts}`);
      
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
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 3000,
          }),
        });
        
        // If the request was successful, break out of the retry loop
        if (apiResponse.ok) {
          console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: OpenAI API responded with status ${apiResponse.status}`);
          break;
        } else {
          const errorData = await apiResponse.json().catch(() => ({}));
          lastError = `OpenAI API returned status ${apiResponse.status}: ${JSON.stringify(errorData)}`;
          console.error(`[${requestId}] GENERATE-EMAIL-CONTENT: ${lastError}`);
          
          if (apiResponse.status === 429 || apiResponse.status >= 500) {
            // For rate limiting (429) or server errors (5xx), we'll retry
            console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Retrying in ${attempts * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, attempts * 1000));
            continue;
          } else {
            // For other errors like 400, 401, etc., don't retry
            throw new Error(lastError);
          }
        }
      } catch (error) {
        console.error(`[${requestId}] GENERATE-EMAIL-CONTENT: Fetch error on attempt ${attempts}:`, error);
        lastError = error;
        
        // For network errors, we'll retry
        if (attempts < maxAttempts) {
          console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Retrying in ${attempts * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
          continue;
        }
      }
    }
    
    // If we've exhausted all attempts without a successful response
    if (!apiResponse || !apiResponse.ok) {
      throw new Error(lastError || `Failed to get response from OpenAI after ${maxAttempts} attempts`);
    }

    const contentResponse = await apiResponse.json();
    const rawEmailContent = contentResponse.choices[0].message.content;
    
    console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Raw email content generated (length: ${rawEmailContent.length} chars)`);
    
    // Step 2: Pass the raw email content through the UI Cleaner
    console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Calling OpenAI API for UI cleaning...`);
    
    attempts = 0;
    let cleanerResponse;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: UI Cleaner API call attempt ${attempts}/${maxAttempts}`);
      
      try {
        cleanerResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Request-ID': `${requestId}-cleaner`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: UI_CLEANER_PROMPT },
              { role: 'user', content: rawEmailContent }
            ],
            temperature: 0.5,
            max_tokens: 3000,
          }),
        });
        
        if (cleanerResponse.ok) {
          console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: UI Cleaner API responded with status ${cleanerResponse.status}`);
          break;
        } else {
          const errorData = await cleanerResponse.json().catch(() => ({}));
          lastError = `UI Cleaner API returned status ${cleanerResponse.status}: ${JSON.stringify(errorData)}`;
          console.error(`[${requestId}] GENERATE-EMAIL-CONTENT: ${lastError}`);
          
          if (cleanerResponse.status === 429 || cleanerResponse.status >= 500) {
            console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: UI Cleaner retrying in ${attempts * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, attempts * 1000));
            continue;
          } else {
            throw new Error(lastError);
          }
        }
      } catch (error) {
        console.error(`[${requestId}] GENERATE-EMAIL-CONTENT: UI Cleaner fetch error on attempt ${attempts}:`, error);
        lastError = error;
        
        if (attempts < maxAttempts) {
          console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: UI Cleaner retrying in ${attempts * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
          continue;
        }
      }
    }
    
    // If UI Cleaner failed, use the raw email content
    let cleanedEmailContent = rawEmailContent;
    
    if (cleanerResponse && cleanerResponse.ok) {
      const cleanerResponseData = await cleanerResponse.json();
      cleanedEmailContent = cleanerResponseData.choices[0].message.content;
      console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Email cleaned by UI Cleaner (length: ${cleanedEmailContent.length} chars)`);
    } else {
      console.warn(`[${requestId}] GENERATE-EMAIL-CONTENT: UI Cleaner failed, using raw email content`);
    }
    
    // Return the final response with both raw and cleaned content
    console.log(`[${requestId}] GENERATE-EMAIL-CONTENT: Email content generation completed successfully`);
    
    return new Response(
      JSON.stringify({
        emailContent: cleanedEmailContent,
        rawEmailContent: rawEmailContent,
        structureUsed: agentType,
        timestamp: startTime,
        requestId,
        clientRequestId: clientRequestId || null
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
    console.error(`[${requestId}] GENERATE-EMAIL-CONTENT: Error in email content generation:`, error.message);
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
    console.log(`=== EMAIL CONTENT GENERATION END [${requestId}] (Duration: ${duration}ms) ===`);
  }
});
