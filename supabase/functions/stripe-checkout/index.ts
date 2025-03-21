
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Pobieramy klucze Stripe z zmiennych środowiskowych
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

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
    const { priceId, customerEmail, successUrl, cancelUrl } = await req.json();

    // Walidacja danych wejściowych
    if (!priceId) {
      console.error('Brak priceId w zapytaniu');
      throw new Error('Brak identyfikatora cennika (priceId)');
    }

    if (!stripeSecretKey) {
      console.error('Brak klucza Stripe w zmiennych środowiskowych');
      throw new Error('Błąd konfiguracji: brak klucza API Stripe');
    }

    console.log(`Tworzenie sesji Stripe Checkout dla priceId: ${priceId}`);

    // Tworzymy parametry dla sesji Checkout
    const params = new URLSearchParams({
      'success_url': successUrl || `${req.headers.get('origin') || ''}/success?session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': cancelUrl || `${req.headers.get('origin') || ''}/pricing`,
      'mode': 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
    });

    // Dodajemy 3-dniowy okres próbny
    params.append('subscription_data[trial_period_days]', '3');

    // Dodajemy opcjonalny email klienta, jeśli został podany
    if (customerEmail) {
      params.append('customer_email', customerEmail);
    }

    console.log('Parametry sesji Stripe:', Object.fromEntries(params));

    // Tworzymy sesję Stripe za pomocą Fetch API
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    // Przetwarzamy odpowiedź
    const sessionData = await response.json();

    // Szczegółowe logowanie odpowiedzi
    if (!response.ok) {
      console.error('Błąd API Stripe:', {
        statusCode: response.status,
        statusText: response.statusText,
        error: sessionData.error
      });
      
      // Obsługa błędu dotyczącego trybu testowego/produkcyjnego
      if (sessionData.error && sessionData.error.message && 
          sessionData.error.message.includes('test mode') && 
          sessionData.error.message.includes('live mode')) {
        throw new Error('Błąd zgodności: Test mode price ID używany z live mode API key. Proszę użyć zgodnych kluczy w tym samym trybie.');
      }
      
      throw new Error(sessionData.error?.message || 'Błąd podczas tworzenia sesji Stripe');
    }

    console.log('Sesja Stripe utworzona pomyślnie:', {
      sessionId: sessionData.id,
      url: sessionData.url
    });

    // Zwracamy URL do sesji Checkout
    return new Response(
      JSON.stringify({ 
        sessionId: sessionData.id,
        url: sessionData.url 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Błąd podczas tworzenia sesji Stripe Checkout:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Wystąpił błąd podczas tworzenia sesji płatności' 
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
