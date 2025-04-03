
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
    
    // Import utils to keep main function clean
    const { 
      getSupabaseClient, 
      getStripeSecretKey,
      ensureUserProfile,
      updateProfileWithPremium,
      verifyProfileUpdate 
    } = await import("./utils.ts");
    
    // Import Stripe module
    const { 
      getStripeSession, 
      getSubscriptionDetails 
    } = await import("./stripe.ts");
    
    // Initialize clients
    const supabase = getSupabaseClient();
    const stripeSecretKey = getStripeSecretKey();
    
    // 1. Check if user profile exists
    console.log("Ensuring user profile exists");
    await ensureUserProfile(supabase, userId);
    
    // 2. First check if the profile already has premium status (might have been updated by webhook)
    console.log("Checking if profile already has premium status from webhook");
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium, subscription_status, subscription_id, subscription_expiry')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error("Error fetching profile:", profileError);
    } else if (profileData?.is_premium) {
      console.log("Profile already has premium status, likely updated by webhook");
      return new Response(
        JSON.stringify({ 
          success: true,
          profile: profileData,
          message: 'Płatność już została zweryfikowana'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // 3. Check payment logs to see if this session was already processed by webhook
    console.log("Checking payment logs for this session");
    const { data: paymentLogData, error: paymentLogError } = await supabase
      .from('payment_logs')
      .select('*')
      .eq('session_id', sessionId)
      .single();
      
    if (paymentLogError) {
      console.log("Session not found in payment logs, continuing with verification");
    } else if (paymentLogData) {
      console.log("Payment already logged for this session, updating profile if needed");
      
      // Update profile if it's not premium yet
      if (!profileData?.is_premium) {
        console.log("Payment logged but profile not updated, fixing now");
        await updateProfileWithPremium(
          supabase, 
          userId, 
          paymentLogData.subscription_id, 
          'active', 
          null
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Płatność została potwierdzona'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // 4. If not found in logs, verify session with Stripe directly
    console.log(`Verifying Stripe session: ${sessionId}`);
    const session = await getStripeSession(sessionId, stripeSecretKey);
    
    // 5. Add userId to session metadata for future webhook processing
    console.log("Updating session metadata with userId");
    try {
      await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'metadata[userId]': userId
        }).toString()
      });
      console.log("Session metadata updated with userId");
    } catch (metadataError) {
      console.error("Error updating session metadata:", metadataError);
      // Continue with verification even if metadata update fails
    }
    
    // 6. Validate payment status
    if (session.payment_status !== 'paid') {
      console.log(`Payment not completed. Status: ${session.payment_status}`);
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Płatność nie została ukończona'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // 7. Get subscription details
    const { subscriptionId, subscriptionStatus, subscriptionExpiry } = 
      await getSubscriptionDetails(session, stripeSecretKey);
      
    console.log('Subscription details:', {
      subscriptionId,
      subscriptionStatus,
      subscriptionExpiry
    });
    
    // 8. Update user profile with premium status
    console.log("Updating profile with premium status");
    const updateSuccess = await updateProfileWithPremium(
      supabase, 
      userId, 
      subscriptionId, 
      subscriptionStatus, 
      subscriptionExpiry
    );
    
    if (!updateSuccess) {
      console.warn("Failed to update profile, will try direct update");
      
      // Direct update as fallback
      try {
        const { error: directUpdateError } = await supabase
          .from('profiles')
          .update({ is_premium: true })
          .eq('id', userId);
          
        if (directUpdateError) {
          console.error('Direct update fallback failed:', directUpdateError);
        } else {
          console.log('Direct update fallback succeeded');
        }
      } catch (directError) {
        console.error('Exception in direct update fallback:', directError);
      }
    }
    
    // 9. Log this payment
    console.log("Logging successful payment");
    try {
      await supabase.from('payment_logs').insert({
        user_id: userId,
        session_id: sessionId,
        subscription_id: subscriptionId,
        customer: session.customer || null,
        customer_email: session.customer_email || null,
        timestamp: new Date().toISOString()
      });
    } catch (logError) {
      console.error("Error logging payment:", logError);
      // Continue even if logging fails
    }
    
    // 10. Verify profile was updated correctly
    console.log("Verifying profile was updated correctly");
    const { success: verificationSuccess, profile: verifiedProfile } = 
      await verifyProfileUpdate(supabase, userId);
    
    console.log("Verification complete");
    
    // Success response
    return new Response(
      JSON.stringify({ 
        success: true,
        verified: verificationSuccess,
        profile: verifiedProfile,
        message: 'Płatność zweryfikowana pomyślnie'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    // Log the error in detail
    console.error('Error in verify-payment-session function:', error);
    const errorDetail = {
      message: error.message || 'Unknown error',
      stack: error.stack || 'No stack trace',
      name: error.name || 'Error'
    };
    
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || 'Wystąpił błąd podczas weryfikacji płatności',
        details: errorDetail,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
