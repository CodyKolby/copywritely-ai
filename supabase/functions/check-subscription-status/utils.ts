
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";
import { Stripe } from "https://esm.sh/stripe@12.6.0";

// CORS headers for all responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create Supabase client with Service Role Key
export const getSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Verify if user exists in auth system
export const verifyUser = async (supabase: any, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .auth
      .admin
      .getUserById(userId);
      
    if (error || !data?.user) {
      console.error('Error verifying user in auth system:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception verifying user:', error);
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
    console.error('Error checking expiry date:', error);
    return false; // Assume not expired if there's an error
  }
};

// Verify subscription with Stripe
export const verifyStripeSubscription = async (
  subscriptionId: string, 
  stripeSecretKey: string
): Promise<{ isActive: boolean; expiryDate?: string }> => {
  try {
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16', // Use an appropriate API version
    });
    
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Check if subscription is active 
    const isActive = subscription.status === 'active' || 
                     subscription.status === 'trialing';
    
    // Get expiry date from current period end
    const expiryDate = subscription.current_period_end ? 
      new Date(subscription.current_period_end * 1000).toISOString() : undefined;
    
    return { isActive, expiryDate };
  } catch (error) {
    console.error('Error verifying subscription with Stripe:', error);
    
    // Return false on error - will fall back to database check
    return { isActive: false };
  }
};
