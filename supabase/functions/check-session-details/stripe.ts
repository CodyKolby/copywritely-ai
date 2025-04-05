
import Stripe from "https://esm.sh/stripe@12.1.1";
import { corsHeaders } from './utils.ts';

// Initialize Stripe with the API key from environment variables
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2022-11-15',
});

export async function getStripeSession(sessionId: string) {
  if (!sessionId) {
    return { error: { message: 'No session ID provided' } };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return { data: session };
  } catch (error) {
    console.error('Error retrieving Stripe session:', error);
    return { error };
  }
}

export async function getStripeSubscription(subscriptionId: string) {
  if (!subscriptionId) {
    return { error: { message: 'No subscription ID provided' } };
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return { data: subscription };
  } catch (error) {
    console.error('Error retrieving Stripe subscription:', error);
    return { error };
  }
}

export async function getSubscriptionDetails(subscriptionId: string) {
  const { data, error } = await getStripeSubscription(subscriptionId);
  
  if (error || !data) {
    return { error };
  }
  
  try {
    const subscription = data;
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
    const cancelAtPeriodEnd = subscription.cancel_at_period_end;
    const status = subscription.status;
    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;
    
    // Calculate days until renewal
    const now = new Date();
    const endDate = new Date(subscription.current_period_end * 1000);
    const daysUntilRenewal = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Determine plan type (monthly/annual)
    let plan = 'Pro';
    if (subscription.items.data[0]?.price.recurring?.interval === 'year') {
      plan = 'Pro (roczny)';
    } else if (subscription.items.data[0]?.price.recurring?.interval === 'month') {
      plan = 'Pro (miesięczny)';
    }
    
    return {
      data: {
        subscriptionId: subscription.id,
        status,
        currentPeriodEnd,
        daysUntilRenewal,
        cancelAtPeriodEnd,
        trialEnd,
        plan
      }
    };
  } catch (error) {
    console.error('Error processing subscription details:', error);
    return { error };
  }
}
