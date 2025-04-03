
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
      
      // Try to create a basic profile since it doesn't exist
      try {
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            is_premium: false
          });
          
        if (createError) {
          console.error('Error creating missing profile:', createError);
        } else {
          console.log('Created basic profile for missing user');
        }
      } catch (createError) {
        console.error('Exception creating profile:', createError);
      }
      
      return new Response(
        JSON.stringify({ isPremium: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Profile data:', profile);

    // Default status - start with database flag
    let isPremium = profile.is_premium || false;
    console.log('Initial premium status from database flag:', isPremium);
    
    // Check expiry date if it exists
    if (profile.subscription_expiry) {
      const expiryDate = new Date(profile.subscription_expiry);
      const now = new Date();
      
      // If expiry date is in the future, user has active subscription
      if (expiryDate > now) {
        console.log('User has valid subscription until:', expiryDate);
        isPremium = true;
        
        // Update database if there's inconsistency
        if (!profile.is_premium) {
          console.log('Expiry date valid but is_premium flag is false. Fixing...');
          await supabase
            .from('profiles')
            .update({ 
              is_premium: true,
              subscription_status: profile.subscription_status || 'active'
            })
            .eq('id', userId);
        }
      } else if (isPremium && expiryDate <= now) {
        // If expiry date is in the past but is_premium flag is true,
        // update status to false
        console.log('Subscription expired, updating premium status to false');
        
        await supabase
          .from('profiles')
          .update({ 
            is_premium: false,
            subscription_status: 'inactive'
          })
          .eq('id', userId);
        
        isPremium = false;
      }
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
          
          // Update based on Stripe's data - the source of truth
          if (subscription.status === 'active' || subscription.status === 'trialing') {
            isPremium = true;
            
            // Update DB if needed (adding subscription expiry if available)
            if (!profile.is_premium || subscription.status !== profile.subscription_status) {
              console.log('Updating profile based on active Stripe subscription');
              
              // Calculate expiry date from current_period_end if available
              let expiryDate = profile.subscription_expiry;
              if (subscription.current_period_end) {
                expiryDate = new Date(subscription.current_period_end * 1000).toISOString();
              }
              
              await supabase
                .from('profiles')
                .update({ 
                  is_premium: true,
                  subscription_status: 'active', // Simplified to just active
                  subscription_expiry: expiryDate
                })
                .eq('id', userId);
            }
          } else if (profile.is_premium) {
            // Subscription is not active in Stripe, but marked as premium in DB
            console.log('Updating profile to non-premium based on inactive Stripe subscription');
            isPremium = false;
            await supabase
              .from('profiles')
              .update({ 
                is_premium: false,
                subscription_status: 'inactive' // Simplified to just inactive
              })
              .eq('id', userId);
          }
        } else {
          console.error('Failed to fetch subscription from Stripe:', await response.text());
          
          // If it's an invalid subscription and user is marked as premium, update to not premium
          const errorData = await response.json();
          if (isPremium && errorData?.error?.type === 'invalid_request_error') {
            console.log('Subscription not found in Stripe, updating premium status to false');
            await supabase
              .from('profiles')
              .update({ 
                is_premium: false,
                subscription_status: 'inactive'
              })
              .eq('id', userId);
            
            isPremium = false;
          }
        }
      } catch (stripeError) {
        console.error('Error validating with Stripe:', stripeError);
        // Continue with database values if Stripe validation fails
      }
    }

    // Force a final consistency check before returning
    if (isPremium !== profile.is_premium) {
      try {
        console.log(`Final consistency check - updating is_premium to ${isPremium}`);
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_premium: isPremium })
          .eq('id', userId);
          
        if (updateError) {
          console.error('Error in final premium status update:', updateError);
        }
      } catch (finalCheckError) {
        console.error('Error in final consistency check:', finalCheckError);
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
