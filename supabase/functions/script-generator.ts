import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Properly configured CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// System prompt for ScriptGeneratorAI
const SYSTEM_PROMPT = `Jesteś ekspertem od tworzenia skryptów reklamowych.

Twoim zadaniem jest napisanie treści głównej reklamy, która będzie pasować do podanego hooka i angle. 
Nie dodawaj własnego początku ani zakończenia - skupiaj się tylko na głównej treści.

Dostosuj styl i ton do podanego szablonu reklamowego (np. TikTok, VSL, post na FB).`;

serve(async (req) => {
  console.log("Otrzymano zapytanie do script-generator:", req.method);
  
  // Handle CORS preflight requests - ensure proper status and headers
  if (req.method === 'OPTIONS') {
    console.log("Obsługa zapytania preflight OPTIONS");
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    console.log("Przetwarzanie zapytania POST");
    // Parse request data
    const { targetAudience, templateType, selectedHook, selectedAngle } = await req.json();
    
    if (!targetAudience || !selectedHook || !selectedAngle) {
      console.error("Brak wymaganych danych");
      return new Response(
        JSON.stringify({ error: 'Brak wymaganych danych (grupa docelowa, hook, angle)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generowanie skryptu dla szablonu:', templateType);
    console.log('Wybrany hook:', selectedHook);
    console.log('Wybrany angle:', selectedAngle);
    
    // Format audience description for the AI prompt
    const audienceDescription = formatAudienceDescription(targetAudience);
    
    // Create the prompt for OpenAI
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

    // Call OpenAI API
    console.log("Wysyłanie zapytania do OpenAI...");
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Błąd API OpenAI:', errorData);
      return new Response(
        JSON.stringify({ error: 'Błąd generowania skryptu', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse response
    const data = await response.json();
    const scriptContent = data.choices[0].message.content;
    
    console.log('Wygenerowano skrypt');
    
    // Return the generated script content
    return new Response(
      JSON.stringify({ scriptContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Błąd w funkcji script-generator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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
