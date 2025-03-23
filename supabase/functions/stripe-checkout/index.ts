
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("Stripe checkout function called");
  const startTime = Date.now();
  
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
    
    // Parse and validate request data - with improved error handling
    let requestData;
    try {
      requestData = await req.json();
      console.log('Request data received:', JSON.stringify({
        ...requestData,
        customerEmail: requestData.customerEmail ? 'Email provided' : 'No email',
      }));
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

    // Ensure we have full URLs for redirection
    console.log('Origin from request:', origin);
    console.log('Raw success URL:', successUrl);
    console.log('Raw cancel URL:', cancelUrl);

    // Determine base URL with improved fallback logic
    let baseUrl = '';
    
    if (origin && origin.includes('://')) {
      // If origin contains protocol, use it directly
      baseUrl = origin;
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
    } else if (origin) {
      // If origin doesn't contain protocol, add https://
      baseUrl = `https://${origin}`;
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
    } else {
      // If we don't have origin, try to get from headers
      const referer = req.headers.get('referer');
      const originHeader = req.headers.get('origin');
      
      if (originHeader) {
        baseUrl = originHeader;
        if (baseUrl.endsWith('/')) {
          baseUrl = baseUrl.slice(0, -1);
        }
      } else if (referer) {
        // Z referer musimy wyciąć ścieżkę i zostawić tylko początek URL
        const url = new URL(referer);
        baseUrl = `${url.protocol}//${url.host}`;
      } else {
        // If all else fails, use default URL (for local testing)
        baseUrl = "https://copywrite-assist.com";
        console.warn("No origin or referer found, using hardcoded fallback URL:", baseUrl);
      }
    }

    console.log('Using base URL for redirects:', baseUrl);

    // Validate and format redirect URLs
    let finalSuccessUrl: string;
    let finalCancelUrl: string;

    // Format success URL
    if (successUrl && successUrl.startsWith('http')) {
      finalSuccessUrl = successUrl;
    } else if (successUrl && successUrl.startsWith('/')) {
      finalSuccessUrl = `${baseUrl}${successUrl}`;
    } else {
      finalSuccessUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
    }

    // Format cancel URL
    if (cancelUrl && cancelUrl.startsWith('http')) {
      finalCancelUrl = cancelUrl;
    } else if (cancelUrl && cancelUrl.startsWith('/')) {
      finalCancelUrl = `${baseUrl}${cancelUrl}`;
    } else {
      finalCancelUrl = `${baseUrl}/pricing?canceled=true`;
    }

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

    // Set even shorter timeout for fetch to prevent hanging (3 seconds instead of 5)
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      console.error('Stripe API request timed out after 3 seconds');
    }, 3000);

    try {
      // Call Stripe API with timeout
      const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
        signal: controller.signal
      });
      
      clearTimeout(timeout);

      // Parse response with improved error handling
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

      // Handle Stripe API errors with improved error messages
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

      const endTime = Date.now();
      console.log(`Stripe session created successfully in ${endTime - startTime}ms:`, {
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
    } catch (fetchError) {
      clearTimeout(timeout);
      if (fetchError.name === 'AbortError') {
        throw new Error('Stripe API request timed out');
      }
      throw fetchError;
    }
  } catch (error) {
    const endTime = Date.now();
    console.error(`Error in Stripe checkout function after ${endTime - startTime}ms:`, error);
    
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
