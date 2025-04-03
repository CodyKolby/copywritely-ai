
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from "https://esm.sh/stripe@12.1.1";

// CORS headers for the function
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Get Supabase client with admin privileges
export const getSupabaseClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Get Stripe client
export const getStripeClient = () => {
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY not set");
  }
  
  return new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });
};

// Update user profile with premium status
export const updateProfileWithPremium = async (
  supabase: any,
  userId: string,
  subscriptionId: string | null = null,
  subscriptionStatus: string = 'active',
  subscriptionExpiry: string | null = null
) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_premium: true,
        subscription_id: subscriptionId,
        subscription_status: subscriptionStatus,
        subscription_expiry: subscriptionExpiry
      })
      .eq('id', userId);
      
    if (error) {
      console.error("Error updating profile:", error);
      return false;
    }
    
    console.log("Profile updated with premium status");
    return true;
  } catch (error) {
    console.error("Exception updating profile:", error);
    return false;
  }
};
