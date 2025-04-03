
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { stripe, constructWebhookEvent } from "./stripe.ts";
import { getSupabaseAdmin } from "./db.ts";

// More comprehensive CORS headers to ensure they're respected by clients
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS preflight request");
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  console.log(`Stripe webhook received: ${req.method} request`);
  
  // Only accept POST requests for actual webhook events
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
  
  let event;
  let verified = false;
  
  try {
    // Get the raw request body as a string for signature verification
    const rawBody = await req.text();
    console.log(`Raw body received, length: ${rawBody.length} chars`);
    
    if (rawBody.length === 0) {
      throw new Error("Empty request body");
    }
    
    // Get the signature from headers
    const signature = req.headers.get('stripe-signature');
    console.log(`Signature header present: ${!!signature}`);
    
    // Get the webhook secret from environment variables
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    console.log(`Webhook secret configured: ${!!webhookSecret}`);
    
    // Attempt to construct and verify the event
    try {
      const result = await constructWebhookEvent(rawBody, signature, webhookSecret);
      event = result.event;
      verified = result.verified;
      
      console.log(`Event processed: type=${event.type}, verified=${verified}`);
    } catch (eventError) {
      console.error("Failed to process webhook event:", eventError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid webhook payload',
          details: eventError.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Validate minimum required event data
    if (!event || !event.type || !event.data) {
      throw new Error("Missing required webhook data");
    }
    
    // Handle based on event type
    const supabase = getSupabaseAdmin();
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log(`Processing checkout.session.completed for session ${session.id}`);
        console.log(`Payment status: ${session.payment_status}`);
        console.log(`Session mode: ${session.mode}`);
        
        // Extract user ID and subscription data
        const userId = session.metadata?.userId;
        const customerEmail = session.customer_details?.email || session.customer_email;
        const subscriptionId = session.subscription;
        
        console.log(`User ID from metadata: ${userId || 'not found'}`);
        console.log(`Customer email: ${customerEmail || 'not found'}`);
        console.log(`Subscription ID: ${subscriptionId || 'not found'}`);
        
        // Only process paid sessions
        if (session.payment_status === 'paid') {
          // If we have a user ID, update the user's profile directly
          if (userId) {
            console.log(`Updating profile for user ${userId}`);
            
            // First log the payment
            try {
              const { error: logError } = await supabase
                .from('payment_logs')
                .insert({
                  user_id: userId,
                  session_id: session.id,
                  subscription_id: subscriptionId,
                  customer: session.customer,
                  customer_email: customerEmail,
                  timestamp: new Date().toISOString()
                });
                
              if (logError) {
                console.error('Error logging payment:', logError);
              } else {
                console.log('Payment logged successfully');
              }
            } catch (insertError) {
              console.error('Exception logging payment:', insertError);
            }
            
            // Then update the user's premium status
            try {
              const { error: updateError } = await supabase
                .from('profiles')
                .update({
                  is_premium: true,
                  subscription_id: subscriptionId,
                  updated_at: new Date().toISOString()
                })
                .eq('id', userId);
                
              if (updateError) {
                console.error('Error updating profile:', updateError);
              } else {
                console.log('Profile updated with premium status');
              }
            } catch (updateError) {
              console.error('Exception updating profile:', updateError);
            }
          } 
          // If no user ID but we have an email, try to find the user
          else if (customerEmail) {
            console.log(`Looking for user with email ${customerEmail}`);
            
            try {
              const { data: user, error: userError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', customerEmail)
                .maybeSingle();
                
              if (userError) {
                console.error('Error finding user by email:', userError);
              } else if (user) {
                console.log(`Found user ${user.id} by email`);
                
                // Log the payment
                const { error: logError } = await supabase
                  .from('payment_logs')
                  .insert({
                    user_id: user.id,
                    session_id: session.id,
                    subscription_id: subscriptionId,
                    customer: session.customer,
                    customer_email: customerEmail,
                    timestamp: new Date().toISOString()
                  });
                  
                if (logError) {
                  console.error('Error logging payment:', logError);
                } else {
                  console.log('Payment logged successfully');
                }
                
                // Update the user's premium status
                const { error: updateError } = await supabase
                  .from('profiles')
                  .update({
                    is_premium: true,
                    subscription_id: subscriptionId,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', user.id);
                  
                if (updateError) {
                  console.error('Error updating profile:', updateError);
                } else {
                  console.log('Profile updated with premium status');
                }
              } else {
                console.log('No user found with email:', customerEmail);
                
                // Store unprocessed payment
                const { error: unprocessedError } = await supabase
                  .from('unprocessed_payments')
                  .insert({
                    session_id: session.id,
                    session_data: session,
                    processed: false,
                    timestamp: new Date().toISOString()
                  });
                  
                if (unprocessedError) {
                  console.error('Error storing unprocessed payment:', unprocessedError);
                } else {
                  console.log('Unprocessed payment stored successfully');
                }
              }
            } catch (error) {
              console.error('Exception finding user by email:', error);
            }
          } else {
            console.log('No user ID or email found in session');
            
            // Store unprocessed payment
            try {
              const { error: unprocessedError } = await supabase
                .from('unprocessed_payments')
                .insert({
                  session_id: session.id,
                  session_data: session,
                  processed: false,
                  timestamp: new Date().toISOString()
                });
                
              if (unprocessedError) {
                console.error('Error storing unprocessed payment:', unprocessedError);
              } else {
                console.log('Unprocessed payment stored successfully');
              }
            } catch (error) {
              console.error('Exception storing unprocessed payment:', error);
            }
          }
        } else {
          console.log(`Session ${session.id} not paid, status: ${session.payment_status}`);
        }
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log(`Processing ${event.type} for subscription ${subscription.id}`);
        console.log(`Status: ${subscription.status}`);
        
        // Get expiry date if available
        const subscriptionExpiry = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;
        
        // Look up user by subscription ID or customer ID
        try {
          // First try by subscription ID
          let { data: profile, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('subscription_id', subscription.id)
            .maybeSingle();
            
          if (error) {
            console.error('Error finding user by subscription ID:', error);
          }
          
          // If not found by subscription ID, try payment logs
          if (!profile) {
            console.log('User not found by subscription ID, checking payment logs');
            
            const { data: paymentLog, error: logError } = await supabase
              .from('payment_logs')
              .select('user_id')
              .eq('subscription_id', subscription.id)
              .maybeSingle();
              
            if (logError) {
              console.error('Error checking payment logs:', logError);
            } else if (paymentLog) {
              console.log(`Found user ${paymentLog.user_id} in payment logs`);
              
              // Update the profile with subscription status
              const isActive = 
                subscription.status === 'active' || 
                subscription.status === 'trialing';
                
              const { error: updateError } = await supabase
                .from('profiles')
                .update({
                  is_premium: isActive,
                  subscription_id: subscription.id,
                  subscription_status: subscription.status,
                  subscription_expiry: subscriptionExpiry,
                  updated_at: new Date().toISOString()
                })
                .eq('id', paymentLog.user_id);
                
              if (updateError) {
                console.error('Error updating profile with subscription:', updateError);
              } else {
                console.log('Profile updated with subscription status');
              }
            } else {
              console.log('No user found for subscription in payment logs');
            }
          } else {
            console.log(`Found user ${profile.id} by subscription ID`);
            
            // Update the profile with subscription status
            const isActive = 
              subscription.status === 'active' || 
              subscription.status === 'trialing';
              
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                is_premium: isActive,
                subscription_status: subscription.status,
                subscription_expiry: subscriptionExpiry,
                updated_at: new Date().toISOString()
              })
              .eq('id', profile.id);
              
            if (updateError) {
              console.error('Error updating profile with subscription:', updateError);
            } else {
              console.log('Profile updated with subscription status');
            }
          }
        } catch (error) {
          console.error('Exception processing subscription event:', error);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log(`Processing subscription deletion: ${subscription.id}`);
        
        try {
          // Find user by subscription ID
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('subscription_id', subscription.id)
            .maybeSingle();
            
          if (error) {
            console.error('Error finding user by subscription ID:', error);
          } else if (profile) {
            console.log(`Found user ${profile.id} for deleted subscription`);
            
            // Update the profile - remove premium status
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                is_premium: false,
                subscription_status: 'canceled',
                updated_at: new Date().toISOString()
              })
              .eq('id', profile.id);
              
            if (updateError) {
              console.error('Error updating profile after subscription deletion:', updateError);
            } else {
              console.log('Profile updated after subscription deletion');
            }
          } else {
            console.log('No user found with this subscription ID');
          }
        } catch (error) {
          console.error('Exception processing subscription deletion:', error);
        }
        break;
      }
      
      default:
        console.log(`Received unhandled event type: ${event.type}`);
    }
    
    // Return a successful response
    return new Response(
      JSON.stringify({ 
        received: true, 
        type: event.type,
        verified 
      }),
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
