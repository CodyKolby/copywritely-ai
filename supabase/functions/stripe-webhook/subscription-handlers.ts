
import { DatabaseOperations } from './types.ts';
import Stripe from 'stripe';

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

  let expiryDate = subscription.current_period_end 
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  if (event.type === 'customer.subscription.deleted') {
    await handleSubscriptionDeletion(subscription, db);
    return;
  }

  const { data: profile } = await findProfileBySubscriptionId(subscription.id, db);
  
  if (!profile) {
    await handleSubscriptionWithoutProfile(subscription, expiryDate, db, event.type);
    return;
  }

  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  await db.updateProfile(profile.id, {
    is_premium: isActive,
    subscription_status: subscription.status,
    subscription_expiry: expiryDate,
    updated_at: new Date().toISOString()
  });
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

  const expiryDate = await calculateExpiryDate(session, subscriptionId);
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
  db: DatabaseOperations
) {
  const { data: profile } = await findProfileBySubscriptionId(subscription.id, db);
  if (!profile) {
    console.log('No user found with this subscription ID');
    return;
  }

  const cancellationTime = new Date().toISOString();
  await db.updateProfile(profile.id, {
    is_premium: false,
    subscription_status: 'canceled',
    subscription_expiry: cancellationTime,
    updated_at: cancellationTime
  });
}

async function findProfileBySubscriptionId(subscriptionId: string, db: DatabaseOperations) {
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
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
        apiVersion: '2023-10-16'
      });
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      if (subscription.current_period_end) {
        expiryDate = new Date(subscription.current_period_end * 1000).toISOString();
      }
    } catch (error) {
      console.error('Error getting subscription details:', error);
    }
  }

  if (!expiryDate) {
    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + 30);
    expiryDate = fallbackDate.toISOString();
  }

  return expiryDate;
}

async function updateUserProfile(
  userId: string,
  expiryDate: string,
  subscriptionId: string | null,
  db: DatabaseOperations
) {
  await db.updateProfile(userId, {
    is_premium: true,
    subscription_id: subscriptionId ?? undefined,
    subscription_status: 'active',
    subscription_expiry: expiryDate,
    subscription_created_at: new Date().toISOString(),
    trial_started_at: null,
    updated_at: new Date().toISOString()
  });
}

