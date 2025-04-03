
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getSupabaseClient, getStripeClient, updateProfileWithPremium } from "./utils.ts";
import { getStripeSession } from "./stripe.ts";

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
      
      // Update user profile with premium status if needed
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', userId)
        .single();
        
      if (!profile?.is_premium) {
        console.log("Profile not marked as premium, updating...");
        await updateProfileWithPremium(supabase, userId);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Payment already confirmed',
          source: 'payment_logs'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Also check if the user already has premium status
    const { data: profileCheck } = await supabase
      .from('profiles')
      .select('is_premium, subscription_id')
      .eq('id', userId)
      .single();
      
    if (profileCheck?.is_premium) {
      console.log("User already has premium status, returning success");
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'User already has premium status',
          source: 'profile_check'
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
      
      // Fetch the session with retry logic built into getStripeSession
      const session = await getStripeSession(sessionId, stripeSecretKey);
      
      // Update session metadata with userId for future webhook processing
      try {
        const stripe = getStripeClient();
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
        metadata: session.metadata
      }));
      
      // Check if payment was successful
      if (session.payment_status === 'paid') {
        console.log("Session is paid, updating profile...");
        
        // Get subscription details
        let subscriptionId = session.subscription || null;
        let subscriptionStatus = 'active';
        let subscriptionExpiry = null;
        
        // If we have a subscription, get additional details
        if (subscriptionId) {
          try {
            const stripe = getStripeClient();
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            subscriptionStatus = subscription.status;
            
            if (subscription.current_period_end) {
              subscriptionExpiry = new Date(subscription.current_period_end * 1000).toISOString();
            }
            
            console.log(`Subscription: id=${subscriptionId}, status=${subscriptionStatus}, expiry=${subscriptionExpiry}`);
          } catch (subError) {
            console.error("Error getting subscription details:", subError);
          }
        }
        
        // Update profile with premium status
        const updateSuccess = await updateProfileWithPremium(
          supabase, 
          userId,
          subscriptionId,
          subscriptionStatus,
          subscriptionExpiry
        );
        
        if (!updateSuccess) {
          console.log("Failed to update profile with premium status, retrying with direct query");
          
          // Try a direct update as fallback
          const { error: directUpdateError } = await supabase
            .from('profiles')
            .update({
              is_premium: true,
              subscription_id: subscriptionId,
              subscription_status: subscriptionStatus,
              subscription_expiry: subscriptionExpiry,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
            
          if (directUpdateError) {
            console.error("Direct profile update also failed:", directUpdateError);
          } else {
            console.log("Direct profile update succeeded");
          }
        }
        
        // Log the payment regardless of profile update success
        try {
          await supabase.from('payment_logs').insert({
            user_id: userId,
            session_id: sessionId,
            subscription_id: subscriptionId,
            customer: session.customer || null,
            customer_email: session.customer_email || null,
            timestamp: new Date().toISOString()
          });
          console.log("Payment logged successfully");
        } catch (insertError) {
          console.error("Error logging payment:", insertError);
        }
        
        // Verify if profile was actually updated
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .select('is_premium')
          .eq('id', userId)
          .single();
          
        return new Response(
          JSON.stringify({ 
            success: true,
            premium_status: !!updatedProfile?.is_premium,
            message: 'Payment verified successfully',
            source: 'stripe_api'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.log(`Payment not completed. Status: ${session.payment_status}`);
        return new Response(
          JSON.stringify({ 
            success: false,
            message: `Payment not completed. Status: ${session.payment_status}`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (stripeError) {
      console.error("Error retrieving Stripe session:", stripeError);
      throw new Error(`Error retrieving Stripe session: ${stripeError.message}`);
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
