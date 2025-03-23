
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-cache, no-store'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    console.log('Netlify function: Received request body:', event.body);
    
    // Parse request body
    const requestData = JSON.parse(event.body);
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
