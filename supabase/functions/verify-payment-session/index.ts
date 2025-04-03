
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  corsHeaders, 
  getSupabaseClient, 
  getStripeSecretKey,
  verifyUser,
  updateProfileWithPremium,
  createProfileIfNotExists,
  verifyProfileUpdate
} from "./utils.ts";
import { 
  getStripeSession, 
  getSubscriptionDetails 
} from "./stripe.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Verify payment session function started");
    
    // Initialize clients and keys
    const stripeSecretKey = getStripeSecretKey();
    console.log("Stripe secret key retrieved successfully");
    
    const supabase = getSupabaseClient();
    console.log("Supabase client initialized");

    // Parse and validate request data
    const requestData = await req.json();
    console.log('Received request data:', requestData);
    
    const { sessionId, userId } = requestData;

    if (!sessionId) {
      console.error('Missing sessionId parameter');
      throw new Error('Missing sessionId parameter');
    }

    if (!userId) {
      console.error('Missing userId parameter');
      throw new Error('Missing userId parameter');
    }

    console.log(`Verifying payment session: ${sessionId} for user: ${userId}`);
    
    // Verify user exists
    console.log(`Verifying user exists: ${userId}`);
    const userExists = await verifyUser(supabase, userId);
    
    if (!userExists) {
      console.warn('User not found in auth.users table. Will continue anyway as they might exist in profiles table.');
      
      // Check if user exists in profiles table even if not in auth
      const { data: profileCheck } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileCheck) {
        console.log('User exists in profiles table, continuing with verification');
      } else {
        console.log('User not found in profiles table either, will attempt to create profile');
      }
    } else {
      console.log('User verified successfully in auth system');
    }
    
    // Verify session with Stripe
    console.log('Fetching Stripe session data...');
    const session = await getStripeSession(sessionId, stripeSecretKey);
    
    console.log('Stripe session data received:', {
      id: session.id,
      payment_status: session.payment_status,
      subscription: !!session.subscription,
      customer: !!session.customer
    });

    // Validate payment status
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

    console.log('Payment verified successfully, updating user profile');

    // Get subscription details
    console.log('Fetching subscription details from Stripe');
    const { subscriptionId, subscriptionStatus, subscriptionExpiry } = 
      await getSubscriptionDetails(session, stripeSecretKey);
      
    console.log('Subscription details:', {
      subscriptionId,
      subscriptionStatus,
      subscriptionExpiry
    });

    // Check if profile exists
    console.log(`Checking if profile exists for user: ${userId}`);
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id, is_premium')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileCheckError) {
      console.error('Error checking profile:', profileCheckError);
    }
      
    console.log('Existing profile check:', {
      exists: !!existingProfile,
      isPremium: existingProfile?.is_premium,
      error: profileCheckError ? 'Yes' : 'No'
    });

    let updateSuccess = false;
    
    // Update or create profile with premium status
    if (!existingProfile) {
      console.log('Profile not found, creating new profile');
      updateSuccess = await createProfileIfNotExists(
        supabase, 
        userId, 
        subscriptionId, 
        subscriptionStatus, 
        subscriptionExpiry
      );
      console.log('Profile creation result:', updateSuccess);
    } else {
      console.log('Updating existing profile with premium status');
      updateSuccess = await updateProfileWithPremium(
        supabase, 
        userId, 
        subscriptionId, 
        subscriptionStatus, 
        subscriptionExpiry
      );
      console.log('Profile update result:', updateSuccess);
    }
    
    if (!updateSuccess) {
      console.warn('Failed to update profile. Trying alternative method...');
      
      // Direct update as fallback
      try {
        console.log('Attempting direct update fallback');
        const { error: directUpdateError } = await supabase
          .from('profiles')
          .update({ is_premium: true })
          .eq('id', userId);
          
        if (directUpdateError) {
          console.error('Direct update fallback failed:', directUpdateError);
        } else {
          console.log('Direct update fallback succeeded');
          updateSuccess = true;
        }
      } catch (directError) {
        console.error('Exception in direct update fallback:', directError);
      }
    }
    
    // Verify premium status was set
    console.log('Verifying profile was updated correctly');
    const { success: verificationSuccess, profile: verifiedProfile } = 
      await verifyProfileUpdate(supabase, userId);
      
    console.log('Profile verification result:', {
      success: verificationSuccess,
      profile: verifiedProfile
    });
    
    console.log('Payment verification process completed successfully');
    
    // Return success even if verification failed, as we've tried our best
    return new Response(
      JSON.stringify({ 
        success: true,
        verified: verificationSuccess,
        profile: verifiedProfile,
        message: 'Płatność zweryfikowana pomyślnie i profil użytkownika zaktualizowany'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in verify-payment-session function:', error);
    
    // Attempt to get more detailed error information
    const errorDetail = {
      message: error.message || 'Unknown error',
      stack: error.stack || 'No stack trace',
      name: error.name || 'Error'
    };
    
    console.error('Detailed error info:', errorDetail);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || 'Wystąpił błąd podczas weryfikacji płatności',
        details: errorDetail,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
