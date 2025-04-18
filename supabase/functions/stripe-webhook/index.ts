
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { stripe, constructWebhookEvent } from "./stripe.ts";
import { createDatabaseOperations } from "./database.ts";
import { handleCheckoutSessionCompleted, handleSubscriptionEvent } from "./subscription-handlers.ts";
import { WebhookHandlerResponse } from "./types.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS preflight request");
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  console.log(`Stripe webhook received: ${req.method} request`);
  
  if (req.method !== 'POST') {
    console.error(`Invalid method: ${req.method}`);
    return new Response(
      JSON.stringify({ error: `Method not allowed: ${req.method}` }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const rawBody = await req.text();
    console.log(`Raw body received, length: ${rawBody.length} chars`);
    
    if (rawBody.length === 0) {
      throw new Error("Empty request body");
    }
    
    const signature = req.headers.get('stripe-signature');
    console.log(`Signature header present: ${!!signature}`);
    
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    console.log(`Webhook secret configured: ${!!webhookSecret}`);
    
    const { event, verified } = await constructWebhookEvent(rawBody, signature, webhookSecret);
    console.log(`Event processed: type=${event.type}, verified=${verified}`);
    
    if (!event || !event.type || !event.data) {
      throw new Error("Missing required webhook data");
    }

    const db = createDatabaseOperations();
    
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutSessionCompleted(event.data.object, db);
        break;
      }
      
      // Handle all subscription-related events
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused':
      case 'customer.subscription.resumed':
      case 'customer.subscription.pending_update_applied':
      case 'customer.subscription.pending_update_expired':
      case 'customer.subscription.trial_will_end': {
        await handleSubscriptionEvent(event, stripe, db);
        break;
      }
      
      // Handle invoice events that affect subscription status
      case 'invoice.paid':
      case 'invoice.payment_failed':
      case 'invoice.payment_action_required': {
        await handleInvoiceEvent(event, stripe, db);
        break;
      }
      
      default:
        console.log(`Received unhandled event type: ${event.type}`);
    }
    
    const response: WebhookHandlerResponse = {
      received: true,
      type: event.type,
      verified
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Error processing webhook', 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleInvoiceEvent(event: any, stripe: any, db: any) {
  try {
    console.log(`Processing invoice event: ${event.type}`);
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;
    
    if (!subscriptionId) {
      console.log('No subscription ID in invoice, skipping');
      return;
    }
    
    // Get the subscription to update the user profile
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Find the profile by subscription ID
    const { data: profile } = await db.findProfileBySubscriptionId(subscriptionId);
    
    if (!profile) {
      console.log(`No profile found for subscription ${subscriptionId}`);
      return;
    }
    
    const userId = profile.id;
    
    // Handle subscriptions with scheduled cancellations differently
    let subscriptionStatus = subscription.status;
    let isPremium = subscription.status === 'active' || subscription.status === 'trialing';
    
    // If subscription is scheduled to be canceled at the end of billing period
    if (subscription.cancel_at_period_end) {
      subscriptionStatus = 'scheduled_cancel';
      console.log(`Invoice event: Setting status to 'scheduled_cancel' due to cancel_at_period_end=true`);
    }
    
    // If subscription is immediately canceled, set premium to false
    if (subscription.status === 'canceled' && !subscription.cancel_at_period_end) {
      isPremium = false;
    }
    
    // Handle expiry date based on subscription status
    let expiryDate = null;
    
    if (subscription.cancel_at_period_end && subscription.current_period_end) {
      // For scheduled cancellations, use period end
      expiryDate = new Date(subscription.current_period_end * 1000).toISOString();
      console.log(`Invoice event: Using current_period_end for scheduled cancellation: ${expiryDate}`);
    } else if (subscription.status === 'canceled' && !subscription.cancel_at_period_end) {
      // For immediate cancellations, use current time
      expiryDate = new Date().toISOString();
      console.log(`Invoice event: Immediate cancellation detected, setting expiry to current time: ${expiryDate}`);
    } else if (subscription.current_period_end) {
      // Otherwise use the period end date
      expiryDate = new Date(subscription.current_period_end * 1000).toISOString();
    }
      
    console.log(`Updating profile ${userId} based on invoice event. isPremium=${isPremium}, status=${subscriptionStatus}, expiryDate=${expiryDate}`);
    
    await db.updateProfile(userId, {
      is_premium: isPremium,
      subscription_status: subscriptionStatus,
      subscription_expiry: expiryDate,
      updated_at: new Date().toISOString()
    });
    
    console.log(`Profile updated successfully for invoice event`);
  } catch (error) {
    console.error('Error processing invoice event:', error);
  }
}
