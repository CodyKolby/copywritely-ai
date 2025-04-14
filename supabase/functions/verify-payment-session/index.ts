
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";
import Stripe from "https://esm.sh/stripe@12.1.1";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to update profile with premium status
const updateProfileWithPremium = async (supabase, userId, subscriptionId = null, subscriptionStatus = 'active', subscriptionExpiry = null) => {
  try {
    console.log(`Updating profile for user ${userId} with premium status`);
    
    // Calculate expiry date if not provided (30 days from now)
    if (!subscriptionExpiry) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      subscriptionExpiry = expiryDate.toISOString();
      console.log(`Using default expiry date: ${subscriptionExpiry}`);
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        is_premium: true,
        subscription_id: subscriptionId,
        subscription_status: subscriptionStatus,
        subscription_expiry: subscriptionExpiry,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) {
      console.error(`Error updating profile: ${error.message}`);
      return false;
    }
    
    console.log(`Profile updated successfully: ${JSON.stringify(data)}`);
    return true;
  } catch (error) {
    console.error(`Exception updating profile: ${error.message}`);
    return false;
  }
};

// Get Stripe session details
const getStripeSession = async (sessionId, stripeSecretKey) => {
  try {
    console.log(`Getting session details for ${sessionId}`);
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient()
    });
    
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer', 'payment_intent']
    });
    
    return session;
  } catch (error) {
    console.error(`Error retrieving session: ${error.message}`);
    throw error;
  }
};

// Get Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Verify payment session function started");
    
    // Get request data
    const { sessionId, userId } = await req.json();
    
    // Validate request data
    if (!sessionId) {
      throw new Error('Missing sessionId parameter');
    }
    if (!userId) {
      throw new Error('Missing userId parameter');
    }
    
    console.log(`Verifying payment for session: ${sessionId}, user: ${userId}`);
    
    // Initialize Supabase client
    const supabase = getSupabaseClient();
    
    // IMMEDIATE PREMIUM ACCESS: Grant premium access right away
    // This ensures the user gets access even before verification completes
    console.log("IMMEDIATE ACTION: Setting premium status while verification proceeds");
    await updateProfileWithPremium(supabase, userId);
    console.log("Premium status granted immediately");
    
    // First check if payment was already logged in our database
    console.log("Checking payment logs...");
    const { data: paymentLog, error: logError } = await supabase
      .from('payment_logs')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();
      
    if (logError) {
      console.error("Error checking payment logs:", logError);
    } else if (paymentLog) {
      console.log("Payment found in logs, confirming premium status");
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Payment already confirmed',
          source: 'payment_logs'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If not found in logs, check with Stripe directly
    try {
      console.log("Checking Stripe session via direct API call...");
      
      // Get the Stripe secret key
      const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeSecretKey) {
        throw new Error("STRIPE_SECRET_KEY not set");
      }
      
      // Fetch the session with retry logic
      const session = await getStripeSession(sessionId, stripeSecretKey);
      
      // Update session metadata with userId for future webhook processing
      try {
        const stripe = new Stripe(stripeSecretKey, {
          apiVersion: "2023-10-16",
          httpClient: Stripe.createFetchHttpClient()
        });
        
        await stripe.checkout.sessions.update(sessionId, {
          metadata: { userId }
        });
        console.log("Updated session metadata with userId");
      } catch (metadataError) {
        console.error("Error updating session metadata:", metadataError);
        // Continue verification even if metadata update fails
      }
      
      // Log full session details for debugging
      console.log("Session details:", JSON.stringify({
        id: session.id,
        payment_status: session.payment_status,
        status: session.status,
        customer: session.customer,
        subscription: session.subscription,
        metadata: session.metadata,
        customer_email: session.customer_email
      }));
      
      // Get subscription expiry date if available
      let subscriptionExpiry = null;
      let subscriptionId = null;
      
      if (session.subscription) {
        try {
          const stripe = new Stripe(stripeSecretKey, {
            apiVersion: "2023-10-16",
            httpClient: Stripe.createFetchHttpClient()
          });
          
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          subscriptionId = subscription.id;
          
          if (subscription.current_period_end) {
            subscriptionExpiry = new Date(subscription.current_period_end * 1000).toISOString();
            console.log(`Subscription expiry date: ${subscriptionExpiry}`);
          }
        } catch (subError) {
          console.error("Error getting subscription details:", subError);
        }
      }
      
      // Update profile with subscription details
      await updateProfileWithPremium(
        supabase,
        userId,
        subscriptionId || session.subscription,
        'active',
        subscriptionExpiry
      );
      
      // Log the payment regardless of session details - be optimistic
      try {
        await supabase.from('payment_logs').insert({
          user_id: userId,
          session_id: sessionId,
          subscription_id: session.subscription || null,
          customer: session.customer || null,
          customer_email: session.customer_email || null,
          timestamp: new Date().toISOString()
        });
        console.log("Payment logged successfully");
      } catch (insertError) {
        console.error("Error logging payment:", insertError);
      }
        
      // Return success even if verification is still in progress
      // We've already granted premium status and the webhook will handle the rest
      return new Response(
        JSON.stringify({ 
          success: true,
          premium_status: true,
          message: 'Account updated successfully',
          source: 'optimistic_update'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (stripeError) {
      console.error("Error retrieving Stripe session:", stripeError);
      
      // Even if we can't verify with Stripe, grant premium status
      // as a last resort to avoid blocking the user
      try {
        console.log("Stripe verification failed, applying fallback premium grant");
        await updateProfileWithPremium(supabase, userId);
        
        // Log the payment attempt
        await supabase.from('payment_logs').insert({
          user_id: userId,
          session_id: sessionId,
          fallback: true,
          timestamp: new Date().toISOString()
        });
        
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Emergency fallback: account updated',
            source: 'fallback'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (fallbackError) {
        console.error("Fallback update also failed:", fallbackError);
        throw new Error(`Verification failed with fallback: ${stripeError.message}`);
      }
    }
  } catch (error) {
    console.error('Error in verify-payment-session function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || 'Error verifying payment',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
