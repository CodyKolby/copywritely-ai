
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Enhanced CORS headers with explicit method permissions
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-cache, no-store',
    'Content-Type': 'application/json'
  };

  console.log(`Netlify function: Received ${event.httpMethod} request to stripe-checkout`);
  console.log('Headers:', JSON.stringify(event.headers));
  console.log('Path:', event.path);
  console.log('HTTP method:', event.httpMethod);
  
  // Critical - handle OPTIONS preflight requests properly
  if (event.httpMethod === 'OPTIONS') {
    console.log('Netlify function: Handling OPTIONS preflight request');
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  // Only allow POST requests - be very explicit
  if (event.httpMethod !== 'POST') {
    console.error(`Netlify function: Method ${event.httpMethod} not allowed`);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        error: 'Method Not Allowed', 
        method: event.httpMethod,
        allowedMethod: 'POST'
      })
    };
  }

  try {
    console.log('Netlify function: Processing POST request');
    
    // Check for body content
    if (!event.body) {
      console.error('Netlify function: No request body provided');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing request body' })
      };
    }
    
    console.log('Netlify function: Request body length:', event.body.length);
    
    // Parse request body with detailed logging
    let requestData;
    try {
      requestData = JSON.parse(event.body);
      console.log('Netlify function: Successfully parsed request body');
      console.log('Netlify function: Parsed data:', JSON.stringify(requestData));
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
    
    const { priceId, customerEmail, successUrl, cancelUrl, timestamp } = requestData;

    if (!priceId) {
      console.error('Netlify function: Missing priceId parameter');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing priceId parameter' })
      };
    }

    // Create session parameters
    const sessionParams = {
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      subscription_data: {
        trial_period_days: 3
      }
    };
    
    // Add customer email if provided
    if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }
    
    console.log('Netlify function: Creating session with params:', JSON.stringify(sessionParams));

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
