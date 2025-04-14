
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
    // Pobieramy ID użytkownika z żądania
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('Brak userId');
    }

    // Tworzymy klienta Supabase z Service Role Key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Pobieramy profil użytkownika z informacją o subskrypcji
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_id, subscription_status, subscription_expiry')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Błąd podczas pobierania profilu:', profileError);
      throw new Error('Nie udało się pobrać profilu użytkownika');
    }

    if (!profile?.subscription_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Użytkownik nie ma aktywnej subskrypcji',
          hasSubscription: false
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Pobieramy szczegóły subskrypcji ze Stripe
    const response = await fetch(`https://api.stripe.com/v1/subscriptions/${profile.subscription_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const subscriptionData = await response.json();

    if (subscriptionData.error) {
      console.error('Błąd podczas pobierania danych subskrypcji:', subscriptionData.error);
      throw new Error(subscriptionData.error.message);
    }

    // Pobieramy informacje o metodzie płatności
    let paymentMethod = null;
    if (subscriptionData.default_payment_method) {
      const paymentMethodResponse = await fetch(`https://api.stripe.com/v1/payment_methods/${subscriptionData.default_payment_method}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      const paymentMethodData = await paymentMethodResponse.json();
      
      if (!paymentMethodData.error && paymentMethodData.card) {
        paymentMethod = {
          brand: paymentMethodData.card.brand,
          last4: paymentMethodData.card.last4,
        };
      }
    } else if (subscriptionData.customer) {
      // Jeśli nie ma default_payment_method na subskrypcji, sprawdzamy metody płatności klienta
      const paymentMethodsResponse = await fetch(`https://api.stripe.com/v1/payment_methods?customer=${subscriptionData.customer}&type=card&limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      const paymentMethodsData = await paymentMethodsResponse.json();
      
      if (!paymentMethodsData.error && paymentMethodsData.data && paymentMethodsData.data.length > 0) {
        const card = paymentMethodsData.data[0].card;
        paymentMethod = {
          brand: card.brand,
          last4: card.last4,
        };
      }
    }

    // Pobieramy adres URL do Customer Portal
    const portalResponse = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'customer': subscriptionData.customer,
        'return_url': `${req.headers.get('origin') || ''}/account`,
      }),
    });

    const portalData = await portalResponse.json();

    if (portalData.error) {
      console.error('Błąd podczas tworzenia sesji Customer Portal:', portalData.error);
      throw new Error(portalData.error.message);
    }

    // Formatujemy i zwracamy dane
    const currentDate = new Date();
    const currentPeriodEnd = new Date(subscriptionData.current_period_end * 1000);
    const daysUntilRenewal = Math.ceil((currentPeriodEnd.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));
    
    const formattedData = {
      subscriptionId: subscriptionData.id,
      status: subscriptionData.status,
      currentPeriodEnd: currentPeriodEnd.toISOString(),
      daysUntilRenewal: daysUntilRenewal,
      cancelAtPeriodEnd: subscriptionData.cancel_at_period_end,
      portalUrl: portalData.url,
      hasSubscription: true,
      plan: subscriptionData.items?.data[0]?.plan?.nickname || 'Pro',
      trialEnd: subscriptionData.trial_end ? new Date(subscriptionData.trial_end * 1000).toISOString() : null,
      paymentMethod: paymentMethod,
    };

    return new Response(
      JSON.stringify(formattedData),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Błąd podczas pobierania danych subskrypcji:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Wystąpił błąd podczas pobierania danych subskrypcji',
        hasSubscription: false
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
