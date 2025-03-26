import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Poprawiona konfiguracja CORS headers - dodajemy wszystkie potrzebne nagłówki
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// System prompt dla HookAndAngleGeneratorAI
const SYSTEM_PROMPT = `Jesteś ekspertem copywritingu, specjalizującym się w tworzeniu skutecznych hooków reklamowych na potrzeby kampanii Meta Ads, TikTok i reklam video. Twoim zadaniem jest stworzyć 3–5 hooków na podstawie danych z ankiety użytkownika.

Twoim jedynym celem jest stworzyć hooki, które przyciągają uwagę i sprawiają, że osoba z grupy docelowej natychmiast chce zobaczyć dalszą część reklamy. Hook NIE może zawierać żadnego call-to-action. NIE może zdradzać, co jest dalej. Ma jedynie wywołać emocjonalne zaciekawienie, utożsamienie się lub prowokację. To pierwszy zdanie reklamy — nie clickbait, ale lustro dla emocji klienta.

ZASADY TWORZENIA HOOKÓW:

1. Hook musi zaczynać się tak, jakby był początkiem nowej myśli. Unikaj zaczynania od środka zdania („Codziennie budzisz się…"). Zacznij jak człowiek, który właśnie wchodzi w rozmowę.

2. Najczęściej używaj formy pytania („Czy masz już dość..."), ale czasem możesz zastosować formę tezy („Przestań robić XYZ…"), jeśli dobrze działa w danym kontekście.

3. Nie używaj fraz typu:
   - „Zastanawiałaś się kiedyś..."
   - „Czujesz, że..."
   - „To nie przypadek, że tu jesteś"
   - „Wiem, co czujesz..."
   - „Mam coś dla Ciebie..."

4. Używaj słownictwa, które pojawia się w ankiecie. Nie zmieniaj go na inne synonimy.

5. Długość hooka powinna wynosić ok. 20 słów, ale nie musi być sztywna. Ważniejszy jest rytm, emocja i naturalność.

6. Uwzględniaj płeć grupy docelowej. Jeśli klient pisze o kobietach – dopasuj końcówki (np. „gotowa", „zdecydowana"), jeśli o mężczyznach – odpowiednio odwrotnie. Unikaj form neutralnych, jeśli płeć jest znana.

7. Hook nie sprzedaje – on tylko przyciąga uwagę. Jego zadaniem jest zainteresować, nie przekonywać.

8. Każdy hook powinien być przypisany do konkretnego angle'a.

Poniżej lista angle'i, z których możesz korzystać:

- **Ból** – uderz w największą frustrację, np. „Czy znowu budzisz się z bólem pleców?" (ludzie natychmiast rozpoznają swój problem i chcą wiedzieć, co dalej)
- **Pragnienie** – np. „Czy chciałabyś wreszcie budzić się bez bólu pleców?" (pokazujemy stan, do którego klient chce dojść)
- **Prowokacja / Kontrast** – np. „Jeśli dalej myślisz, że XYZ zmieni twoje życie…" (atakujemy iluzję, którą klient ma w głowie)
- **Okazja / Timing** – np. „Czy jednym z Twoich noworocznych postanowień było wreszcie ruszyć z miejsca?" (na bazie aktualnych zdarzeń lub dat)
- **Nowość + Łatwość** – np. „Co jeśli wystarczy jedna konkretna decyzja, żeby wszystko się zmieniło?" (podkreślamy zmianę bez bólu)

ZANIM ZACZNIESZ:

Wyobraź sobie, że jesteś osobą opisaną w ankiecie. Przeczytaj swoją biografię, bóle i pragnienia. Zastanów się: co musiałbyś usłyszeć jako pierwsze zdanie, żebyś pomyślał/a „to o mnie"? Hook ma być lustrem, nie megafonem.

Zwróć wynik w formacie JSON zawierającym 3-5 hooków z przypisanymi angle'ami:
{
  "hooks": [
    {
      "hook": "Tutaj tekst hooka",
      "angle": "ból/pragnienie/prowokacja/okazja/nowość",
      "type": "problem/desire/curiosity/shock/personal"
    },
    // kolejne hooki
  ]
}`;

