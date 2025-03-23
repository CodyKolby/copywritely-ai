
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
    // Get Stripe secret key from environment
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not set in environment variables');
      throw new Error('Missing Stripe API key in server configuration');
    }

    // Verify Stripe key format
    if (!stripeSecretKey.startsWith('sk_')) {
      console.error('Invalid Stripe key format', { keyPrefix: stripeSecretKey.substring(0, 5) });
      throw new Error('Invalid Stripe key format');
    }
    
    // Log environment info for debugging
    const isTestMode = stripeSecretKey.startsWith('sk_test_');
    console.log(`Using Stripe in ${isTestMode ? 'TEST' : 'PRODUCTION'} mode`);
    
    // Parse and validate request data
    let requestData;
    try {
      requestData = await req.json();
      console.log('Request data received:', JSON.stringify(requestData));
    } catch (e) {
      console.error('Failed to parse request body:', e);
      throw new Error('Invalid request format');
    }
    
    // Extract and validate parameters
    const { priceId, customerEmail, successUrl, cancelUrl, origin } = requestData;

    if (!priceId) {
      console.error('Missing priceId in request');
      throw new Error('Missing priceId parameter');
    }

    // Log to debug valid price IDs
    console.log(`Received priceId: ${priceId}`);
    
    // Validate price ID format
    if (!priceId.startsWith('price_')) {
      console.error('Invalid price ID format:', priceId);
      throw new Error('Invalid price ID format - must start with "price_"');
    }

    // Validate that price ID format matches environment (test/live)
    const isPriceIdTestFormat = priceId.startsWith('price_');
    if (isTestMode && !isPriceIdTestFormat) {
      console.warn('TEST MODE WARNING: Price ID format may not be compatible with test mode');
    }
    
    if (!isTestMode && isPriceIdTestFormat) {
      console.warn('LIVE MODE WARNING: Using test format price ID in live environment');
    }

    // Upewnij się, że mamy pełny adres URL do przekierowania
    console.log('Origin from request:', origin);
    console.log('Raw success URL:', successUrl);
    console.log('Raw cancel URL:', cancelUrl);

    // Dodaj protokół, jeśli nie jest dołączony
    let baseUrl = origin;
    if (baseUrl && !baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`;
    }
    
    // Jeśli nie mamy origin, próbujemy pobrać z nagłówków
    if (!baseUrl) {
      baseUrl = req.headers.get('origin') || req.headers.get('referer') || '';
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
    }

    // Jeśli nadal nie mamy baseUrl, używamy domyślnych ścieżek
    console.log('Using base URL:', baseUrl || 'No base URL found');

    // Utwórz pełne URL-e dla przekierowań
    const finalSuccessUrl = successUrl && successUrl.startsWith('http') 
      ? successUrl 
      : `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
      
    const finalCancelUrl = cancelUrl && cancelUrl.startsWith('http') 
      ? cancelUrl 
      : `${baseUrl}/pricing?canceled=true`;

    console.log('Final success URL:', finalSuccessUrl);
    console.log('Final cancel URL:', finalCancelUrl);

    // Create Stripe session parameters
    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('success_url', finalSuccessUrl);
    params.append('cancel_url', finalCancelUrl);
    params.append('line_items[0][price]', priceId);
    params.append('line_items[0][quantity]', '1');
    params.append('subscription_data[trial_period_days]', '3');
    
    if (customerEmail) {
      params.append('customer_email', customerEmail);
    }

    console.log('Stripe API request parameters:', params.toString());
    console.log('Calling Stripe API at:', 'https://api.stripe.com/v1/checkout/sessions');

    // Call Stripe API
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    // Parse response
    const responseText = await response.text();
    console.log(`Stripe API response status: ${response.status}`);
    console.log(`Stripe API response body: ${responseText.substring(0, 200)}...`);
    
    let sessionData;
    try {
      sessionData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse Stripe response:', e);
      console.error('Raw response:', responseText);
      throw new Error('Invalid response from Stripe API');
    }

    // Handle Stripe API errors
    if (!response.ok) {
      console.error('Stripe API error:', sessionData.error || 'Unknown error');
      
      // Detect key environment mismatch
      if (sessionData.error?.message?.includes('test mode') && sessionData.error?.message?.includes('live mode')) {
        throw new Error(`Mode mismatch: ${sessionData.error?.message}`);
      }
      
      // Handle specific price ID errors
      if (sessionData.error?.message?.includes('price') || sessionData.error?.message?.includes('Price')) {
        throw new Error(`Price ID error: ${sessionData.error?.message}`);
      }
      
      throw new Error(sessionData.error?.message || 'Error creating Stripe checkout session');
    }

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
    console.error('Error in Stripe checkout function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred during checkout session creation',
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
