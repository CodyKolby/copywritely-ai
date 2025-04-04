
// Function to get stripe session by ID
export async function getStripeSession(sessionId: string, stripeSecretKey: string) {
  try {
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stripe API error: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error in getStripeSession:", error);
    throw error;
  }
}

// Function to get a subscription details from Stripe
export async function getStripeSubscription(subscriptionId: string, stripeSecretKey: string) {
  try {
    const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stripe API error: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error in getStripeSubscription:", error);
    throw error;
  }
}

// Get subscription details and format them for our application
export async function getSubscriptionDetails(session: any, stripeSecretKey: string) {
  // If the session doesn't have a subscription field, return a default error response
  if (!session.subscription) {
    return {
      subscriptionId: null,
      subscriptionStatus: null,
      subscriptionExpiry: null,
      error: 'No subscription found in session'
    };
  }
  
  try {
    // Get the subscription details from Stripe
    const subscription = await getStripeSubscription(
      session.subscription,
      stripeSecretKey
    );
    
    // Format the subscription expiry date
    const subscriptionExpiry = subscription.current_period_end 
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;
    
    return {
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionExpiry
    };
  } catch (error) {
    console.error("Error getting subscription details:", error);
    return {
      subscriptionId: session.subscription,
      subscriptionStatus: 'error',
      subscriptionExpiry: null,
      error: 'Failed to fetch subscription details'
    };
  }
}