// Funkcja obsługująca requesty - przenosimy ją na początek pliku
serve(async (req) => {
  console.log("Otrzymano zapytanie:", req.method);
  
  // Obsługa preflight CORS - zapewniamy prawidłowy status i nagłówki
  if (req.method === 'OPTIONS') {
    console.log("Obsługa zapytania preflight OPTIONS");
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders
    });
  }

  try {
    console.log("Przetwarzanie zapytania POST");
    // Parsowanie danych z zapytania
    const { targetAudience, templateType } = await req.json();
    
    if (!targetAudience) {
      console.error("Brak danych o grupie docelowej");
      return new Response(
        JSON.stringify({ error: 'Brak danych o grupie docelowej' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generowanie hooków i angles dla szablonu:', templateType);
    console.log('Dane grupy docelowej:', targetAudience);

    // Przygotowanie opisu grupy docelowej dla AI
    const audienceDescription = formatAudienceDescription(targetAudience);
    
    // Wywołanie API OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: audienceDescription }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" } // Zapewnia, że OpenAI zwróci poprawny JSON
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Błąd API OpenAI:', errorData);
      return new Response(
        JSON.stringify({ error: 'Błąd generowania hooków', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parsowanie odpowiedzi
    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    // Parsowanie JSON z odpowiedzi
    let parsedContent;
    try {
      parsedContent = JSON.parse(generatedContent);
    } catch (e) {
      console.error('Błąd parsowania JSON z odpowiedzi OpenAI:', e);
      return new Response(
        JSON.stringify({ error: 'Nieprawidłowy format odpowiedzi AI', rawContent: generatedContent }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Wygenerowano hooki i angles:', parsedContent);
    
    return new Response(
      JSON.stringify(parsedContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Błąd w funkcji hook-angle-generator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Funkcja formatująca dane grupy docelowej do prompta
function formatAudienceDescription(audience) {
  if (!audience) return "Brak danych o grupie docelowej.";
  
  let description = "# Informacje o grupie docelowej\n\n";
  
  // Podstawowe dane demograficzne
  if (audience.age_range) description += `Wiek: ${audience.age_range}\n`;
  if (audience.gender) description += `Płeć: ${audience.gender}\n\n`;
  
  // Główna oferta
  if (audience.main_offer) description += `## Główna oferta\n${audience.main_offer}\n\n`;
  
  // Szczegóły oferty
  if (audience.offer_details) description += `## Szczegóły oferty\n${audience.offer_details}\n\n`;
  
  // Problemy klientów
  if (audience.pains && audience.pains.length > 0) {
    description += "## Problemy klientów\n";
    audience.pains.forEach((pain, index) => {
      if (pain) description += `${index + 1}. ${pain}\n`;
    });
    description += "\n";
  }
  
  // Pragnienia
  if (audience.desires && audience.desires.length > 0) {
    description += "## Pragnienia klientów\n";
    audience.desires.forEach((desire, index) => {
      if (desire) description += `${index + 1}. ${desire}\n`;
    });
    description += "\n";
  }
  
  // Korzyści
  if (audience.benefits && audience.benefits.length > 0) {
    description += "## Korzyści produktu/usługi\n";
    audience.benefits.forEach((benefit, index) => {
      if (benefit) description += `${index + 1}. ${benefit}\n`;
    });
    description += "\n";
  }
  
  // Język klienta
  if (audience.language) description += `## Język klienta\n${audience.language}\n\n`;
  
  // Przekonania
  if (audience.beliefs) description += `## Przekonania do zbudowania\n${audience.beliefs}\n\n`;
  
  // Biografia
  if (audience.biography) description += `## Biografia klienta\n${audience.biography}\n\n`;
  
  // Konkurencja
  if (audience.competitors && audience.competitors.length > 0) {
    description += "## Konkurencja\n";
    audience.competitors.forEach((competitor, index) => {
      if (competitor) description += `${index + 1}. ${competitor}\n`;
    });
    description += "\n";
  }
  
  // Dlaczego to działa
  if (audience.why_it_works) description += `## Dlaczego produkt/usługa działa\n${audience.why_it_works}\n\n`;
  
  // Doświadczenie
  if (audience.experience) description += `## Doświadczenie sprzedawcy\n${audience.experience}\n\n`;
  
  return description;
}
