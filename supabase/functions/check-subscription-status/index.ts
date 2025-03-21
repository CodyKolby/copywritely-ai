
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";

// Pobieramy klucz Secret Key Stripe z zmiennych środowiskowych
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Definiujemy nagłówki CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Obsługa zapytań CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Pobieramy ID użytkownika z żądania
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('Brak userId');
    }

    // W przyszłości, zaimplementuj tutaj sprawdzanie statusu subskrypcji w Stripe
    // Można to zrobić przez fetch do API Stripe lub przez zapytanie do bazy danych Supabase
    // z informacjami o subskrypcji

    // Tymczasowa implementacja - zwracamy false (brak premium)
    // W rzeczywistej implementacji, powinieneś:
    // 1. Sprawdzić tabelę subskrypcji w bazie danych
    // 2. Zweryfikować czy subskrypcja jest aktywna
    // 3. Zwrócić odpowiedni status

    const isPremium = false; // Tymczasowo zwracamy false

    return new Response(
      JSON.stringify({ isPremium }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Błąd podczas sprawdzania statusu subskrypcji:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Wystąpił błąd podczas sprawdzania statusu subskrypcji',
        isPremium: false
      }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
