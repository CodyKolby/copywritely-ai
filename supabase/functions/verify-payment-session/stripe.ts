// Function to fetch Stripe session
export async function getStripeSession(sessionId: string, stripeSecretKey: string) {
  try {
    console.log(`Fetching Stripe session: ${sessionId}`);
    
    // Try to fetch the session up to 3 times with exponential backoff
    let attempt = 0;
    const maxAttempts = 3;
    let lastError: any = null;
    
    while (attempt < maxAttempts) {
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
          console.error(`Stripe API error response (attempt ${attempt + 1}/${maxAttempts}):`, errorText);
          lastError = new Error('Error fetching Stripe session: ' + errorText);
          
          // If we get a 404, no need to retry
          if (response.status === 404) {
            throw lastError;
          }
          
          // Otherwise, wait and retry
          attempt++;
          if (attempt < maxAttempts) {
            const backoffMs = Math.pow(2, attempt) * 500; // Exponential backoff: 1s, 2s, 4s
            console.log(`Retrying after ${backoffMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            continue;
          } else {
            throw lastError;
          }
        }
        
        const session = await response.json();
        console.log('Stripe session data received:', {
          id: session.id,
          payment_status: session.payment_status,
          subscription: session.subscription ? 'Yes' : 'No',
          customer: session.customer ? 'Yes' : 'No'
        });
        
        return session;
      } catch (error) {
        console.error(`Error in attempt ${attempt + 1}/${maxAttempts}:`, error);
        lastError = error;
        attempt++;
        
        // If last attempt, rethrow
        if (attempt >= maxAttempts) {
          throw error;
        }
        
        // Otherwise wait and retry
        const backoffMs = Math.pow(2, attempt) * 500;
        console.log(`Retrying after ${backoffMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
    
    // This should never happen due to the loop structure, but TypeScript wants a return
    throw lastError || new Error('Failed to fetch Stripe session after retries');
    
  } catch (error) {
    console.error('Error fetching Stripe session:', error);
    throw error;
  }
}

// Function to fetch Stripe subscription
export async function getStripeSubscription(subscriptionId: string, stripeSecretKey: string) {
  try {
    console.log(`Fetching Stripe subscription: ${subscriptionId}`);
    
    const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stripe API error response:', errorText);
      throw new Error('Error fetching Stripe subscription: ' + errorText);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Stripe subscription:', error);
    throw error;
  }
}

// Get subscription details from Stripe
export async function getSubscriptionDetails(session: any, stripeSecretKey: string) {
  try {
    const subscriptionId = session.subscription;
    
    if (!subscriptionId) {
      console.log('No subscription ID in session');
      return { 
        subscriptionId: null, 
        subscriptionStatus: 'inactive', 
        subscriptionExpiry: null 
      };
    }
    
    console.log(`Getting details for subscription: ${subscriptionId}`);
    const subscription = await getStripeSubscription(subscriptionId, stripeSecretKey);
    
    // Determine subscription status
    const subscriptionStatus = 
      (subscription.status === 'active' || subscription.status === 'trialing') 
        ? 'active' 
        : 'inactive';
        
    // Convert UNIX timestamp to ISO string
    let subscriptionExpiry = null;
    if (subscription.current_period_end) {
      subscriptionExpiry = new Date(subscription.current_period_end * 1000).toISOString();
      console.log('Subscription details:', {
        status: subscriptionStatus,
        expiry: subscriptionExpiry
      });
    }
    
    return { subscriptionId, subscriptionStatus, subscriptionExpiry };
  } catch (error) {
    console.error('Error getting subscription details:', error);
    // Return basic info even if there's an error
    return { 
      subscriptionId: session.subscription || null, 
      subscriptionStatus: 'unknown', 
      subscriptionExpiry: null 
    };
  }
}
