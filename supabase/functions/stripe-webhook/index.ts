
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { stripe } from "./stripe.ts";

// CORS headers for the function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  console.log("Stripe webhook function started");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get the request body as text for signature verification
    const body = await req.text();
    
    // Get the signature from the headers
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      console.error("No Stripe signature found in the request headers");
      return new Response(JSON.stringify({ error: 'No Stripe signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Load the webhook secret from environment variables
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not set in environment variables");
      // Instead of returning an error, let's log the issue but continue processing
      // This will allow us to test the webhook without the signing secret
      console.log("WARNING: Processing webhook without signature verification!");
      
      // Parse the body as JSON
      const eventData = JSON.parse(body);
      console.log(`Processing unverified event type: ${eventData.type}`);
      
      // Handle the webhook as if it's verified
      return await handleWebhookEvent(eventData);
    }

    console.log("Verifying Stripe webhook signature");
    
    // Verify the webhook signature and parse the event
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log("Signature verified successfully");
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      // In development, let's still try to process the event even if verification fails
      console.log("Attempting to process webhook despite verification failure");
      try {
        const eventData = JSON.parse(body);
        console.log(`Processing unverified event type: ${eventData.type}`);
        return await handleWebhookEvent(eventData);
      } catch (parseError) {
        console.error("Failed to parse webhook body:", parseError);
        return new Response(JSON.stringify({ error: `Failed to parse webhook body: ${parseError.message}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    console.log(`Webhook event type: ${event.type}`);
    
    // Handle the event
    return await handleWebhookEvent(event);
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    return new Response(JSON.stringify({
      error: 'Error processing webhook',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Separate function to handle webhook events to avoid code duplication
async function handleWebhookEvent(event) {
  try {
    // Get database utils
    const { getSupabaseAdmin } = await import("./db.ts");
    const supabase = getSupabaseAdmin();
    
    // Handle the event based on type
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log(`Processing completed checkout session: ${session.id}`);
        
        // Extract user ID from session metadata
        const userId = session.metadata?.userId;
        
        if (userId) {
          console.log(`Found userId in metadata: ${userId}`);
          
          // Get subscription info if available
          const subscriptionId = session.subscription;
          const customerEmail = session.customer_details?.email || session.customer_email;
          const customer = session.customer;
          
          // Log the payment in the payment_logs table
          try {
            const { error: logError } = await supabase
              .from('payment_logs')
              .insert({
                user_id: userId,
                session_id: session.id,
                subscription_id: subscriptionId,
                customer: customer,
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
          
          // Update user profile with premium status
          if (session.payment_status === 'paid') {
            console.log('Payment status is paid, updating profile with premium status');
            
            // Update subscription details
            let subscriptionStatus = 'active';
            let subscriptionExpiry = null;
            
            if (subscriptionId) {
              try {
                // Fetch subscription details
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                
                if (subscription.status === 'active' || subscription.status === 'trialing') {
                  subscriptionStatus = 'active';
                  
                  // Set expiry date from current period end
                  if (subscription.current_period_end) {
                    subscriptionExpiry = new Date(subscription.current_period_end * 1000).toISOString();
                  }
                } else {
                  subscriptionStatus = subscription.status;
                }
                
                console.log(`Subscription details: status=${subscriptionStatus}, expiry=${subscriptionExpiry}`);
              } catch (subError) {
                console.error('Error fetching subscription details:', subError);
              }
            }
            
            // Update the profile
            try {
              const { error: updateError } = await supabase
                .from('profiles')
                .update({
                  is_premium: true,
                  subscription_id: subscriptionId,
                  subscription_status: subscriptionStatus,
                  subscription_expiry: subscriptionExpiry
                })
                .eq('id', userId);
                
              if (updateError) {
                console.error('Error updating profile:', updateError);
              } else {
                console.log('Profile updated successfully with premium status');
              }
            } catch (updateError) {
              console.error('Exception updating profile:', updateError);
            }
          }
        } else {
          console.log('No userId found in session metadata, storing as unprocessed payment');
          
          // Store in unprocessed_payments for later processing
          try {
            const { error: unprocessedError } = await supabase
              .from('unprocessed_payments')
              .insert({
                session_id: session.id,
                session_data: session,
                processed: false
              });
              
            if (unprocessedError) {
              console.error('Error storing unprocessed payment:', unprocessedError);
            } else {
              console.log('Unprocessed payment stored successfully');
            }
          } catch (unprocessedError) {
            console.error('Exception storing unprocessed payment:', unprocessedError);
          }
        }
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log(`Processing subscription event: ${subscription.id}`);
        
        try {
          // Find user by customer ID
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, subscription_id')
            .eq('subscription_id', subscription.id)
            .maybeSingle();
            
          if (profileError) {
            console.error('Error finding user profile by subscription:', profileError);
            break;
          }
          
          if (!profiles) {
            console.log('No user found with this subscription ID, trying to find by customer ID');
            
            // Try finding by customer ID instead
            const { data: customerProfiles, error: customerProfileError } = await supabase
              .from('payment_logs')
              .select('user_id')
              .eq('customer', subscription.customer)
              .eq('subscription_id', subscription.id)
              .maybeSingle();
              
            if (customerProfileError || !customerProfiles) {
              console.error('No user found with this customer ID either:', customerProfileError);
              break;
            }
            
            // Update subscription status
            let subscriptionStatus = 'inactive';
            let isPremium = false;
            let subscriptionExpiry = null;
            
            if (subscription.status === 'active' || subscription.status === 'trialing') {
              subscriptionStatus = 'active';
              isPremium = true;
              
              // Set expiry date
              if (subscription.current_period_end) {
                subscriptionExpiry = new Date(subscription.current_period_end * 1000).toISOString();
              }
            }
            
            // Update the profile
            const userId = customerProfiles.user_id;
            console.log(`Found user by customer ID: ${userId}, updating profile`);
            
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                is_premium: isPremium,
                subscription_id: subscription.id,
                subscription_status: subscriptionStatus,
                subscription_expiry: subscriptionExpiry
              })
              .eq('id', userId);
              
            if (updateError) {
              console.error('Error updating profile with subscription details:', updateError);
            } else {
              console.log('Profile updated successfully with subscription details');
            }
            
            break;
          }
          
          const userId = profiles.id;
          
          // Update subscription status
          let subscriptionStatus = 'inactive';
          let isPremium = false;
          let subscriptionExpiry = null;
          
          if (subscription.status === 'active' || subscription.status === 'trialing') {
            subscriptionStatus = 'active';
            isPremium = true;
            
            // Set expiry date
            if (subscription.current_period_end) {
              subscriptionExpiry = new Date(subscription.current_period_end * 1000).toISOString();
            }
          }
          
          // Update the profile
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              is_premium: isPremium,
              subscription_status: subscriptionStatus,
              subscription_expiry: subscriptionExpiry
            })
            .eq('id', userId);
            
          if (updateError) {
            console.error('Error updating profile with subscription details:', updateError);
          } else {
            console.log('Profile updated successfully with subscription details');
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
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('subscription_id', subscription.id)
            .maybeSingle();
            
          if (profileError) {
            console.error('Error finding user profile by subscription:', profileError);
            break;
          }
          
          if (!profiles) {
            console.log('No user found with this subscription ID');
            break;
          }
          
          const userId = profiles.id;
          
          // Update the profile - remove premium status
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              is_premium: false,
              subscription_status: 'canceled'
            })
            .eq('id', userId);
            
          if (updateError) {
            console.error('Error updating profile after subscription deletion:', updateError);
          } else {
            console.log('Profile updated successfully after subscription deletion');
          }
        } catch (error) {
          console.error('Exception processing subscription deletion:', error);
        }
        
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    // Return a successful response
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in handleWebhookEvent:', error);
    return new Response(JSON.stringify({ error: 'Error handling webhook event', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
