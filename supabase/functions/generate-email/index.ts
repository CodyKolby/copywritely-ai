
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuration
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://jorbqjareswzdrsmepbv.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log("Otrzymano zapytanie do generate-email:", req.method, req.url);
  
  // Handle CORS preflight
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
    const requestData = await req.json();
    const templateId = requestData.templateId;
    const targetAudienceId = requestData.targetAudienceId;
    const advertisingGoal = requestData.advertisingGoal || '';
    const emailStyle = requestData.emailStyle || 'direct-sales';
    
    console.log("Odebrane dane:", JSON.stringify({ 
      templateId, 
      targetAudienceId, 
      advertisingGoal, 
      emailStyle 
    }));
    
    // Validate input data
    if (!templateId || !targetAudienceId) {
      console.error("Brak wymaganych danych:", { templateId, targetAudienceId });
      return new Response(
        JSON.stringify({ error: 'Brak wymaganych danych (templateId, targetAudienceId)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generowanie emaila dla szablonu:', templateId);
    console.log('ID grupy docelowej:', targetAudienceId);
    console.log('Cel reklamy:', advertisingGoal);
    console.log('Styl emaila:', emailStyle);
    
    // Validate Service Role Key
    if (!supabaseServiceKey) {
      console.error('Brak Service Role Key do autoryzacji bazy danych');
      return new Response(
        JSON.stringify({ 
          error: 'Brak skonfigurowanego klucza Service Role',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch target audience data from database
    console.log("Pobieranie danych grupy docelowej z URL:", `${supabaseUrl}/rest/v1/target_audiences?id=eq.${targetAudienceId}`);
    
    const dbResponse = await fetch(
      `${supabaseUrl}/rest/v1/target_audiences?id=eq.${targetAudienceId}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!dbResponse.ok) {
      console.error('Błąd zapytania do bazy danych:', dbResponse.status);
      return new Response(
        JSON.stringify({ 
          error: 'Błąd zapytania do bazy danych', 
          status: dbResponse.status 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const audienceData = await dbResponse.json();
    console.log("Odpowiedź z bazy danych:", JSON.stringify(audienceData));
    
    // Check if audience exists
    if (!audienceData || audienceData.length === 0) {
      console.error('Nie znaleziono grupy docelowej o ID:', targetAudienceId);
      
      return new Response(
        JSON.stringify({ 
          error: 'Nie znaleziono grupy docelowej',
          details: { targetAudienceId }
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const targetAudienceData = audienceData[0];
    
    console.log('Pobrano dane grupy docelowej:', targetAudienceData.name || 'Bez nazwy');
    
    // Validate OpenAI API key
    if (!openAIApiKey) {
      console.error('Brak klucza API OpenAI');
      
      return new Response(
        JSON.stringify({ 
          error: 'Brak skonfigurowanego klucza OpenAI API',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // PLACEHOLDER for future implementation of the AI agents
    // For now, return mock data to test the UI
    
    let subject = 'Odkryj rozwiązanie dla [Problem Klienta] - specjalna oferta';
    let emailContent = `Szanowny [Imię Klienta],

Czy mierzysz się z [Problem Klienta]? Nie jesteś sam - wielu naszych klientów borykało się z tym samym problemem przed odkryciem naszego rozwiązania.

[Nazwa Produktu/Usługi] został zaprojektowany specjalnie, aby pomóc Ci:
- [Korzyść 1]
- [Korzyść 2]
- [Korzyść 3]

Nasi klienci osiągają [konkretne rezultaty] w ciągu zaledwie [czasookres].

Aby dowiedzieć się więcej lub skorzystać z naszej specjalnej oferty, kliknij poniższy link:
[Link do oferty]

Z poważaniem,
[Twoje imię]
[Nazwa firmy]`;

    // Adjust content based on selected style
    if (emailStyle === 'educational') {
      subject = 'Jak skutecznie rozwiązać [Problem Klienta] - przewodnik eksperta';
      emailContent = `Szanowny [Imię Klienta],

W dzisiejszym artykule chciałbym podzielić się z Tobą istotnymi informacjami na temat [tematu związanego z problemem klienta]. 

Czy wiesz, że według badań [interesujący fakt statystyczny]? To pokazuje, jak ważne jest zrozumienie [kluczowego aspektu problemu].

Oto 3 najważniejsze rzeczy, które powinieneś wiedzieć:

1. [Wartościowa informacja 1] - [krótkie wyjaśnienie]
2. [Wartościowa informacja 2] - [krótkie wyjaśnienie] 
3. [Wartościowa informacja 3] - [krótkie wyjaśnienie]

Jeśli chcesz dowiedzieć się więcej na ten temat, przygotowaliśmy dla Ciebie obszerny przewodnik, który możesz pobrać tutaj: [link]

Mam nadzieję, że te informacje okazały się dla Ciebie wartościowe!

Z pozdrowieniami,
[Twoje imię]
[Nazwa firmy]`;
    }
    else if (emailStyle === 'story') {
      subject = 'Historia [imię klienta], który pokonał [problem klienta]';
      emailContent = `Szanowny [Imię Klienta],

Chcę podzielić się z Tobą historią [imię przykładowego klienta], który jeszcze [okres czasu] temu zmagał się z dokładnie tym samym problemem, co Ty teraz.

[Imię przykładowego klienta] codziennie mierzył się z [opis problemu i jego konsekwencji]. Próbował różnych rozwiązań: [wymienić nieskuteczne rozwiązania], ale nic nie przynosiło oczekiwanych rezultatów.

Wszystko zmieniło się, gdy odkrył [nazwa produktu/usługi]. 

[Opis momentu przełomowego i pierwszego kontaktu z rozwiązaniem]

Po [okres czasu] korzystania z [nazwa produktu/usługi], [imię przykładowego klienta] osiągnął [konkretne, mierzalne rezultaty]. Dzisiaj [opis obecnej, pozytywnej sytuacji klienta].

Czy jego historia brzmi znajomo? Jeśli tak, możemy pomóc Ci osiągnąć podobne rezultaty.

Kliknij tutaj, aby dowiedzieć się więcej: [link do oferty]

Z poważaniem,
[Twoje imię]
[Nazwa firmy]`;
    }
    else if (emailStyle === 'relationship') {
      subject = 'Dziękujemy za bycie częścią naszej społeczności [Imię Klienta]';
      emailContent = `Drogi [Imię Klienta],

Chciałbym osobiście podziękować Ci za bycie częścią naszej społeczności. To dzięki osobom takim jak Ty możemy nieustannie rozwijać się i dostarczać coraz lepsze rozwiązania.

Ostatnio w naszej firmie wydarzyło się kilka ciekawych rzeczy, o których chciałbym Ci opowiedzieć:

- [Aktualna nowość/wydarzenie w firmie 1]
- [Aktualna nowość/wydarzenie w firmie 2]
- [Aktualna nowość/wydarzenie w firmie 3]

Ponadto, bardzo cenimy sobie Twoją opinię. Czy mógłbyś poświęcić chwilę, aby odpowiedzieć na jedno pytanie? [Proste pytanie zachęcające do interakcji]

Możesz odpowiedzieć bezpośrednio na tego maila - czytam wszystkie wiadomości osobiście.

Z ciepłymi pozdrowieniami,
[Twoje imię]
[Nazwa firmy]

PS. Jako wyraz naszej wdzięczności, przygotowaliśmy dla Ciebie mały upominek: [link do darmowego zasobu/zniżki]`;
    }
    
    // Prepare the response data
    const responseData = {
      subject: subject,
      emailContent: emailContent,
      emailStyle: emailStyle,
      debug: {
        targetAudienceData: targetAudienceData,
        advertisingGoal: advertisingGoal
      }
    };
    
    console.log('🚀 Wysyłam odpowiedź do klienta');
    
    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Nieobsłużony błąd w funkcji generate-email:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Nieoczekiwany błąd',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
