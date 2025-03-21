
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log stripe key availability for debugging
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    console.log(`Stripe key available: ${!!stripeSecretKey}`);
    
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not set in environment variables');
      throw new Error('Błąd konfiguracji: brak klucza API Stripe');
    }

    // Parse request body
    const requestData = await req.json().catch(e => {
      console.error('Failed to parse request JSON:', e);
      throw new Error('Invalid request format');
    });
    
    console.log('Request data received:', JSON.stringify(requestData, null, 2));
    
    // Extract parameters from request
    const { priceId, customerEmail, successUrl, cancelUrl } = requestData;

    // Validate required parameters
    if (!priceId) {
      console.error('Missing priceId in request');
      throw new Error('Brak identyfikatora cennika (priceId)');
    }

    // Debug info about the Stripe mode
    const isTestMode = stripeSecretKey.startsWith('sk_test');
    console.log(`Using Stripe in ${isTestMode ? 'TEST' : 'PRODUCTION'} mode`);
    console.log(`PriceId: ${priceId}`);
    console.log(`Customer email: ${customerEmail || 'not provided'}`);

    // Create checkout session parameters
    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('success_url', successUrl || `${req.headers.get('origin') || ''}/success?session_id={CHECKOUT_SESSION_ID}`);
    params.append('cancel_url', cancelUrl || `${req.headers.get('origin') || ''}/pricing`);
    params.append('line_items[0][price]', priceId);
    params.append('line_items[0][quantity]', '1');
    params.append('subscription_data[trial_period_days]', '3');
    
    if (customerEmail) {
      params.append('customer_email', customerEmail);
    }

    console.log('Stripe API request parameters:', params.toString());

    // Call Stripe API
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    // Get response as text first for better error logging
    const responseText = await response.text();
    console.log(`Stripe API response status: ${response.status} ${response.statusText}`);
    console.log(`Stripe API response body (first 500 chars): ${responseText.substring(0, 500)}`);

    // Try to parse the response as JSON
    let sessionData;
    try {
      sessionData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse Stripe response as JSON:', e);
      console.error('Raw response:', responseText);
      throw new Error('Invalid response from Stripe API');
    }

    // Check for Stripe API errors
    if (!response.ok) {
      console.error('Stripe API error:', {
        status: response.status,
        statusText: response.statusText,
        error: sessionData.error,
      });
      
      // Special handling for test/live mode mismatch
      if (sessionData.error?.message?.includes('test mode') && sessionData.error?.message?.includes('live mode')) {
        throw new Error('Test/Live mode mismatch: You are using a test mode price ID with a live mode API key or vice versa.');
      }
      
      throw new Error(sessionData.error?.message || 'Error creating Stripe checkout session');
    }

    // Log successful session creation
    console.log('Stripe session created successfully:', {
      sessionId: sessionData.id,
      url: sessionData.url
    });

    // Return successful response
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
    // Enhanced error logging
    console.error('Error in stripe-checkout function:', error);
    console.error('Error stack:', error.stack);
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred during checkout session creation',
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
