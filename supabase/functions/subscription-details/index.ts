
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
      .select('subscription_id, subscription_status, subscription_expiry, is_premium, email')
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
      
      // Dla użytkowników premium bez ID subskrypcji, próbujemy sprawdzić czy istnieje klient w Stripe
      let portalUrl = null;
      try {
        if (!stripeSecretKey) {
          throw new Error('Brak klucza Stripe API');
        }
        
        // Pobieramy email użytkownika z profilu
        const userEmail = profile.email;
        
        if (!userEmail) {
          throw new Error('Brak adresu email użytkownika');
        }
        
        console.log('Checking for Stripe customer with email:', userEmail);
        
        // Sprawdzamy czy użytkownik istnieje w Stripe
        const response = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(userEmail)}&limit=1`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Stripe API error: ${response.status} ${errorText}`);
        }
        
        const customersData = await response.json();
        
        if (customersData.data && customersData.data.length > 0) {
          const customerId = customersData.data[0].id;
          console.log('Found Stripe customer ID for premium user:', customerId);
          
          // Tworzymy sesję portalu klienta
          console.log('Creating customer portal session for customer:', customerId);
          const portalSessionResponse = await fetch(`https://api.stripe.com/v1/billing_portal/sessions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customer: customerId,
              return_url: `${req.headers.get('origin') || 'https://copywrite-assist.com'}/`,
            }),
          });
          
          if (!portalSessionResponse.ok) {
            const errorText = await portalSessionResponse.text();
            console.error('Error creating portal session:', errorText);
            throw new Error(`Portal creation error: ${portalSessionResponse.status} ${errorText}`);
          }
          
          const portalSessionData = await portalSessionResponse.json();
          portalUrl = portalSessionData.url;
          console.log('Created customer portal session URL:', portalUrl);
        } else {
          console.log('No Stripe customer found for email:', userEmail);
        }
      } catch (portalError) {
        console.error('Error trying to create portal URL for premium user:', portalError);
      }
      
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
          portalUrl: portalUrl,
          plan: 'Pro',
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
      if (!stripeSecretKey) {
        throw new Error('Brak klucza Stripe API');
      }
      
      // Pobieramy szczegóły subskrypcji ze Stripe
      const response = await fetch(`https://api.stripe.com/v1/subscriptions/${profile.subscription_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Stripe API error: ${response.status} ${errorText}`);
      }
      
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
              portalUrl: null,
              plan: 'Pro',
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

      // Próba utworzenia sesji Customer Portal
      let portalUrl = null;
      
      if (subscriptionData.customer) {
        try {
          console.log('Creating customer portal session for customer:', subscriptionData.customer);
          
          // Tworzymy sesję portalu klienta
          const portalSessionResponse = await fetch(`https://api.stripe.com/v1/billing_portal/sessions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customer: subscriptionData.customer,
              return_url: `${req.headers.get('origin') || 'https://copywrite-assist.com'}/`,
            }),
          });
          
          if (!portalSessionResponse.ok) {
            const errorText = await portalSessionResponse.text();
            console.error('Error creating portal session:', errorText);
            throw new Error(`Portal creation error: ${portalSessionResponse.status} ${errorText}`);
          }
          
          const portalSessionData = await portalSessionResponse.json();
          portalUrl = portalSessionData.url;
          console.log('Created customer portal session URL:', portalUrl);
        } catch (portalError) {
          console.error('Error creating customer portal session:', portalError);
        }
      } else {
        console.error('No customer ID found in subscription data');
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
            portalUrl: null,
            plan: 'Pro',
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
