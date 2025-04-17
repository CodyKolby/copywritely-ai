
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma, expires, x-no-cache',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = new Date().toISOString();
  
  console.log(`=== NARRATIVE BLUEPRINT START [${requestId}] ===`);
  console.log(`🔍 [${requestId}] Timestamp: ${startTime}`);
  console.log(`🔍 [${requestId}] Method: ${req.method}`);
  console.log(`🔍 [${requestId}] URL: ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[${startTime}][${requestId}] NARRATIVE-BLUEPRINT: Handling OPTIONS preflight request`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if this is a test request from URL param
    const url = new URL(req.url);
    const isTestRequest = url.searchParams.get('test') === 'true';
    
    // Get raw request body for logging first
    const rawBody = await req.text();
    console.log(`[${requestId}] NARRATIVE-BLUEPRINT: Raw request body length: ${rawBody.length} chars`);
    
    // Check for test request in the body
    const isTestViaBody = rawBody.includes('"test":"connection"') || rawBody.length < 20;
    
    if (isTestRequest || isTestViaBody) {
      console.log(`[${requestId}] NARRATIVE-BLUEPRINT: Handling test request`);
      return new Response(
        JSON.stringify({
          punktyemocjonalne: "Test punkty emocjonalne",
          specyfikamaila: "Test specyfika maila",
          osnarracyjna: "Test os narracyjna",
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
      console.log(`[${requestId}] NARRATIVE-BLUEPRINT: JSON parsing successful`);
    } catch (parseError) {
      console.error(`[${requestId}] NARRATIVE-BLUEPRINT: Failed to parse JSON:`, parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body', details: parseError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { surveyData, emailStyle, advertisingGoal, timestamp: clientTimestamp, requestId: clientRequestId } = requestData;
    
    console.log(`[${requestId}] NARRATIVE-BLUEPRINT: Client request ID: ${clientRequestId || 'Not provided'}`);
    console.log(`[${requestId}] NARRATIVE-BLUEPRINT: Client timestamp: ${clientTimestamp || 'Not provided'}`);
    
    if (!surveyData) {
      console.error(`[${requestId}] NARRATIVE-BLUEPRINT: Missing survey data`);
      return new Response(
        JSON.stringify({ error: 'Survey data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] NARRATIVE-BLUEPRINT: Processing narrative blueprint for email style: ${emailStyle}`);
    console.log(`[${requestId}] NARRATIVE-BLUEPRINT: Advertising goal: ${advertisingGoal || 'Not specified'}`);
    
    // Format the survey data as a string
    let surveyDataString = "";
    if (typeof surveyData === 'object') {
      // Convert object to string representation
      Object.entries(surveyData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          surveyDataString += `${key}: ${value.join(", ")}\n`;
        } else if (value) {
          surveyDataString += `${key}: ${value}\n`;
        }
      });
    } else {
      surveyDataString = String(surveyData);
    }

    console.log(`[${requestId}] NARRATIVE-BLUEPRINT: Survey data prepared, length: ${surveyDataString.length} chars`);
    console.log(`[${requestId}] NARRATIVE-BLUEPRINT: Survey data preview: ${surveyDataString.substring(0, 500)}...`);
    
    // System prompt for the blueprint generator
    const systemPrompt = `Jesteś profesjonalnym strategiem marketingowym, który specjalizuje się w tworzeniu fundamentów narracyjnych dla pojedynczych maili marketingowych. Twoim zadaniem jest wygenerowanie kluczowych punktów emocjonalnych i kreatywnych inspiracji, na podstawie których inne AI stworzą resztę maila. Nie tworzysz treści — tworzysz strukturę emocjonalną i logiczną.`;

    console.log(`[${requestId}] NARRATIVE-BLUEPRINT: System prompt: ${systemPrompt.substring(0, 100)}...`);
    
    // User prompt for the blueprint generator
    const userPrompt = `Masz dostęp do danych o grupie docelowej, ich problemach i pragnieniach, stylu maila oraz celu kampanii.

Dane wejściowe, które otrzymujesz:
${surveyDataString}
Styl maila: ${emailStyle || 'Nie określono'}
Cel kampanii: ${advertisingGoal || 'Nie określono'}

Na podstawie tych informacji wygeneruj trzy zestawy danych:

1. Punkty emocjonalne — zaproponuj 2–3 kluczowe emocjonalne punkty zaczepienia, które mają poruszyć odbiorcę. Dobierz je do stylu maila:
- Bezpośrednia sprzedaż — nacisk na presję, brak działania, pilność, obietnicę zmiany (np. „Ile jeszcze dni z rzędu będziesz budzić się zmęczona?").
- Edukacyjny — podkreśl błędne przekonania, ukryte przyczyny, nowe spojrzenia (np. „Twoje zmęczenie to nie brak silnej woli — to nierównowaga hormonalna").
- Opowieść — zacznij od typowego momentu z życia klientki, wywołaj utożsamienie, emocję i przełom (np. „Znowu płakałam w przebieralni… aż coś we mnie pękło").
- Budowanie relacji — podkreśl wspólnotę, zrozumienie, brak presji, otwartość na rozmowę (np. „Nie musisz być idealna — jesteśmy tu, żeby Cię wspierać").

Każdy punkt emocjonalny opisz jednym zdaniem głównym + jednym zdaniem uzasadniającym jego wartość.

2. Pomysły na styl maila — zaproponuj 3 interesujące, intrygujące i możliwie clickbaitowe pomysły na styl maila. Mogą być to potencjalne tytuły lub osie treści. Inspiruj się formatami typu:
- "Dlaczego Twój plan treningowy jest skazany na porażkę" (podważa obecne podejście klienta)
- "List od trenera: Co bym zrobiła, gdybym zaczynała od zera" (osobista perspektywa eksperta)
- "3 rzeczy, które robisz źle, choć starasz się jak możesz" (liczbowe i kontrastowe podejście)

Unikaj powtarzalnych konstrukcji, miksuj perspektywy, styl i format.

3. Oś narracyjna — wygeneruj jedno silne zdanie, które może być myślą przewodnią całego maila. To nie jest tytuł, to wewnętrzna mantra kampanii, np. „Nie jesteś sama", „Zacznij od siebie", „Nie musisz być idealna, by czuć się dobrze".

Zachowuj maksymalną zwięzłość. Nie powtarzaj informacji z danych wejściowych. Nie tworzysz copy — tworzysz emocjonalny blueprint, który zasili Subject Line Generator AI oraz Main Copywriter AI.

Wynik powinien mieć format:
punktyemocjonalne: [tutaj punkty emocjonalne]
specyfikamaila: [tutaj pomysły na styl maila]
osnarracyjna: [tutaj oś narracyjną]

WAŻNE: Zwróć pełną zawartość każdej sekcji, nie ucinaj żadnych zdań. Każda sekcja może zawierać do 500 znaków.`;

    console.log(`[${requestId}] NARRATIVE-BLUEPRINT: User prompt length: ${userPrompt.length} chars`);
    console.log(`[${requestId}] NARRATIVE-BLUEPRINT: User prompt preview: ${userPrompt.substring(0, 300)}...`);
    
    // Check if we have an OpenAI API key
    if (!OPENAI_API_KEY) {
      console.error(`[${requestId}] NARRATIVE-BLUEPRINT: OpenAI API key is missing`);
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[${requestId}] NARRATIVE-BLUEPRINT: Calling OpenAI API...`);

    // Retry mechanism for OpenAI API calls
    let attempts = 0;
    const maxAttempts = 3;
    let apiResponse;
    let lastError;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[${requestId}] NARRATIVE-BLUEPRINT: API call attempt ${attempts}/${maxAttempts}`);
      
      try {
        // Call OpenAI API with the Narrative Blueprint prompt
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
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 4000,  // Significantly increased token limit to avoid truncation
          }),
        });
        
        // If the request was successful, break out of the retry loop
        if (apiResponse.ok) {
          console.log(`[${requestId}] NARRATIVE-BLUEPRINT: OpenAI API responded with status ${apiResponse.status}`);
          break;
        } else {
          const errorData = await apiResponse.json().catch(() => ({}));
          lastError = `OpenAI API returned status ${apiResponse.status}: ${JSON.stringify(errorData)}`;
          console.error(`[${requestId}] NARRATIVE-BLUEPRINT: ${lastError}`);
          
          if (apiResponse.status === 429 || apiResponse.status >= 500) {
            // For rate limiting (429) or server errors (5xx), we'll retry
            console.log(`[${requestId}] NARRATIVE-BLUEPRINT: Retrying in ${attempts * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, attempts * 1000));
            continue;
          } else {
            // For other errors like 400, 401, etc., don't retry
            throw new Error(lastError);
          }
        }
      } catch (error) {
        console.error(`[${requestId}] NARRATIVE-BLUEPRINT: Fetch error on attempt ${attempts}:`, error);
        lastError = error;
        
        // For network errors, we'll retry
        if (attempts < maxAttempts) {
          console.log(`[${requestId}] NARRATIVE-BLUEPRINT: Retrying in ${attempts * 1000}ms...`);
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
    const aiOutput = responseData.choices[0].message.content;
    
    console.log(`[${requestId}] NARRATIVE-BLUEPRINT: Raw AI response length: ${aiOutput.length} chars`);
    console.log(`[${requestId}] NARRATIVE-BLUEPRINT: Raw AI response: ${aiOutput}`);
    
    // Parse the AI output to extract the three sections
    const parseOutput = (output: string): {
      punktyemocjonalne: string,
      specyfikamaila: string,
      osnarracyjna: string
    } => {
      const result = {
        punktyemocjonalne: "",
        specyfikamaila: "",
        osnarracyjna: ""
      };

      // Extract the three sections using regex
      const punktyMatch = output.match(/punktyemocjonalne:\s*([\s\S]*?)(?=specyfikamaila:|$)/i);
      const stylMatch = output.match(/specyfikamaila:\s*([\s\S]*?)(?=ośnarracyjna:|osnarracyjna:|$)/i);
      const osMatch = output.match(/(ośnarracyjna|osnarracyjna):\s*([\s\S]*?)$/i);

      if (punktyMatch && punktyMatch[1]) result.punktyemocjonalne = punktyMatch[1].trim();
      if (stylMatch && stylMatch[1]) result.specyfikamaila = stylMatch[1].trim();
      if (osMatch && osMatch[2]) result.osnarracyjna = osMatch[2].trim();

      return result;
    };

    const parsedOutput = parseOutput(aiOutput);
    
    console.log(`[${requestId}] NARRATIVE-BLUEPRINT: Parsed output - punktyemocjonalne length: ${parsedOutput.punktyemocjonalne.length} chars`);
    console.log(`[${requestId}] NARRATIVE-BLUEPRINT: Parsed output - specyfikamaila length: ${parsedOutput.specyfikamaila.length} chars`);
    console.log(`[${requestId}] NARRATIVE-BLUEPRINT: Parsed output - osnarracyjna length: ${parsedOutput.osnarracyjna.length} chars`);
    
    console.log(`[${requestId}] NARRATIVE-BLUEPRINT: Punkty emocjonalne: ${parsedOutput.punktyemocjonalne}`);
    console.log(`[${requestId}] NARRATIVE-BLUEPRINT: Specyfika maila: ${parsedOutput.specyfikamaila}`);
    console.log(`[${requestId}] NARRATIVE-BLUEPRINT: Oś narracyjna: ${parsedOutput.osnarracyjna}`);
    
    console.log(`[${requestId}] NARRATIVE-BLUEPRINT: Narrative blueprint generated successfully`);
    
    return new Response(
      JSON.stringify({
        ...parsedOutput,
        timestamp: startTime,
        requestId: requestId,
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
    console.error(`[${requestId}] NARRATIVE-BLUEPRINT: Error in narrative-blueprint function:`, error.message);
    console.error(error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        timestamp: startTime,
        requestId: requestId
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } finally {
    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
    console.log(`=== NARRATIVE BLUEPRINT END [${requestId}] (Duration: ${duration}ms) ===`);
  }
});
