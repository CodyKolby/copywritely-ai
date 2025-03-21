
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

    // Szczegółowe logowanie
    console.log(`Rozpoczynam tworzenie sesji checkout - tryb ${stripeSecretKey.startsWith('sk_test') ? 'testowy' : 'produkcyjny'}`);
    console.log(`Używam priceId: ${priceId}`);
    console.log(`Email klienta: ${customerEmail || 'nie podano'}`);

    // Tworzymy parametry dla sesji Checkout
    const checkoutParams = {
      mode: 'subscription',
      success_url: successUrl || `${req.headers.get('origin') || ''}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get('origin') || ''}/pricing`,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 3,
      },
    };
    
    // Dodajemy opcjonalny email klienta, jeśli został podany
    if (customerEmail) {
      checkoutParams.customer_email = customerEmail;
    }

    console.log('Parametry sesji Stripe:', JSON.stringify(checkoutParams, null, 2));

    // Konwertujemy parametry na format x-www-form-urlencoded
    const formParams = new URLSearchParams();
    
    // Dodajemy podstawowe parametry
    formParams.append('mode', 'subscription');
    formParams.append('success_url', successUrl || `${req.headers.get('origin') || ''}/success?session_id={CHECKOUT_SESSION_ID}`);
    formParams.append('cancel_url', cancelUrl || `${req.headers.get('origin') || ''}/pricing`);
    
    // Dodajemy pozycje zamówienia
    formParams.append('line_items[0][price]', priceId);
    formParams.append('line_items[0][quantity]', '1');
    
    // Dodajemy okres próbny
    formParams.append('subscription_data[trial_period_days]', '3');
    
    // Dodajemy email klienta, jeśli został podany
    if (customerEmail) {
      formParams.append('customer_email', customerEmail);
    }

    // Tworzymy sesję Stripe za pomocą Fetch API
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formParams,
    });

    // Pobieramy dane odpowiedzi
    const responseText = await response.text();
    let sessionData;
    
    try {
      sessionData = JSON.parse(responseText);
    } catch (e) {
      console.error('Nieprawidłowa odpowiedź JSON:', responseText);
      throw new Error('Nieprawidłowa odpowiedź z API Stripe');
    }

    // Szczegółowe logowanie odpowiedzi
    if (!response.ok) {
      console.error('Błąd API Stripe:', {
        status: response.status,
        statusText: response.statusText,
        error: sessionData.error,
        rawResponse: responseText.substring(0, 500) // Logujemy tylko część odpowiedzi
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
        error: error.message || 'Wystąpił błąd podczas tworzenia sesji płatności',
        details: error.stack
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
