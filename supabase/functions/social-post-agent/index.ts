
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createErrorResponse } from "../shared/openai.ts";
import { corsHeaders, handleOptions } from "../shared/cors.ts";

// OpenAI API key from environment
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// 🔥 DEBUG START
console.log("🔥🔥🔥 SOCIAL POST AGENT ACTIVE 🔥🔥🔥");

serve(async (req) => {
  // Generate a unique request ID and timestamp
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const functionVersion = "v1.0.2";
  const deploymentId = Deno.env.get('DEPLOYMENT_ID') || 'development';

  console.log(`[${timestamp}][REQ:${requestId}] Received request to social-post-agent`);
  
  // Handle CORS preflight requests
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  try {
    if (!openAIApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    // Parse the request body
    const data = await req.json();
    const { targetAudience, advertisingGoal, intro, platform } = data;

    if (!targetAudience || !intro) {
      throw new Error("Target audience and intro are required");
    }

    // Create metadata for logging and debugging
    const metadata = {
      requestId,
      timestamp,
      cacheBuster,
      deploymentId,
      functionVersion,
      model: "gpt-4o"
    };

    // Format the full prompt with audience data, intro, and goal
    const fullPrompt = formatFullPrompt(targetAudience, advertisingGoal, intro, platform);

    console.log(`[${timestamp}][REQ:${requestId}] Calling OpenAI with full prompt`);
    
    // Call OpenAI with a single prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Request-ID': requestId,
        'X-Timestamp': timestamp,
        'X-Cache-Buster': cacheBuster,
        'X-Deployment-ID': deploymentId,
        'X-Function-Version': functionVersion
      },
      body: JSON.stringify({
        model: metadata.model,
        messages: [
          { role: 'user', content: fullPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[${timestamp}][REQ:${requestId}] OpenAI API error:`, {
        status: response.status,
        error: errorData
      });
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    try {
      const data = await response.json();
      console.log(`[${timestamp}][REQ:${requestId}] OpenAI response received, model used: ${data.model}`);
      console.log(`[${timestamp}][REQ:${requestId}] Response length: ${data.choices[0].message.content.length} chars`);
      console.log(`[${timestamp}][REQ:${requestId}] RESPONSE FULL:\n${data.choices[0].message.content}`);
      
      // Extract the generated content
      const generatedPostContent = data.choices[0].message.content;
      
      // Combine intro with the generated content
      const fullPost = `${intro}\n\n${generatedPostContent}`;
      
      console.log(`[${timestamp}][REQ:${requestId}] Successfully generated post for ${platform}`);

      // Return the response
      return new Response(
        JSON.stringify({
          post: fullPost,
          intro: intro,
          content: generatedPostContent,
          model: data.model,
          timestamp,
          requestId,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (error) {
      console.error(`[${timestamp}][REQ:${requestId}] Error parsing OpenAI response:`, error);
      throw new Error(`Error parsing OpenAI response: ${error.message}`);
    }
  } catch (error) {
    console.error(`[${timestamp}][REQ:${requestId}] Error:`, error.message);
    return createErrorResponse(error, { 
      timestamp, 
      requestId, 
      deploymentId, 
      functionVersion 
    });
  }
});

// Helper function to format the full prompt for OpenAI
function formatFullPrompt(targetAudience: any, advertisingGoal: string, intro: string, platform: string) {
  let audienceDescription = '';
  
  // Build audience description
  if (targetAudience) {
    if (targetAudience.age_range) audienceDescription += `Wiek: ${targetAudience.age_range}\n`;
    if (targetAudience.gender) audienceDescription += `Płeć: ${targetAudience.gender}\n\n`;
    
    if (targetAudience.pains && targetAudience.pains.length) {
      audienceDescription += "Problemy klientów:\n";
      targetAudience.pains.forEach((pain: string, index: number) => {
        if (pain) audienceDescription += `${index + 1}. ${pain}\n`;
      });
      audienceDescription += "\n";
    }
    
    if (targetAudience.desires && targetAudience.desires.length) {
      audienceDescription += "Pragnienia klientów:\n";
      targetAudience.desires.forEach((desire: string, index: number) => {
        if (desire) audienceDescription += `${index + 1}. ${desire}\n`;
      });
      audienceDescription += "\n";
    }

    if (targetAudience.biography) audienceDescription += `Biografia klienta: ${targetAudience.biography}\n\n`;
    if (targetAudience.language) audienceDescription += `Język klienta: ${targetAudience.language}\n\n`;
    if (targetAudience.beliefs) audienceDescription += `Przekonania: ${targetAudience.beliefs}\n\n`;
    if (targetAudience.main_offer) audienceDescription += `Główna oferta: ${targetAudience.main_offer}\n\n`;
  }

  return `
Jesteś zawodowym copywriterem wyspecjalizowanym w pisaniu skryptów do postów w mediach społecznościowych.

Twoim zadaniem jest:
– wejść w emocje i sytuację odbiorcy opisane w intro,
– rozwinąć temat w sposób ciekawy i osobisty,
– dać konkretną wartość – jedno zdanie, zasadę, różnicę w myśleniu,
– i zakończyć to naturalnym CTA, które wynika logicznie z treści.

Nie tworzysz nowego intro – ono już istnieje i zostanie dostarczone.
Nie tłumaczysz wszystkiego. Dajesz punkt zwrotny, zmianę perspektywy.
Nie mówisz o sobie. Skupiasz się w 100% na widzu.

---

# INTRO (już gotowe)
${intro}

# Informacje o grupie docelowej
${audienceDescription}

# Cel marketingowy
${advertisingGoal || "Zwiększenie świadomości marki"}

# Platforma docelowa
${platform || "Meta (Facebook/Instagram)"}

Na podstawie powyższych informacji, stwórz dokończenie postu, który zaczyna się podanym intro. 
Rozwiń temat, daj wartość odbiorcy i zakończ naturalnym wezwaniem do działania (CTA), które będzie pasować do platformy ${platform}.

Twoja treść powinna:
1. Płynnie naviaązywać do intro
2. Rozwijać temat w sposób wartościowy i ciekawy
3. Zawierać przynajmniej jedną konkretną wskazówkę, zasadę lub zmianę w myśleniu
4. Kończyć się naturalnym CTA, które zachęca do interakcji

Pamiętaj, że cały post (intro + Twoja treść) powinien być spójny, mówiony, naturalny i dopasowany do wybranej platformy społecznościowej.
`;
}
