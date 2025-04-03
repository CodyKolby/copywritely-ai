
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./utils.ts";

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
    
    // Import utils
    const { 
      getSupabaseClient,
      getStripeClient,
      updateProfileWithPremium
    } = await import("./utils.ts");
    
    // Initialize clients
    const supabase = getSupabaseClient();
    const stripe = getStripeClient();
    
    // First check if payment was already logged
    console.log("Checking payment logs...");
    const { data: paymentLog, error: logError } = await supabase
      .from('payment_logs')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();
      
    if (logError) {
      console.error("Error checking payment logs:", logError);
    } else if (paymentLog) {
      console.log("Payment already logged");
      
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
          message: 'Payment already confirmed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If not found in logs, check with Stripe directly
    console.log("Checking Stripe session...");
    try {
      // Get session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      // Update session metadata with userId for future webhook processing
      try {
        await stripe.checkout.sessions.update(sessionId, {
          metadata: { userId }
        });
        console.log("Updated session metadata with userId");
      } catch (metadataError) {
        console.error("Error updating session metadata:", metadataError);
        // Continue verification even if metadata update fails
      }
      
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
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            subscriptionStatus = subscription.status;
            
            if (subscription.current_period_end) {
              subscriptionExpiry = new Date(subscription.current_period_end * 1000).toISOString();
            }
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
        
        // Log the payment
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
        
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Payment verified successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.log(`Payment not completed. Status: ${session.payment_status}`);
        return new Response(
          JSON.stringify({ 
            success: false,
            message: 'Payment not completed'
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
