
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

// Inicjalizacja klienta Stripe
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2022-11-15'
}) : null;

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
        if (!stripe) {
          throw new Error('Brak klucza Stripe API lub nie udało się zainicjalizować klienta');
        }
        
        // Pobieramy email użytkownika z profilu
        const userEmail = profile.email;
        
        if (!userEmail) {
          throw new Error('Brak adresu email użytkownika');
        }
        
        console.log('Checking for Stripe customer with email:', userEmail);
        
        // Sprawdzamy czy użytkownik istnieje w Stripe używając SDK
        const customers = await stripe.customers.list({ 
          email: userEmail,
          limit: 1 
        });
        
        if (customers.data && customers.data.length > 0) {
          const customerId = customers.data[0].id;
          console.log('Found Stripe customer ID for premium user:', customerId);
          
          // Tworzymy sesję portalu klienta używając SDK
          console.log('Creating customer portal session for customer:', customerId);
          const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${req.headers.get('origin') || 'https://copywrite-assist.com'}/`,
          });
          
          portalUrl = session.url;
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
          subscriptionId: profile.subscription_id || 'manual_premium',
          status: profile.subscription_status || 'active',
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
      if (!stripe) {
        throw new Error('Brak klucza Stripe API lub nie udało się zainicjalizować klienta');
      }
      
      // Pobieramy szczegóły subskrypcji ze Stripe używając SDK
      const subscription = await stripe.subscriptions.retrieve(profile.subscription_id);
      
      if (!subscription) {
        throw new Error('Nie udało się pobrać danych subskrypcji');
      }

      // Próba utworzenia sesji Customer Portal używając SDK Stripe
      let portalUrl = null;
      
      if (subscription.customer) {
        try {
          console.log('Creating customer portal session for customer:', subscription.customer);
          
          // Tworzymy sesję portalu klienta używając SDK
          const portalSession = await stripe.billingPortal.sessions.create({
            customer: subscription.customer,
            return_url: `${req.headers.get('origin') || 'https://copywrite-assist.com'}/`,
          });
          
          portalUrl = portalSession.url;
          console.log('Created customer portal session URL:', portalUrl);
        } catch (portalError) {
          console.error('Error creating customer portal session:', portalError);
        }
      } else {
        console.error('No customer ID found in subscription data');
      }

      // Formatujemy i zwracamy dane
      const currentDate = new Date();
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      const daysUntilRenewal = Math.ceil((currentPeriodEnd.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));
      
      const formattedData = {
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: currentPeriodEnd.toISOString(),
        daysUntilRenewal: daysUntilRenewal,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        portalUrl: portalUrl,
        hasSubscription: true,
        plan: subscription.items?.data[0]?.plan?.nickname || 'Pro',
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
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
