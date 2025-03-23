
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
    console.log("Stripe secret key available:", !!stripeSecretKey);
    
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not set in environment variables');
      throw new Error('Missing Stripe API key in server configuration');
    }

    // Parse request data with improved error handling
    let requestData;
    try {
      requestData = await req.json();
      console.log('Request data received:', JSON.stringify({
        ...requestData,
        customerEmail: requestData.customerEmail ? 'Email provided' : 'No email',
        timestamp: requestData.timestamp || 'Not provided'
      }));
    } catch (e) {
      console.error('Failed to parse request body:', e);
      throw new Error('Invalid request format');
    }
    
    // Extract and validate parameters
    const { priceId, customerEmail, successUrl, cancelUrl, origin, timestamp } = requestData;

    if (!priceId) {
      console.error('Missing priceId in request');
      throw new Error('Missing priceId parameter');
    }
    
    console.log('Using priceId:', priceId);
    
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

    // Create Stripe session with correct parameters
    try {
      console.log('Creating Stripe checkout session...');
      
      // Create form parameters with the correct Stripe format
      const formData = new URLSearchParams();
      formData.append('payment_method_types[]', 'card');
      formData.append('mode', 'subscription');
      formData.append('success_url', finalSuccessUrl);
      formData.append('cancel_url', finalCancelUrl);
      formData.append('line_items[0][price]', priceId);
      formData.append('line_items[0][quantity]', '1');
      formData.append('allow_promotion_codes', 'true');
      formData.append('billing_address_collection', 'auto');
      formData.append('subscription_data[trial_period_days]', '3');
      
      // Add customer email if provided
      if (customerEmail) {
        formData.append('customer_email', customerEmail);
      }
      
      console.log('Stripe API request parameters:', Object.fromEntries(formData.entries()));
      console.log('Sending request to Stripe API...');
      
      // Call Stripe API directly with form parameters
      const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Stripe-Version': '2023-10-16',
        },
        body: formData.toString()
      });

      const responseText = await response.text();
      console.log(`Stripe API response status: ${response.status}`);
      console.log('Stripe API raw response:', responseText);

      if (!response.ok) {
        console.error(`Stripe API error (${response.status}):`, responseText);
        throw new Error(`Stripe API error (${response.status}): ${responseText}`);
      }

      const sessionData = JSON.parse(responseText);
      
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
            'Content-Type': 'application/json',
          } 
        }
      );
    } catch (stripeError) {
      console.error('Error calling Stripe API:', stripeError);
      throw new Error(`Stripe API error: ${stripeError.message}`);
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
          'Content-Type': 'application/json',
        } 
      }
    );
  }
});
