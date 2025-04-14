
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";
import Stripe from "https://esm.sh/stripe@12.1.1";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

// Check if subscription is expired
const isSubscriptionExpired = (expiryDate: string): boolean => {
  try {
    const expiry = new Date(expiryDate);
    const now = new Date();
    
    return expiry < now;
  } catch (error) {
    console.error('Error checking subscription expiry:', error);
    return true; // Assume expired on error
  }
};

// Process a batch of profiles
const processProfiles = async (profiles, stripe) => {
  const supabase = getSupabaseClient();
  const updates = [];
  
  for (const profile of profiles) {
    try {
      // Check if this is just a trial user
      const isTrial = profile.trial_started_at && 
                    (!profile.subscription_id || profile.subscription_id === '') &&
                    profile.is_premium;
      
      // Check expiry date
      if (profile.subscription_expiry && isSubscriptionExpired(profile.subscription_expiry)) {
        console.log(`User ${profile.id}: Subscription expired at ${profile.subscription_expiry}`);
        
        // If this was just a trial, simply mark as inactive
        if (isTrial) {
          console.log(`User ${profile.id}: Trial period ended`);
          updates.push({
            id: profile.id,
            is_premium: false,
            subscription_status: 'inactive',
            updated_at: new Date().toISOString()
          });
          continue;
        }
        
        // If there's a subscription ID, check with Stripe
        if (profile.subscription_id && stripe) {
          try {
            const subscription = await stripe.subscriptions.retrieve(profile.subscription_id);
            
            // If the subscription is still active in Stripe, update the expiry date
            if (subscription.status === 'active' || subscription.status === 'trialing') {
              const newExpiryDate = new Date(subscription.current_period_end * 1000).toISOString();
              console.log(`User ${profile.id}: Updating expiry from ${profile.subscription_expiry} to ${newExpiryDate}`);
              
              updates.push({
                id: profile.id,
                is_premium: true,
                subscription_status: 'active',
                subscription_expiry: newExpiryDate,
                updated_at: new Date().toISOString()
              });
            } else {
              // Subscription is not active in Stripe
              console.log(`User ${profile.id}: Subscription not active in Stripe: ${subscription.status}`);
              
              updates.push({
                id: profile.id,
                is_premium: false,
                subscription_status: 'inactive',
                updated_at: new Date().toISOString()
              });
            }
          } catch (error) {
            console.error(`User ${profile.id}: Error checking subscription with Stripe:`, error);
            
            // On error, mark as expired
            updates.push({
              id: profile.id,
              is_premium: false,
              subscription_status: 'inactive',
              updated_at: new Date().toISOString()
            });
          }
        } else {
          // No subscription ID but expired
          console.log(`User ${profile.id}: No subscription ID and expired`);
          
          updates.push({
            id: profile.id,
            is_premium: false,
            subscription_status: 'inactive',
            updated_at: new Date().toISOString()
          });
        }
      } else if (profile.subscription_expiry) {
        console.log(`User ${profile.id}: Subscription not expired, valid until ${profile.subscription_expiry}`);
      }
    } catch (error) {
      console.error(`Error processing user ${profile.id}:`, error);
    }
  }
  
  // Apply updates in batches
  if (updates.length > 0) {
    console.log(`Applying ${updates.length} updates`);
    
    for (const update of updates) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            is_premium: update.is_premium,
            subscription_status: update.subscription_status,
            updated_at: update.updated_at,
            ...(update.subscription_expiry ? { subscription_expiry: update.subscription_expiry } : {})
          })
          .eq('id', update.id);
          
        if (error) {
          console.error(`Error updating user ${update.id}:`, error);
        } else {
          console.log(`User ${update.id} updated successfully`);
        }
      } catch (error) {
        console.error(`Exception updating user ${update.id}:`, error);
      }
    }
  }
  
  return updates.length;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting subscription check job');
    
    // Get Stripe secret key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    let stripe = null;
    
    if (stripeSecretKey) {
      stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2023-10-16"
      });
    } else {
      console.warn('STRIPE_SECRET_KEY not set, will not check with Stripe');
    }
    
    // Create Supabase client
    const supabase = getSupabaseClient();
    
    // Get profiles that are premium or have subscription data
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, is_premium, subscription_id, subscription_status, subscription_expiry, trial_started_at')
      .or('is_premium.eq.true,subscription_id.neq.,subscription_expiry.neq.');
      
    if (error) {
      throw new Error(`Error fetching profiles: ${error.message}`);
    }
    
    console.log(`Found ${profiles.length} profiles to check`);
    
    // Process profiles in batches of 10
    const batchSize = 10;
    let totalUpdates = 0;
    
    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);
      const updates = await processProfiles(batch, stripe);
      totalUpdates += updates;
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Checked ${profiles.length} profiles, updated ${totalUpdates}`,
        checked: profiles.length,
        updated: totalUpdates
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking subscriptions:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error checking subscriptions'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
