
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

    // Parse request data - with improved error handling
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
    
    // Determine base URL with improved fallback logic
    let baseUrl = '';
    
    if (origin && origin.includes('://')) {
      baseUrl = origin;
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
    } else if (origin) {
      baseUrl = `https://${origin}`;
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
    } else {
      const referer = req.headers.get('referer');
      const originHeader = req.headers.get('origin');
      
      if (originHeader) {
        baseUrl = originHeader;
        if (baseUrl.endsWith('/')) {
          baseUrl = baseUrl.slice(0, -1);
        }
      } else if (referer) {
        const url = new URL(referer);
        baseUrl = `${url.protocol}//${url.host}`;
      } else {
        baseUrl = "https://copywrite-assist.com"; // Default fallback
      }
    }

    console.log('Using base URL for redirects:', baseUrl);

    // Format redirect URLs
    const finalSuccessUrl = successUrl && successUrl.startsWith('http') 
      ? successUrl 
      : successUrl && successUrl.startsWith('/') 
        ? `${baseUrl}${successUrl}` 
        : `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;

    const finalCancelUrl = cancelUrl && cancelUrl.startsWith('http') 
      ? cancelUrl 
      : cancelUrl && cancelUrl.startsWith('/') 
        ? `${baseUrl}${cancelUrl}` 
        : `${baseUrl}/pricing?canceled=true`;

    console.log('Final success URL:', finalSuccessUrl);
    console.log('Final cancel URL:', finalCancelUrl);

    // Create Stripe session parameters with minimal required fields
    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('success_url', finalSuccessUrl);
    params.append('cancel_url', finalCancelUrl);
    params.append('line_items[0][price]', priceId);
    params.append('line_items[0][quantity]', '1');
    // Optional free trial (can be removed if not needed)
    params.append('subscription_data[trial_period_days]', '3');
    
    if (customerEmail) {
      params.append('customer_email', customerEmail);
    }

    console.log('Calling Stripe API at:', 'https://api.stripe.com/v1/checkout/sessions');

    // Make the Stripe API call with retries
    let response;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params,
        });
        
        // If successful, break the retry loop
        if (response.ok) break;
        
        // If not successful but not last attempt
        if (attempt < maxRetries) {
          const errorText = await response.text();
          console.error(`Stripe API error (${response.status}) on attempt ${attempt}:`, errorText);
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, attempt)));
        }
      } catch (fetchError) {
        console.error(`Network error on attempt ${attempt}:`, fetchError);
        
        // If this is the last attempt, rethrow
        if (attempt === maxRetries) throw fetchError;
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, attempt)));
      }
    }
    
    // If we still don't have a response or it's not OK
    if (!response || !response.ok) {
      const errorText = response ? await response.text() : 'No response';
      console.error(`Stripe API error after ${maxRetries} attempts (${response?.status}):`, errorText);
      throw new Error(`Stripe API error: ${response?.status || 'Network error'}`);
    }

    // Parse response
    const sessionData = await response.json();
    
    const endTime = Date.now();
    console.log(`Stripe session created successfully in ${endTime - startTime}ms:`, {
      sessionId: sessionData.id,
      url: sessionData.url
    });

    // Return successful response with URL for client
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
