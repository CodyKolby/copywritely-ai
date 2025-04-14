
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";
import Stripe from "https://esm.sh/stripe@12.1.1";

// CORS Headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get Supabase client
export const getSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Verify user exists in auth system
export const verifyUser = async (supabase: any, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .auth
      .admin
      .getUserById(userId);
      
    if (error || !data) {
      console.error('Error verifying user:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying user:', error);
    return false;
  }
};

// Check if subscription is expired
export const isSubscriptionExpired = (expiryDate: string): boolean => {
  try {
    const expiry = new Date(expiryDate);
    const now = new Date();
    
    return expiry < now;
  } catch (error) {
    console.error('Error checking subscription expiry:', error);
    return true; // Assume expired on error
  }
};

// Verify subscription with Stripe
export const verifyStripeSubscription = async (
  subscriptionId: string, 
  stripeSecretKey: string
): Promise<{ isActive: boolean; expiryDate: string | null }> => {
  try {
    console.log(`Verifying subscription ${subscriptionId} with Stripe`);
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16"
    });
    
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    if (!subscription) {
      console.error('No subscription found with ID:', subscriptionId);
      return { isActive: false, expiryDate: null };
    }
    
    console.log(`Subscription status: ${subscription.status}`);
    
    const isActive = 
      subscription.status === 'active' || 
      subscription.status === 'trialing';
      
    let expiryDate = null;
    
    if (subscription.current_period_end) {
      expiryDate = new Date(subscription.current_period_end * 1000).toISOString();
    }
    
    return { isActive, expiryDate };
  } catch (error) {
    console.error('Error verifying subscription with Stripe:', error);
    return { isActive: false, expiryDate: null };
  }
};
