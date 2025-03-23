
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Enhanced CORS headers with explicit method permissions
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Cache-Control': 'no-cache, no-store',
    'Content-Type': 'application/json'
  };

  console.log(`Netlify function: Received ${event.httpMethod} request to stripe-checkout`);
  console.log('Headers:', JSON.stringify(event.headers));
  console.log('Path:', event.path);
  console.log('Raw body length:', event.body ? event.body.length : 0);
  console.log('Body content type:', event.headers['content-type'] || 'Not specified');
  
  // Critical - handle OPTIONS preflight requests properly
  if (event.httpMethod === 'OPTIONS') {
    console.log('Netlify function: Handling OPTIONS preflight request');
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  // Allow both GET and POST for maximum compatibility
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    console.error(`Netlify function: Method ${event.httpMethod} not allowed`);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        error: 'Method Not Allowed', 
        method: event.httpMethod,
        allowedMethods: 'GET,POST,OPTIONS'
      })
    };
  }

  try {
    console.log(`Netlify function: Processing ${event.httpMethod} request`);
    
    // Parse request data - handle both GET and POST
    let requestData;
    
    if (event.httpMethod === 'POST') {
      if (!event.body) {
        console.error('Netlify function: No request body provided');
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing request body' })
        };
      }
      
      try {
        requestData = JSON.parse(event.body);
        console.log('Netlify function: Successfully parsed request body:', JSON.stringify(requestData));
      } catch (parseError) {
        console.error('Netlify function: Error parsing request body:', parseError);
        console.error('Netlify function: Raw body received:', event.body);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Invalid request format', 
            details: parseError.message,
            receivedContentType: event.headers['content-type'] || 'not specified'
          })
        };
      }
    } else if (event.httpMethod === 'GET') {
      // Handle GET requests by parsing query parameters
      requestData = event.queryStringParameters || {};
      console.log('Netlify function: Using query parameters:', requestData);
    }
    
    // Extract and validate parameters
    const { priceId, customerEmail, successUrl, cancelUrl, timestamp } = requestData;

    if (!priceId) {
      console.error('Netlify function: Missing priceId parameter');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing priceId parameter' })
      };
    }

    console.log('Netlify function: Using priceId:', priceId);
    console.log('Netlify function: Stripe API key available:', !!process.env.STRIPE_SECRET_KEY);

    // Create session parameters - use correct Stripe format
    const sessionParams = {
      payment_method_types: ['card'],
      mode: 'subscription',
      success_url: successUrl || 'https://copywrite-assist.com/success',
      cancel_url: cancelUrl || 'https://copywrite-assist.com/pricing?canceled=true',
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      subscription_data: {
        trial_period_days: 3
      }
    };
    
    // Add customer email if provided
    if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }
    
    console.log('Netlify function: Creating session with params:', JSON.stringify(sessionParams, null, 2));

    // Create session
    const session = await stripe.checkout.sessions.create(sessionParams);
    console.log('Netlify function: Session created successfully:', {
      id: session.id,
      url: session.url
    });

    // Return success with session URL
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      })
    };
    
  } catch (error) {
    console.error('Netlify function: Error creating checkout session:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'An error occurred during checkout session creation',
        timestamp: new Date().toISOString()
      })
    };
  }
};
