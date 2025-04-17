
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import Stripe from "https://esm.sh/stripe@13.10.0";
import { corsHeaders } from '../shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Creating customer portal session');
    
    // Create Supabase admin client with service role for admin privileges
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('Getting user data for userId:', userId);
    
    // Get the user's email from the profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, subscription_id')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return new Response(
        JSON.stringify({ error: profileError?.message || 'User profile not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }
    
    const userEmail = profile.email;
    console.log('Found user email:', userEmail);
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    // Find or create customer
    let customerId;
    if (profile.subscription_id) {
      // If we have a subscription ID, get the customer ID from there
      try {
        const subscription = await stripe.subscriptions.retrieve(profile.subscription_id);
        customerId = subscription.customer as string;
        console.log('Found customer ID from subscription:', customerId);
      } catch (err) {
        console.error('Error retrieving subscription:', err);
        // Continue with email lookup
      }
    }
    
    if (!customerId) {
      // Find customer by email
      const customers = await stripe.customers.list({ 
        email: userEmail,
        limit: 1 
      });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log('Found customer by email:', customerId);
      } else {
        // Create new customer
        const newCustomer = await stripe.customers.create({ email: userEmail });
        customerId = newCustomer.id;
        console.log('Created new customer:', customerId);
      }
    }
    
    // Create return URL based on request origin or default
    const origin = req.headers.get('origin') || 'https://copywrite-assist.com';
    const returnUrl = `${origin}/`;
    
    console.log('Creating portal session with return URL:', returnUrl);
    
    try {
      // Create portal session with fallback for missing configuration
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      
      console.log('Portal session created with URL:', session.url);

      return new Response(
        JSON.stringify({ url: session.url }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (portalError) {
      console.error('Error creating portal session:', portalError);
      
      // Handle specific Stripe portal configuration error
      if (portalError.message && portalError.message.includes('configuration')) {
        // Provide alternate access - redirect to stripe dashboard for the customer
        const stripeCustomerDashboardUrl = `https://dashboard.stripe.com/test/customers/${customerId}`;
        
        return new Response(
          JSON.stringify({ 
            url: stripeCustomerDashboardUrl,
            isAlternate: true,
            message: 'Using alternate customer management URL due to missing portal configuration'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
      
      throw portalError;
    }
  } catch (error) {
    console.error('Error creating portal session:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
