
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./modules/cors.ts";
import { formatAudienceDetails } from "./modules/formatter.ts";
import { preprocessAudienceData, extractHookData, extractScriptData } from "./modules/preprocessor.ts";
import { generateHooks } from "./modules/hook-generator.ts";
import { generatePASScript } from "./modules/pas-script-generator.ts";
import { editPASScript } from "./modules/pas-script-editor.ts";
import { generateAIDAScript } from "./modules/aida-script-generator.ts";

// Configuration
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://jorbqjareswzdrsmepbv.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  console.log("Otrzymano zapytanie do generate-script:", req.method, req.url);
  
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
    const debugInfo = requestData.debugInfo !== false; // Domyślnie true
    
    console.log("Odebrane dane:", JSON.stringify({ templateId, targetAudienceId, advertisingGoal, debugInfo }));
    
    // Validate input data
    if (!templateId || !targetAudienceId) {
      console.error("Brak wymaganych danych:", { templateId, targetAudienceId });
      return new Response(
        JSON.stringify({ error: 'Brak wymaganych danych (templateId, targetAudienceId)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generowanie skryptu dla szablonu:', templateId);
    console.log('ID grupy docelowej:', targetAudienceId);
    console.log('Cel reklamy:', advertisingGoal);
    
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

    // Fetch target audience data directly from database using fetch
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
    // Add the advertising goal to the audience data
    if (advertisingGoal) {
      targetAudienceData.advertisingGoal = advertisingGoal;
    }
    
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
    
    // KROK 1: Data Preprocessing - pierwszy agent przetwarza dane ankiety
    console.log('🔍 Rozpoczynam preprocessing danych ankiety');
    
    // Format audience data for preprocessing
    const audienceDescription = formatAudienceDetails(targetAudienceData);
    console.log('📋 Przygotowane dane dla agenta przetwarzającego:', audienceDescription);
    
    const processedData = await preprocessAudienceData(audienceDescription, openAIApiKey);
    
    if (!processedData) {
      console.error('Błąd podczas preprocessingu danych ankiety');
      return new Response(
        JSON.stringify({ 
          error: 'Błąd podczas preprocessingu danych ankiety',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('📝 Dane po przetworzeniu przez Data Processing Agent:');
    console.log(processedData);
    
    // Extract HOOK DATA section from processed data
    const hookData = extractHookData(processedData);
    const scriptData = extractScriptData(processedData);
    
    console.log('🔍 Wyekstrahowane HOOK DATA:');
    console.log(hookData);
    
    console.log('🔍 Wyekstrahowane SCRIPT DATA:');
    console.log(scriptData);
    
    if (!hookData) {
      console.error('Błąd podczas ekstrakcji danych dla generatora hooków');
      return new Response(
        JSON.stringify({ 
          error: 'Błąd podczas ekstrakcji danych dla generatora hooków',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ Preprocessing zakończony, przekazuję dane do generatora hooków');
    
    // KROK 2: Generowanie hooków na podstawie przetworzonych danych
    console.log('🖋️ Przygotowuję prompt dla generatora hooków z danymi:', hookData.substring(0, 100) + '...');
    const hooksResult = await generateHooks(hookData, openAIApiKey);
    
    if (!hooksResult) {
      console.error('Błąd podczas generowania hooków');
      return new Response(
        JSON.stringify({ 
          error: 'Błąd podczas generowania hooków',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ Wygenerowane hooki:');
    console.log(hooksResult.allHooks);
    console.log('✅ Najlepszy hook:');
    console.log(hooksResult.bestHook);
    console.log('✅ Struktura reklamy:');
    console.log(hooksResult.adStructure);
    
    // KROK 3: W zależności od struktury reklamy, generujemy odpowiedni skrypt
    let generatedScript = '';
    let finalScript = '';
    
    if (hooksResult.adStructure === 'PAS') {
      console.log('🖋️ Struktura reklamy: PAS - generuję skrypt PAS');
      
      // Generuj skrypt PAS
      const pasScript = await generatePASScript(
        hooksResult.bestHook,
        advertisingGoal,
        scriptData || '',
        openAIApiKey
      );
      
      if (!pasScript) {
        console.error('Błąd podczas generowania skryptu PAS');
        // Fallback - używamy ogólnych hooków
        generatedScript = hooksResult.allHooks;
        finalScript = generatedScript;
      } else {
        generatedScript = pasScript;
        
        // KROK 4: Redakcja skryptu PAS
        console.log('🖋️ Redakcja skryptu PAS przez Redaktora PAS');
        const editedPASScript = await editPASScript(
          generatedScript,
          advertisingGoal,
          openAIApiKey
        );
        
        if (!editedPASScript) {
          console.error('Błąd podczas redakcji skryptu PAS');
          // Fallback - używamy nieredagowanego skryptu PAS
          finalScript = generatedScript;
        } else {
          finalScript = editedPASScript;
          console.log('✅ Skrypt PAS po redakcji (fragment):', finalScript.substring(0, 150) + '...');
        }
      }
    } else if (hooksResult.adStructure === 'AIDA') {
      console.log('🖋️ Struktura reklamy: AIDA - generuję skrypt AIDA');
      
      // Generuj skrypt AIDA
      const aidaScript = await generateAIDAScript(
        hooksResult.bestHook,
        advertisingGoal,
        scriptData || '',
        openAIApiKey
      );
      
      if (!aidaScript) {
        console.error('Błąd podczas generowania skryptu AIDA');
        // Fallback - używamy ogólnych hooków
        generatedScript = hooksResult.allHooks;
        finalScript = generatedScript;
      } else {
        generatedScript = aidaScript;
        finalScript = generatedScript; // Na razie nie mamy redaktora AIDA
      }
    } else {
      // Gdy struktura nie jest określona, używamy wygenerowanych hooków
      console.log('🖋️ Struktura reklamy:', hooksResult.adStructure || 'nieokreślona', '- używam wygenerowanych hooków');
      generatedScript = hooksResult.allHooks;
      finalScript = generatedScript;
    }
    
    // Przygotowanie odpowiedzi
    const responseData = {
      script: finalScript,
      bestHook: hooksResult.bestHook,
      adStructure: hooksResult.adStructure || '',
      debug: debugInfo ? {
        originalData: audienceDescription,
        processedData: processedData,
        hookData: hookData,
        scriptData: scriptData,
        advertisingGoal: advertisingGoal,
        rawScript: generatedScript, // Dodajemy surowy skrypt (przed redakcją)
      } : null
    };
    
    console.log('🚀 Wysyłam odpowiedź do klienta');
    
    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Nieobsłużony błąd w funkcji generate-script:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Nieoczekiwany błąd',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
