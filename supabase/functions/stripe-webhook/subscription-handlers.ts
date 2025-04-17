import { DatabaseOperations } from './types.ts';
import Stripe from 'https://esm.sh/stripe@12.1.1';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  db: DatabaseOperations
) {
  console.log(`Processing checkout.session.completed for session ${session.id}`);
  
  const userId = session.metadata?.userId || session.client_reference_id;
  const customerEmail = session.customer_details?.email || session.customer_email;
  const subscriptionId = session.subscription;

  if (session.payment_status === 'paid') {
    if (userId) {
      await handlePaidSessionWithUserId(session, userId, customerEmail, subscriptionId, db);
    } else if (customerEmail) {
      await handlePaidSessionWithEmail(session, customerEmail, subscriptionId, db);
    } else {
      console.log('No user ID or email found in session');
      await db.storeUnprocessedPayment(session.id, session);
    }
  } else {
    console.log(`Session ${session.id} not paid, status: ${session.payment_status}`);
  }
}

export async function handleSubscriptionEvent(
  event: Stripe.Event,
  stripe: Stripe,
  db: DatabaseOperations
) {
  const subscription = event.data.object as Stripe.Subscription;
  console.log(`Processing ${event.type} for subscription ${subscription.id}`);

  // Handle subscription deletion and cancellation
  if (event.type === 'customer.subscription.deleted') {
    console.log('Handling subscription deletion with details:', {
      status: subscription.status,
      cancelAt: subscription.cancel_at,
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    });
    
    // For immediate cancellations, explicitly set expiry to current time
    const expiryDate = !subscription.cancel_at_period_end ? 
      new Date().toISOString() : 
      subscription.current_period_end ? 
        new Date(subscription.current_period_end * 1000).toISOString() : 
        new Date().toISOString();
    
    console.log(`Setting cancellation expiry date to: ${expiryDate}`);
    
    await handleSubscriptionDeletion(subscription, db, expiryDate);
    return;
  }

  // Find profile by subscription ID
  const { data: profile } = await findProfileBySubscriptionId(subscription.id, db);
  
  if (!profile) {
    await handleSubscriptionWithoutProfile(subscription, 
      subscription.current_period_end ? 
        new Date(subscription.current_period_end * 1000).toISOString() : null, 
      db, event.type);
    return;
  }

  // Determine premium status based on subscription status
  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  
  let expiryDate = subscription.current_period_end ? 
    new Date(subscription.current_period_end * 1000).toISOString() : null;
  
  // If cancelled and not at period end, set expiry to now
  if (subscription.status === 'canceled' && !subscription.cancel_at_period_end) {
    expiryDate = new Date().toISOString();
    console.log(`Immediate cancellation detected, setting expiry to current time: ${expiryDate}`);
  }
  
  console.log(`Updating profile for subscription ${subscription.id}, status=${subscription.status}, isActive=${isActive}, expiryDate=${expiryDate}`);
  
  await db.updateProfile(profile.id, {
    is_premium: isActive,
    subscription_status: subscription.status,
    subscription_expiry: expiryDate,
    updated_at: new Date().toISOString()
  });
  
  console.log(`Profile updated successfully for subscription event`);
}

async function handlePaidSessionWithUserId(
  session: Stripe.Checkout.Session,
  userId: string,
  customerEmail: string | undefined,
  subscriptionId: string | null,
  db: DatabaseOperations
) {
  await db.logPayment({
    userId,
    sessionId: session.id,
    subscriptionId: subscriptionId ?? undefined,
    customer: session.customer?.toString(),
    customerEmail
  });

  console.log(`Calculating expiry date for user ${userId} with subscription ${subscriptionId}`);
  const expiryDate = await calculateExpiryDate(session, subscriptionId);
  console.log(`Got expiry date: ${expiryDate}`);
  
  await updateUserProfile(userId, expiryDate, subscriptionId, db);
}

async function handlePaidSessionWithEmail(
  session: Stripe.Checkout.Session,
  customerEmail: string,
  subscriptionId: string | null,
  db: DatabaseOperations
) {
  const user = await db.findUserByEmail(customerEmail);
  if (!user) {
    console.log('No user found with email:', customerEmail);
    await db.storeUnprocessedPayment(session.id, session);
    return;
  }

  await handlePaidSessionWithUserId(session, user.id, customerEmail, subscriptionId, db);
}

