
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.1.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { updatePremiumStatus, getProfile } from "./profile.ts";
import { checkPaymentLogs } from "./payment-logs.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Set up Supabase client
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase environment variables" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Parse request body
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing user ID in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[CHECK-SUB] Checking subscription for user: ${userId}`);

    // Get the user's profile
    const profile = await getProfile(supabase, userId);
    
    if (!profile) {
      console.error("[CHECK-SUB] Error: User profile not found");
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if the subscription status is canceled, ensure expiry date is correct
    if (profile.subscription_status === 'canceled') {
      console.log('[CHECK-SUB] Subscription is canceled, verifying expiry date');
      
      await updatePremiumStatus(
        supabase,
        userId,
        false,
        'canceled',
        new Date().toISOString()
      );
      
      return new Response(
        JSON.stringify({
          isPremium: false,
          message: "Subscription has been canceled",
          subscriptionStatus: 'canceled',
          subscriptionExpiry: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if the expiry date has passed for premium users
    if (profile?.is_premium && profile.subscription_expiry) {
      const expiryDate = new Date(profile.subscription_expiry);
      const now = new Date();
      
      if (expiryDate <= now) {
        console.log(`[CHECK-SUB] Subscription expired at ${expiryDate.toISOString()}, current time is ${now.toISOString()}`);
        
        await updatePremiumStatus(
          supabase,
          userId,
          false,
          'expired',
          new Date().toISOString()
        );
        
        return new Response(
          JSON.stringify({
            isPremium: false,
            message: "Subscription has expired",
            subscriptionStatus: 'expired',
            subscriptionExpiry: new Date().toISOString()
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Check for existing subscription ID first
    if (profile?.subscription_id) {
      console.log(`[CHECK-SUB] User has subscription ID: ${profile.subscription_id}`);
      
      try {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeKey) {
          throw new Error("Missing Stripe secret key");
        }
        
        const stripe = new Stripe(stripeKey, {
          apiVersion: "2023-10-16",
        });

        // Verify the subscription status in Stripe
        const subscription = await stripe.subscriptions.retrieve(profile.subscription_id);
        console.log(`[CHECK-SUB] Retrieved subscription from Stripe: status=${subscription.status}`);
        
        const isActive = subscription.status === "active" || subscription.status === "trialing";
        
        // Calculate expiry date - prioritizing the most accurate sources from Stripe
        let expiryDate = null;
        
        if (subscription.trial_end && subscription.status === 'trialing') {
          // Trial end date takes precedence if in trial
          expiryDate = new Date(subscription.trial_end * 1000).toISOString();
          console.log(`[CHECK-SUB] Using trial_end for expiry date: ${expiryDate}`);
        } else if (subscription.cancel_at) {
          // If subscription is set to cancel at a specific time
          expiryDate = new Date(subscription.cancel_at * 1000).toISOString();
          console.log(`[CHECK-SUB] Using cancel_at for expiry date: ${expiryDate}`);
        } else if (subscription.status === 'canceled' && !subscription.cancel_at_period_end) {
          // For immediate cancellations, set to now
          expiryDate = new Date().toISOString();
          console.log(`[CHECK-SUB] Immediate cancellation detected, setting expiry to current time: ${expiryDate}`);
        } else if (subscription.current_period_end) {
          // For other cases, use period end
          expiryDate = new Date(subscription.current_period_end * 1000).toISOString();
          console.log(`[CHECK-SUB] Using current_period_end for expiry date: ${expiryDate}`);
        } else if (!isActive) {
          // For canceled/inactive subscriptions without a period end, use current date
          expiryDate = new Date().toISOString();
          console.log(`[CHECK-SUB] Inactive subscription without period end, using current time: ${expiryDate}`);
        }
        
        // Update the user's profile if needed
        if (isActive !== profile.is_premium || 
            profile.subscription_status !== subscription.status || 
            profile.subscription_expiry !== expiryDate) {
          
          console.log(`[CHECK-SUB] Updating profile: isPremium=${isActive}, status=${subscription.status}, expiry=${expiryDate}`);
          
          await updatePremiumStatus(
            supabase, 
            userId, 
            isActive, 
            subscription.status,
            expiryDate
          );
        } else {
          console.log("[CHECK-SUB] No profile update needed, status unchanged");
        }
        
        return new Response(
          JSON.stringify({
            isPremium: isActive,
            subscriptionStatus: subscription.status,
            subscriptionExpiry: expiryDate
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (stripeError) {
        console.error("[CHECK-SUB] Error verifying subscription with Stripe:", stripeError);
        
        // The subscription ID might be invalid or deleted in Stripe
        // Fall back to payment logs check
        console.log("[CHECK-SUB] Falling back to payment logs check");
      }
    }

    // Fall back to checking payment logs
    const logCheck = await checkPaymentLogs(supabase, userId);
    
    if (logCheck) {
      return new Response(
        JSON.stringify({
          isPremium: true,
          message: "Premium status verified through payment logs",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If we get here, no active subscription was found
    return new Response(
      JSON.stringify({
        isPremium: false,
        message: "No active subscription found",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("[CHECK-SUB] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
