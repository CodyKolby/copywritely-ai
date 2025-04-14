
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";
import Stripe from "https://esm.sh/stripe@12.1.1";

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

    // Inicjalizuj klienta Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient()
    });

    // Wysyłamy żądanie do API Stripe
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    // Przetwarzamy odpowiedź
    if (!subscription) {
      throw new Error('Nie udało się anulować subskrypcji');
    }

    // Aktualizujemy profil użytkownika w bazie danych
    // Użytkownik zachowuje status premium do końca okresu rozliczeniowego
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        updated_at: new Date().toISOString(),
        subscription_status: 'canceling'
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
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
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
