
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
    // Create Supabase client with service role for admin privileges
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { priceId, customerEmail, successUrl, cancelUrl } = await req.json();
    
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: 'Price ID is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('Creating checkout session with params:', {
      priceId,
      customerEmail: customerEmail ? 'Email provided' : 'No email',
      successUrl: successUrl ? 'Yes' : 'No',
      cancelUrl: cancelUrl ? 'Yes' : 'No'
    });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    // Create checkout session with configurations requiring payment method
    const sessionParams = {
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: 3,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel'
          }
        }
      },
      payment_method_collection: 'always', // Always require payment method
      allow_promotion_codes: true,
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      locale: 'pl'
    };

    // Add customer email if provided
    if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }
    
    console.log('Creating Stripe checkout session...');
    const session = await stripe.checkout.sessions.create(sessionParams);
    
    console.log('Checkout session created successfully:', {
      id: session.id,
      url: session.url ? 'Generated' : 'Missing'
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
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
