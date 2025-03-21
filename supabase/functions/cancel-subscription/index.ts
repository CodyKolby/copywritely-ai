
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
    // Pobieramy ID użytkownika i subskrypcji z żądania
    const { userId, subscriptionId } = await req.json();

    if (!userId || !subscriptionId) {
      throw new Error('Brak wymaganych danych');
    }

    // Tworzymy klienta Supabase z Service Role Key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Sprawdzamy, czy użytkownik ma uprawnienia do anulowania tej subskrypcji
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Błąd podczas pobierania profilu:', profileError);
      throw new Error('Nie udało się pobrać profilu użytkownika');
    }

    if (profile.subscription_id !== subscriptionId) {
      throw new Error('Brak uprawnień do anulowania tej subskrypcji');
    }

    // Anulujemy subskrypcję w Stripe (na koniec bieżącego okresu rozliczeniowego)
    const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const cancellationData = await response.json();

    if (cancellationData.error) {
      console.error('Błąd podczas anulowania subskrypcji:', cancellationData.error);
      throw new Error(cancellationData.error.message);
    }

    // Aktualizujemy profil użytkownika
    if (cancellationData.cancel_at_period_end) {
      // Nie aktualizujemy subscription_id ani is_premium teraz,
      // zostanie to zaktualizowane przez webhook gdy subskrypcja faktycznie wygaśnie
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'canceled'
        })
        .eq('id', userId);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Subskrypcja zostanie anulowana na koniec bieżącego okresu rozliczeniowego',
        cancelAtPeriodEnd: cancellationData.cancel_at_period_end,
        currentPeriodEnd: new Date(cancellationData.current_period_end * 1000).toISOString()
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
        error: error.message || 'Wystąpił błąd podczas anulowania subskrypcji',
        success: false
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
