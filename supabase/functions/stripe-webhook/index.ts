
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
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await handleSubscriptionEvent(event, stripe, db);
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

