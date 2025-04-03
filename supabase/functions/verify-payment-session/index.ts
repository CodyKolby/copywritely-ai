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
    
    // 2. Verify session with Stripe
    console.log(`Verifying Stripe session: ${sessionId}`);
    const session = await getStripeSession(sessionId, stripeSecretKey);
    
    // 3. Validate payment status
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
    
    // 4. Get subscription details
    const { subscriptionId, subscriptionStatus, subscriptionExpiry } = 
      await getSubscriptionDetails(session, stripeSecretKey);
      
    console.log('Subscription details:', {
      subscriptionId,
      subscriptionStatus,
      subscriptionExpiry
    });
    
    // 5. Update user profile with premium status
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
    
    // 6. Verify profile was updated correctly
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
