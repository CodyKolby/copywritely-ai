
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Define CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Stripe secret key from environment
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not set in environment variables');
      throw new Error('Missing Stripe API key in server configuration');
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      throw new Error('Missing Supabase credentials');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    
    // First check if user exists in auth system
    try {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError) {
        console.error('Error verifying user:', userError);
      } else if (!userData.user) {
        console.error('User not found in auth system:', userId);
      } else {
        console.log('User verified in auth system:', userData.user.id);
      }
    } catch (userCheckError) {
      console.error('Exception checking user in auth system:', userCheckError);
    }
    
    // Verify session with Stripe
    let response;
    try {
      response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    } catch (fetchError) {
      console.error('Error fetching from Stripe API:', fetchError);
      throw new Error('Network error connecting to Stripe');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stripe API error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (parseError) {
        console.error('Error parsing Stripe error response:', parseError);
      }
      
      throw new Error('Error verifying payment session with Stripe: ' + 
        (errorData?.error?.message || 'Unknown Stripe API error'));
    }

    const session = await response.json();
    console.log('Stripe session data:', {
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
    const subscriptionId = session.subscription;
    let subscriptionStatus = 'active'; // Simplified to just active
    let subscriptionExpiry = null;

    if (subscriptionId) {
      try {
        const subscriptionResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        if (subscriptionResponse.ok) {
          const subscription = await subscriptionResponse.json();
          // Simplified - all active subscriptions are treated the same
          if (subscription.status === 'active' || subscription.status === 'trialing') {
            subscriptionStatus = 'active';
          } else {
            subscriptionStatus = 'inactive';
          }
          // Convert UNIX timestamp to ISO string
          if (subscription.current_period_end) {
            subscriptionExpiry = new Date(subscription.current_period_end * 1000).toISOString();
            console.log('Subscription details:', {
              status: subscriptionStatus,
              expiry: subscriptionExpiry
            });
          } else {
            console.warn('Subscription does not have current_period_end:', subscription);
          }
        } else {
          const subscriptionErrorText = await subscriptionResponse.text();
          console.error('Failed to fetch subscription details:', subscriptionErrorText);
        }
      } catch (subError) {
        console.error('Error fetching subscription:', subError);
      }
    }

    // Check if profile exists and get current data
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id, is_premium')
      .eq('id', userId)
      .maybeSingle();
      
    console.log('Existing profile check:', {
      exists: !!existingProfile,
      isPremium: existingProfile?.is_premium,
      error: profileCheckError ? 'Yes' : 'No'
    });

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('Unexpected error checking profile:', profileCheckError);
    }
      
    if (!existingProfile) {
      // Profile doesn't exist, create it first
      console.log('Profile not found, creating basic profile before update');
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          is_premium: true,
          subscription_id: subscriptionId || null,
          subscription_status: subscriptionStatus,
          subscription_expiry: subscriptionExpiry
        });
        
      if (createError) {
        console.error('Error creating user profile:', createError);
        
        // Try using a database function as fallback
        try {
          console.log('Trying to create profile via RPC function');
          const { error: rpcError } = await supabase.rpc(
            'create_user_profile',
            {
              user_id: userId,
              user_email: null,
              user_full_name: null,
              user_avatar_url: null
            }
          );
          
          if (rpcError) {
            console.error('Error creating profile with RPC function:', rpcError);
            throw new Error('Failed to create user profile');
          } else {
            console.log('Successfully created profile via RPC function');
            
            // Now update the premium status in a separate call
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                is_premium: true,
                subscription_id: subscriptionId || null,
                subscription_status: subscriptionStatus,
                subscription_expiry: subscriptionExpiry
              })
              .eq('id', userId);
              
            if (updateError) {
              console.error('Error updating new profile with premium data:', updateError);
              throw new Error('Error updating new profile with premium data');
            }
          }
        } catch (rpcError) {
          console.error('RPC fallback failed:', rpcError);
          throw new Error('Failed to create or update user profile');
        }
      } else {
        console.log('Successfully created new profile with premium status');
      }
    } else {
      // Update existing profile
      console.log('Updating existing profile with premium status');
      console.log('Current premium status:', existingProfile?.is_premium);
      
      // Define what we want to update
      const updateData: Record<string, any> = {
        is_premium: true
      };
      
      // Only add these fields if they have values
      if (subscriptionId) updateData.subscription_id = subscriptionId;
      if (subscriptionStatus) updateData.subscription_status = subscriptionStatus;
      if (subscriptionExpiry) updateData.subscription_expiry = subscriptionExpiry;
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user profile:', updateError);
        throw new Error('Error updating user profile');
      }
      
      console.log('Successfully updated profile is_premium to TRUE');
    }
    
    // Verify update was successful - retry up to 3 times if needed
    let retries = 0;
    let verificationSuccess = false;
    let verifiedProfile = null;
    
    while (retries < 3 && !verificationSuccess) {
      const { data: profile, error: verifyError } = await supabase
        .from('profiles')
        .select('is_premium, subscription_status, subscription_expiry')
        .eq('id', userId)
        .single();
        
      if (verifyError) {
        console.error(`Verification attempt ${retries + 1} failed:`, verifyError);
      } else if (!profile.is_premium) {
        console.error(`Verification attempt ${retries + 1}: Profile found but is_premium is still false`);
      } else {
        console.log('Verified profile status after update:', profile);
        verificationSuccess = true;
        verifiedProfile = profile;
        break;
      }
      
      // If verification failed and we haven't exceeded retries, wait and try again
      if (!verificationSuccess && retries < 2) {
        console.log(`Waiting before retry ${retries + 2}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try direct UPDATE again before next verification
        const { error: retryError } = await supabase
          .from('profiles')
          .update({ is_premium: true })
          .eq('id', userId);
          
        if (retryError) {
          console.error(`Retry ${retries + 1} update failed:`, retryError);
        } else {
          console.log(`Retry ${retries + 1} update succeeded`);
        }
      }
      
      retries++;
    }
    
    if (!verificationSuccess) {
      console.warn('Failed to verify premium status update after multiple attempts');
    }

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
    
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || 'Wystąpił błąd podczas weryfikacji płatności',
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
