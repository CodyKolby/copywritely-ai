
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";

// CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create Supabase client
export function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Verify that user exists
export async function verifyUser(supabase: any, userId: string) {
  try {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError) {
      console.error('Error verifying user:', userError);
      return false;
    }
    
    if (!userData.user) {
      console.error('User not found in auth system:', userId);
      return false;
    }
    
    console.log('User verified in auth system:', userData.user.id);
    return true;
  } catch (error) {
    console.error('Exception checking user in auth system:', error);
    return false;
  }
}

// Check if subscription has expired
export function isSubscriptionExpired(expiryDateStr: string) {
  const expiryDate = new Date(expiryDateStr);
  const now = new Date();
  
  console.log('Checking expiry date:', {
    expiry: expiryDate.toISOString(),
    now: now.toISOString(),
    isExpired: expiryDate <= now
  });
  
  return expiryDate <= now;
}

// Verify subscription with Stripe
export async function verifyStripeSubscription(subscriptionId: string, stripeSecretKey: string) {
  try {
    console.log('Validating subscription with Stripe:', subscriptionId);
    const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (response.ok) {
      const subscription = await response.json();
      console.log('Stripe subscription status:', subscription.status);
      
      const isActive = subscription.status === 'active' || subscription.status === 'trialing';
      
      if (isActive && subscription.current_period_end) {
        const expiryTimestamp = subscription.current_period_end * 1000; // Convert to milliseconds
        const expiryDate = new Date(expiryTimestamp);
        const now = new Date();
        
        console.log('Checking Stripe period end:', {
          expiry: expiryDate.toISOString(),
          now: now.toISOString(),
          isExpired: expiryDate <= now
        });
        
        if (expiryDate <= now) {
          console.log('Subscription period has ended:', expiryDate);
          return { 
            isActive: false, 
            expiryDate: expiryDate.toISOString() 
          };
        }
        
        return { 
          isActive: true, 
          expiryDate: expiryDate.toISOString() 
        };
      }
      
      return { isActive, expiryDate: null };
    } 
    
    console.error('Failed to fetch subscription from Stripe:', await response.text());
    return { isActive: false, expiryDate: null };
  } catch (error) {
    console.error('Error validating with Stripe:', error);
    return { isActive: false, expiryDate: null };
  }
}
