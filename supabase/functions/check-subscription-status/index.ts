
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";

// Get environment variables
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Define CORS headers
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
    // Get user ID from request
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('Missing userId parameter');
    }

    console.log(`Checking subscription status for user: ${userId}`);

    // Create Supabase client with Service Role Key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check subscription status in profiles table
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium, subscription_status, subscription_expiry, subscription_id')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    if (!profile) {
      console.log('Profile not found, user has no premium status');
      return new Response(
        JSON.stringify({ isPremium: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Profile data:', profile);

    // Check if subscription is active
    let isPremium = false;
    
    // If we have is_premium flag and/or subscription expiry date
    isPremium = profile.is_premium || false;
    
    // Check expiry date if it exists
    if (profile.subscription_expiry) {
      const expiryDate = new Date(profile.subscription_expiry);
      const now = new Date();
      
      // If expiry date is in the future, user has active subscription
      if (expiryDate > now) {
        isPremium = true;
      } else if (isPremium) {
        // If expiry date is in the past but is_premium flag is true,
        // update status to false
        console.log('Subscription expired, updating premium status to false');
        await supabase
          .from('profiles')
          .update({ is_premium: false })
          .eq('id', userId);
        
        isPremium = false;
      }
    }
    
    // Check subscription status
    if (profile.subscription_status === 'active' || 
        profile.subscription_status === 'trialing') {
      isPremium = true;
    }

    // If we have a subscription ID, validate with Stripe directly
    if (profile.subscription_id && stripeSecretKey) {
      try {
        console.log('Validating subscription with Stripe:', profile.subscription_id);
        const response = await fetch(`https://api.stripe.com/v1/subscriptions/${profile.subscription_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        if (response.ok) {
          const subscription = await response.json();
          console.log('Stripe subscription status:', subscription.status);
          
          // Update based on Stripe's data
          if (subscription.status === 'active' || subscription.status === 'trialing') {
            isPremium = true;
            
            // Update DB if needed
            if (!profile.is_premium) {
              await supabase
                .from('profiles')
                .update({ 
                  is_premium: true,
                  subscription_status: subscription.status
                })
                .eq('id', userId);
            }
          } else if (profile.is_premium) {
            // Subscription is not active in Stripe, but marked as premium in DB
            isPremium = false;
            await supabase
              .from('profiles')
              .update({ 
                is_premium: false,
                subscription_status: subscription.status
              })
              .eq('id', userId);
          }
        }
      } catch (stripeError) {
        console.error('Error validating with Stripe:', stripeError);
        // Continue with database values if Stripe validation fails
      }
    }

    console.log(`Final premium status for user ${userId}: ${isPremium}`);

    return new Response(
      JSON.stringify({ isPremium }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking subscription status:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error checking subscription status',
        isPremium: false
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
