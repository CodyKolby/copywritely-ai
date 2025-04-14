
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";

// Pobieramy klucze ze zmiennych środowiskowych
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
    // Pobieramy dane z żądania
    const { userId, subscriptionId } = await req.json();

    if (!userId || !subscriptionId) {
      throw new Error('Brak wymaganych danych: userId lub subscriptionId');
    }

    if (!stripeSecretKey) {
      throw new Error('Brak klucza Stripe API');
    }

    console.log(`Anulowanie subskrypcji ${subscriptionId} dla użytkownika ${userId}`);

    // Wysyłamy żądanie do API Stripe
    const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'cancel_at_period_end': 'true',
      }),
    });

    // Przetwarzamy odpowiedź
    const subscriptionData = await response.json();

    // Jeśli wystąpił błąd, zwracamy go
    if (subscriptionData.error) {
      console.error('Błąd podczas anulowania subskrypcji:', subscriptionData.error);
      throw new Error(subscriptionData.error.message);
    }

    // Aktualizujemy profil użytkownika w bazie danych
    // Użytkownik zachowuje status premium do końca okresu rozliczeniowego
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Błąd podczas aktualizacji profilu:', updateError);
    }

    // Formatujemy i zwracamy dane
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subskrypcja została anulowana',
        cancelAtPeriodEnd: subscriptionData.cancel_at_period_end,
        currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000).toISOString(),
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Błąd podczas anulowania subskrypcji:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Wystąpił błąd podczas anulowania subskrypcji' 
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
