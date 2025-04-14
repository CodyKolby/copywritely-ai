
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

    console.log(`Fetching subscription details for user: ${userId}`);

    // Tworzymy klienta Supabase z Service Role Key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Pobieramy profil użytkownika z informacją o subskrypcji
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_id, subscription_status, subscription_expiry, is_premium')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Błąd podczas pobierania profilu:', profileError);
      throw new Error('Nie udało się pobrać profilu użytkownika');
    }

    console.log('Profile data:', profile);

    // Nawet jeśli nie ma subscription_id, ale użytkownik ma status premium,
    // zwracamy podstawowe informacje
    if (profile?.is_premium && (!profile?.subscription_id || profile.subscription_id === '')) {
      console.log('User has premium status without subscription ID');
      
      return new Response(
        JSON.stringify({ 
          hasSubscription: true,
          subscriptionId: 'manual_premium',
          status: 'active',
          currentPeriodEnd: profile.subscription_expiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          daysUntilRenewal: profile.subscription_expiry ? 
            Math.ceil((new Date(profile.subscription_expiry).getTime() - Date.now()) / (1000 * 3600 * 24)) : 
            30,
          cancelAtPeriodEnd: false,
          portalUrl: '#',
          plan: 'Pro',
          // Dodajemy domyślne informacje o metodzie płatności
          paymentMethod: {
            brand: 'card',
            last4: '0000'
          }
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
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

    try {
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
        
        // Jeśli wystąpił błąd ze Stripe, ale użytkownik ma status premium,
        // zwracamy podstawowe informacje z profilu
        if (profile.is_premium) {
          return new Response(
            JSON.stringify({ 
              hasSubscription: true,
              subscriptionId: profile.subscription_id,
              status: profile.subscription_status || 'active',
              currentPeriodEnd: profile.subscription_expiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              daysUntilRenewal: profile.subscription_expiry ? 
                Math.ceil((new Date(profile.subscription_expiry).getTime() - Date.now()) / (1000 * 3600 * 24)) : 
                30,
              cancelAtPeriodEnd: false,
              portalUrl: '#',
              plan: 'Pro',
              // Dodajemy domyślne informacje o metodzie płatności
              paymentMethod: {
                brand: 'card',
                last4: '0000'
              }
            }),
            { 
              headers: { 
                ...corsHeaders,
                'Content-Type': 'application/json' 
              } 
            }
          );
        }
        
        throw new Error(subscriptionData.error.message);
      }

      // Pobieramy metodę płatności
      let paymentMethod = null;
      
      // Jeśli subskrypcja ma domyślną metodę płatności, spróbujmy ją pobrać
      if (subscriptionData.default_payment_method) {
        try {
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
              last4: paymentMethodData.card.last4
            };
          }
        } catch (pmError) {
          console.error('Błąd podczas pobierania metody płatności:', pmError);
          // Kontynuujemy bez rzucania wyjątku
        }
      }
      
      // Jeśli nie znaleźliśmy metody płatności przez default_payment_method, 
      // spróbujmy pobrać listę metod płatności klienta
      if (!paymentMethod && subscriptionData.customer) {
        try {
          const customerPaymentMethodsResponse = await fetch(
            `https://api.stripe.com/v1/payment_methods?customer=${subscriptionData.customer}&type=card&limit=1`, 
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${stripeSecretKey}`,
                'Content-Type': 'application/json',
              },
            }
          );
          
          const customerPaymentMethodsData = await customerPaymentMethodsResponse.json();
          
          if (!customerPaymentMethodsData.error && 
              customerPaymentMethodsData.data && 
              customerPaymentMethodsData.data.length > 0 &&
              customerPaymentMethodsData.data[0].card) {
            paymentMethod = {
              brand: customerPaymentMethodsData.data[0].card.brand,
              last4: customerPaymentMethodsData.data[0].card.last4
            };
          }
        } catch (customerPmError) {
          console.error('Błąd podczas pobierania metod płatności klienta:', customerPmError);
          // Kontynuujemy bez rzucania wyjątku
        }
      }
      
      // Jeśli nadal nie mamy metody płatności, użyjmy wartości domyślnej
      if (!paymentMethod) {
        paymentMethod = {
          brand: 'card',
          last4: '0000'
        };
      }

      // Próba utworzenia sesji Customer Portal, ale z obsługą błędu
      let portalUrl = '#'; // Domyślna wartość
      
      try {
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
        
        if (!portalData.error) {
          portalUrl = portalData.url;
        } else {
          console.error('Ostrzeżenie: Nie można utworzyć sesji Customer Portal:', portalData.error);
        }
      } catch (portalError) {
        console.error('Błąd podczas tworzenia sesji Customer Portal:', portalError);
        // Kontynuujemy bez rzucania wyjątku
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
        portalUrl: portalUrl,
        hasSubscription: true,
        plan: subscriptionData.items?.data[0]?.plan?.nickname || 'Pro',
        trialEnd: subscriptionData.trial_end ? new Date(subscriptionData.trial_end * 1000).toISOString() : null,
        paymentMethod: paymentMethod
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
    } catch (stripeError) {
      console.error('Błąd podczas komunikacji ze Stripe:', stripeError);
      
      // Jeśli użytkownik ma status premium w profilu, zwracamy podstawowe informacje
      if (profile.is_premium) {
        return new Response(
          JSON.stringify({ 
            hasSubscription: true,
            subscriptionId: profile.subscription_id || 'manual_premium',
            status: profile.subscription_status || 'active',
            currentPeriodEnd: profile.subscription_expiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            daysUntilRenewal: profile.subscription_expiry ? 
              Math.ceil((new Date(profile.subscription_expiry).getTime() - Date.now()) / (1000 * 3600 * 24)) : 
              30,
            cancelAtPeriodEnd: false,
            portalUrl: '#',
            plan: 'Pro',
            // Dodajemy domyślne informacje o metodzie płatności
            paymentMethod: {
              brand: 'card',
              last4: '0000'
            }
          }),
          { 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        );
      }
      
      throw new Error('Wystąpił błąd podczas komunikacji ze Stripe');
    }
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
