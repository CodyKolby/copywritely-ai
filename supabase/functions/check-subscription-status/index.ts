
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  corsHeaders, 
  getSupabaseClient, 
  verifyUser, 
  isSubscriptionExpired,
  verifyStripeSubscription
} from "./utils.ts";
import {
  checkPaymentLogs,
  createBasicProfile,
  updateProfileFromPaymentLogs
} from "./payment-logs.ts";
import {
  updatePremiumStatus,
  getProfile
} from "./profile.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user ID from request
    const requestData = await req.json();
    const userId = requestData.userId;

    if (!userId) {
      console.error('Missing userId parameter in request');
      throw new Error('Missing userId parameter');
    }

    console.log(`Checking subscription status for user: ${userId}`);

    // Get Stripe secret key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    // Create Supabase client
    const supabase = getSupabaseClient();

    // First check if user exists in auth system
    const userExists = await verifyUser(supabase, userId);
    if (!userExists) {
      console.warn('User not verified in auth system. Will continue anyway as they might exist in profiles table');
    }

    // Check subscription status in profiles table
    const profile = await getProfile(supabase, userId);

    if (!profile) {
      console.log('Profile not found, user has no premium status');
      
      // Try to create a basic profile since it doesn't exist
      await createBasicProfile(supabase, userId);
      
      // Also check payment logs before returning - this deals with "ghost premium" issue
      const hasPaymentLogs = await checkPaymentLogs(supabase, userId);
      
      if (hasPaymentLogs) {
        console.log('Found payment logs but no profile, creating premium profile');
        
        // User has payment but no profile or premium status
        const updated = await updateProfileFromPaymentLogs(supabase, userId);
        
        if (updated) {
          return new Response(
            JSON.stringify({ isPremium: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      return new Response(
        JSON.stringify({ isPremium: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Profile data:', profile);

    // Check expiry date first - this is critical
    if (profile.subscription_expiry) {
      if (isSubscriptionExpired(profile.subscription_expiry)) {
        console.log('Subscription has expired on:', profile.subscription_expiry);
        
        // Update database to reflect expired status
        await updatePremiumStatus(supabase, userId, false, 'inactive');
        
        return new Response(
          JSON.stringify({ isPremium: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Default status after expiry check
    let isPremium = profile.is_premium || false;
    
    // If we have a subscription ID, validate with Stripe directly
    if (profile.subscription_id && stripeSecretKey) {
      const { isActive, expiryDate } = await verifyStripeSubscription(
        profile.subscription_id, 
        stripeSecretKey
      );
      
      // Update based on Stripe's data - the source of truth
      if (isActive) {
        isPremium = true;
        
        // Update DB if needed
        if (!profile.is_premium || profile.subscription_status !== 'active') {
          console.log('Updating profile based on active Stripe subscription');
          
          const updateData: Record<string, any> = { 
            is_premium: true,
            subscription_status: 'active'
          };
          
          if (expiryDate) {
            updateData.subscription_expiry = expiryDate;
          }
          
          await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', userId);
        }
      } else if (profile.is_premium) {
        // Subscription is not active in Stripe, but marked as premium in DB
        console.log('Updating profile to non-premium based on inactive Stripe subscription');
        isPremium = false;
        
        await updatePremiumStatus(supabase, userId, false, 'inactive');
      }
    }
    
    // One final check - if premium is false but payment logs exist, override
    if (!isPremium) {
      const hasPaymentLogs = await checkPaymentLogs(supabase, userId);
      
      if (hasPaymentLogs) {
        console.log('Found payment logs - overriding subscription status to active');
        
        // User has payment but premium status is false
        await updatePremiumStatus(supabase, userId, true);
        isPremium = true;
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
