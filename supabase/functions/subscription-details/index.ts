
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";
import Stripe from "https://esm.sh/stripe@12.1.1";

// Get keys from environment variables
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Stripe client
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2022-11-15'
}) : null;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user ID from request
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('Missing userId');
    }

    console.log(`Fetching subscription details for user: ${userId}`);

    // Create Supabase client with Service Role Key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile with subscription information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_id, subscription_status, subscription_expiry, trial_started_at, is_premium, email')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    console.log('Profile data:', profile);

    // Check if user is in trial period
    let isTrial = false;
    if (profile?.is_premium && profile?.trial_started_at && (!profile?.subscription_id || profile.subscription_id === '')) {
      const trialStartDate = new Date(profile.trial_started_at);
      const now = new Date();
      const trialDays = Math.floor((now.getTime() - trialStartDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (trialDays <= 3) {
        console.log('User is in trial period:', trialDays, 'days');
        isTrial = true;
      }
    }
    
    // Even if there's no subscription_id, but user has premium status,
    // return basic information
    if (profile?.is_premium && (!profile?.subscription_id || profile.subscription_id === '')) {
      console.log('User has premium status without subscription ID');
      
      // For premium users without subscription ID, try to check if there's a Stripe customer
      let portalUrl = null;
      try {
        if (!stripe) {
          throw new Error('Missing Stripe API key or failed to initialize client');
        }
        
        // Get user email from profile
        const userEmail = profile.email;
        
        if (!userEmail) {
          throw new Error('Missing user email');
        }
        
        console.log('Checking for Stripe customer with email:', userEmail);
        
        // Check if user exists in Stripe using SDK
        const customers = await stripe.customers.list({ 
          email: userEmail,
          limit: 1 
        });
        
        if (customers.data && customers.data.length > 0) {
          const customerId = customers.data[0].id;
          console.log('Found Stripe customer ID for premium user:', customerId);
          
          // Create customer portal session using SDK
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
      
      // For trial period, use actual expiry date from profile
      let expiryDate = profile.subscription_expiry || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      let daysUntil = profile.subscription_expiry ? 
        Math.ceil((new Date(profile.subscription_expiry).getTime() - Date.now()) / (1000 * 3600 * 24)) : 
        3;
        
      return new Response(
        JSON.stringify({ 
          hasSubscription: true,
          subscriptionId: profile.subscription_id || 'trial',
          status: profile.subscription_status || 'active',
          currentPeriodEnd: expiryDate,
          daysUntilRenewal: daysUntil,
          cancelAtPeriodEnd: false,
          portalUrl: portalUrl,
          plan: isTrial ? 'Trial' : 'Pro',
          isTrial: isTrial,
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
          error: 'User does not have an active subscription',
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
        throw new Error('Missing Stripe API key or failed to initialize client');
      }
      
      // Get subscription details from Stripe using SDK
      const subscription = await stripe.subscriptions.retrieve(profile.subscription_id);
      
      if (!subscription) {
        throw new Error('Failed to fetch subscription data');
      }

      // Try to create Customer Portal session using Stripe SDK
      let portalUrl = null;
      
      if (subscription.customer) {
        try {
          console.log('Creating customer portal session for customer:', subscription.customer);
          
          // Create customer portal session using SDK
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

      // Format and return data
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
        isTrial: false,
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
      console.error('Error communicating with Stripe:', stripeError);
      
      // If user has premium status in profile, return basic information
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
      
      throw new Error('Error communicating with Stripe');
    }
  } catch (error) {
    console.error('Error fetching subscription data:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error fetching subscription data',
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
