
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Set CORS headers with proper method list
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-cache, no-store',
    'Content-Type': 'application/json'
  };

  console.log(`Netlify function: Received ${event.httpMethod} request to stripe-checkout`);
  console.log('Headers:', JSON.stringify(event.headers));
  console.log('Body:', event.body ? 'Contains data' : 'Empty');
  console.log('Path:', event.path);

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    console.log('Netlify function: Handling OPTIONS request');
    return {
      statusCode: 204, // No content needed for OPTIONS
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.error(`Netlify function: Method ${event.httpMethod} not allowed`);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed', method: event.httpMethod })
    };
  }

  try {
    console.log('Netlify function: Processing POST request');
    console.log('Netlify function: Received request body:', event.body);
    
    // Parse request body
    let requestData;
    try {
      requestData = JSON.parse(event.body);
      console.log('Netlify function: Successfully parsed request body');
    } catch (parseError) {
      console.error('Netlify function: Error parsing request body:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid request format', details: parseError.message })
      };
    }
    
    const { priceId, customerEmail, successUrl, cancelUrl, timestamp } = requestData;

    console.log('Netlify function: Parsed data:', {
      priceId,
      customerEmail: customerEmail ? 'Email provided' : 'Not provided',
      successUrl,
      cancelUrl,
      timestamp: timestamp || 'Not provided'
    });

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