async function handleSubscriptionDeletion(
  subscription: Stripe.Subscription,
  db: DatabaseOperations,
  expiryDate: string
) {
  const { data: profile } = await findProfileBySubscriptionId(subscription.id, db);
  if (!profile) {
    console.log('No user found with this subscription ID');
    return;
  }

  console.log(`Setting subscription_expiry for user ${profile.id} to: ${expiryDate}`);
  
  await db.updateProfile(profile.id, {
    is_premium: false,
    subscription_status: 'canceled',
    subscription_expiry: expiryDate,
    updated_at: new Date().toISOString()
  });
  
  console.log(`Successfully updated user ${profile.id} as canceled with expiry: ${expiryDate}`);
}

export async function findProfileBySubscriptionId(subscriptionId: string, db: DatabaseOperations) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );

  return await supabase
    .from('profiles')
    .select('id')
    .eq('subscription_id', subscriptionId)
    .maybeSingle();
}

async function calculateExpiryDate(
  session: Stripe.Checkout.Session,
  subscriptionId: string | null
): Promise<string> {
  let expiryDate = null;
  
  if (session.mode === 'subscription' && subscriptionId) {
    try {
      console.log(`Retrieving subscription details for ${subscriptionId}`);
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
        apiVersion: '2023-10-16'
      });
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      if (subscription.current_period_end) {
        expiryDate = new Date(subscription.current_period_end * 1000).toISOString();
        console.log(`Retrieved expiry date from subscription: ${expiryDate}`);
      }
    } catch (error) {
      console.error('Error getting subscription details:', error);
    }
  }

  if (!expiryDate) {
    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + 30);
    expiryDate = fallbackDate.toISOString();
    console.log(`Using fallback expiry date: ${expiryDate}`);
  }

  return expiryDate;
}

async function updateUserProfile(
  userId: string,
  expiryDate: string,
  subscriptionId: string | null,
  db: DatabaseOperations
) {
  console.log(`Updating profile for user ${userId} with subscription ${subscriptionId} and expiry ${expiryDate}`);
  
  const updateData = {
    is_premium: true,
    subscription_id: subscriptionId ?? undefined,
    subscription_status: 'active',
    subscription_expiry: expiryDate,
    subscription_created_at: new Date().toISOString(),
    trial_started_at: null,
    updated_at: new Date().toISOString()
  };
  
  try {
    await db.updateProfile(userId, updateData);
    console.log(`Successfully updated profile for user ${userId}`);
  } catch (error) {
    console.error(`Error updating profile for user ${userId}:`, error);
  }
}

async function handleSubscriptionWithoutProfile(
  subscription: Stripe.Subscription,
  expiryDate: string | null,
  db: DatabaseOperations,
  eventType: string
) {
  try {
    console.log(`Trying to find profile for subscription ${subscription.id}`);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
    
    if (subscription.customer) {
      console.log(`Looking up customer: ${subscription.customer}`);
      const customerId = typeof subscription.customer === 'string' 
        ? subscription.customer 
        : subscription.customer.id;
      
      // Try to find profile using payment logs
      const { data: logs } = await supabase
        .from('payment_logs')
        .select('user_id, customer_email')
        .eq('customer', customerId)
        .order('timestamp', { ascending: false })
        .limit(1);
      
      if (logs && logs.length > 0 && logs[0].user_id) {
        console.log(`Found user_id ${logs[0].user_id} in payment logs for customer ${customerId}`);
        const userId = logs[0].user_id;
        
        await db.updateProfile(userId, {
          is_premium: subscription.status === 'active' || subscription.status === 'trialing',
          subscription_id: subscription.id,
          subscription_status: subscription.status,
          subscription_expiry: expiryDate || undefined,
          updated_at: new Date().toISOString()
        });
        
        console.log(`Updated profile for user ${userId} with subscription ${subscription.id}`);
        return;
      }
      
      // Try to find by customer email if available
      if (subscription.metadata?.email) {
        const { data: userByEmail } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', subscription.metadata.email)
          .maybeSingle();
          
        if (userByEmail) {
          console.log(`Found profile by email ${subscription.metadata.email}`);
          await db.updateProfile(userByEmail.id, {
            is_premium: subscription.status === 'active' || subscription.status === 'trialing',
            subscription_id: subscription.id,
            subscription_status: subscription.status,
            subscription_expiry: expiryDate || undefined,
            updated_at: new Date().toISOString()
          });
          return;
        }
      }
    }
    
    console.log(`Could not find profile for subscription ${subscription.id} on ${eventType} event`);
  } catch (error) {
    console.error('Error handling subscription without profile:', error);
  }
}
