
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
    const { sessionId, userId } = await req.json();

    if (!sessionId) {
      throw new Error('Missing sessionId parameter');
    }

    if (!userId) {
      throw new Error('Missing userId parameter');
    }

    console.log(`Verifying payment session: ${sessionId} for user: ${userId}`);
    
    // Verify session with Stripe
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Stripe API error:', errorData);
      throw new Error('Error verifying payment session with Stripe');
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
    let subscriptionStatus = 'active';
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
          subscriptionStatus = subscription.status;
          // Convert UNIX timestamp to ISO string
          subscriptionExpiry = new Date(subscription.current_period_end * 1000).toISOString();
          console.log('Subscription details:', {
            status: subscriptionStatus,
            expiry: subscriptionExpiry
          });
        } else {
          console.error('Failed to fetch subscription details:', await subscriptionResponse.text());
        }
      } catch (subError) {
        console.error('Error fetching subscription:', subError);
      }
    }

    // First check if profile exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id, is_premium')
      .eq('id', userId)
      .single();
      
    if (profileCheckError && profileCheckError.code === 'PGRST116') {
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
        throw new Error('Error creating user profile');
      }
      
      console.log('Successfully created new profile with premium status');
    } else {
      // Update existing profile
      console.log('Updating existing profile with premium status:', existingProfile);
      console.log('Current premium status:', existingProfile?.is_premium);
      
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
        console.error('Error updating user profile:', updateError);
        throw new Error('Error updating user profile');
      }
      
      console.log('Successfully updated profile is_premium to TRUE');
    }
    
    // Verify update was successful
    const { data: verifiedProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', userId)
      .single();
      
    if (verifyError) {
      console.error('Error verifying profile update:', verifyError);
    } else {
      console.log('Verified profile status after update:', verifiedProfile);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
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
