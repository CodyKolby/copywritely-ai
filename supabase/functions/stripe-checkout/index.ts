
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
    // Print environment for debugging
    console.log("Function executed in environment:", Deno.env.get("SUPABASE_ENV") || "unknown");
    
    // Detailed logging of Stripe key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    console.log(`Stripe key available: ${!!stripeSecretKey}`);
    if (stripeSecretKey) {
      console.log(`Stripe key type: ${stripeSecretKey.startsWith('sk_test_') ? 'TEST' : 'LIVE'}`);
      console.log(`Stripe key prefix: ${stripeSecretKey.substring(0, 10)}...`);
    } else {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    
    // Parse and validate request data
    let requestData;
    try {
      const requestText = await req.text();
      console.log(`Raw request body: ${requestText.substring(0, 200)}${requestText.length > 200 ? '...' : ''}`);
      
      try {
        requestData = JSON.parse(requestText);
      } catch (parseError) {
        console.error('Failed to parse request as JSON:', parseError);
        throw new Error('Invalid request format: not valid JSON');
      }
    } catch (e) {
      console.error('Failed to read request body:', e);
      throw new Error('Unable to read request body');
    }
    
    console.log('Request data received:', JSON.stringify(requestData, null, 2));
    
    // Extract and validate parameters
    const { priceId, customerEmail, successUrl, cancelUrl } = requestData;

    if (!priceId) {
      console.error('Missing priceId in request');
      throw new Error('Missing priceId parameter');
    }

    // Detailed environment and price ID validation
    const isTestMode = stripeSecretKey.startsWith('sk_test_');
    console.log(`Using Stripe in ${isTestMode ? 'TEST' : 'PRODUCTION'} mode`);
    console.log(`Received priceId: ${priceId}`);
    
    // Check if price ID format matches environment
    const isPriceIdTestFormat = priceId.startsWith('price_');
    if (isTestMode && !isPriceIdTestFormat) {
      console.warn('TEST MODE WARNING: Price ID does not have expected test mode format');
    }
    
    if (!isTestMode && isPriceIdTestFormat) {
      console.warn('LIVE MODE WARNING: Price ID has test mode format in live environment');
    }

    // Create Stripe session parameters
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

    // Call Stripe API with detailed logging
    console.log(`Making Stripe API request to: https://api.stripe.com/v1/checkout/sessions`);
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    // Log response details
    console.log(`Stripe API response status: ${response.status} ${response.statusText}`);
    const responseText = await response.text();
    console.log(`Stripe API response body (first 500 chars): ${responseText.substring(0, 500)}`);

    // Parse response JSON
    let sessionData;
    try {
      sessionData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse Stripe response as JSON:', e);
      console.error('Raw response:', responseText);
      throw new Error('Invalid response from Stripe API');
    }

    // Handle Stripe API errors with specific error detection
    if (!response.ok) {
      console.error('Stripe API error details:', sessionData.error || 'No detailed error from Stripe');
      
      // Detect key environment mismatch
      if (sessionData.error?.message?.includes('test mode') && sessionData.error?.message?.includes('live mode')) {
        console.error('TEST/LIVE MODE MISMATCH DETECTED');
        throw new Error(`Mode mismatch: ${sessionData.error?.message}`);
      }
      
      // Handle specific price ID errors
      if (sessionData.error?.message?.includes('price') || sessionData.error?.message?.includes('Price')) {
        console.error('PRICE ID ERROR:', sessionData.error?.message);
        throw new Error(`Price ID error: ${sessionData.error?.message}`);
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
    // Detailed error logging
    console.error('********** ERROR IN STRIPE CHECKOUT FUNCTION **********');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('*******************************************************');
    
    // Return formatted error response
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred during checkout session creation',
        details: error.stack,
        timestamp: new Date().toISOString()
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
