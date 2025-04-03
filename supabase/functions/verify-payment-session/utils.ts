
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Define CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create Supabase client
export function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Get Stripe API key
export function getStripeSecretKey() {
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeSecretKey) {
    console.error('STRIPE_SECRET_KEY is not set in environment variables');
    throw new Error('Missing Stripe API key in server configuration');
  }
  return stripeSecretKey;
}

// Verify user exists in auth system
export async function verifyUser(supabase: any, userId: string) {
  try {
    console.log(`Checking if user ${userId} exists in auth system`);
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
  } catch (userCheckError) {
    console.error('Exception checking user in auth system:', userCheckError);
    return false;
  }
}

// Update profile with premium status
export async function updateProfileWithPremium(
  supabase: any, 
  userId: string, 
  subscriptionId?: string, 
  subscriptionStatus?: string,
  subscriptionExpiry?: string
) {
  const updateData: Record<string, any> = {
    is_premium: true
  };
  
  // Only add these fields if they have values
  if (subscriptionId) updateData.subscription_id = subscriptionId;
  if (subscriptionStatus) updateData.subscription_status = subscriptionStatus;
  if (subscriptionExpiry) updateData.subscription_expiry = subscriptionExpiry;
  
  try {
    console.log(`Updating profile for user ${userId} with premium status`);
    console.log('Update data:', updateData);
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return false;
    }
    
    console.log('Successfully updated profile is_premium to TRUE');
    return true;
  } catch (error) {
    console.error('Exception updating profile:', error);
    return false;
  }
}

// Create profile if it doesn't exist
export async function createProfileIfNotExists(
  supabase: any, 
  userId: string,
  subscriptionId?: string, 
  subscriptionStatus?: string,
  subscriptionExpiry?: string
) {
  try {
    console.log(`Creating new profile for user ${userId} with premium status`);
    
    const profile = {
      id: userId,
      is_premium: true
    } as Record<string, any>;
    
    // Add subscription data if available
    if (subscriptionId) profile.subscription_id = subscriptionId;
    if (subscriptionStatus) profile.subscription_status = subscriptionStatus;
    if (subscriptionExpiry) profile.subscription_expiry = subscriptionExpiry;
    
    console.log('Profile data to be created:', profile);
    
    const { error: createError } = await supabase
      .from('profiles')
      .insert(profile);
      
    if (createError) {
      console.error('Error creating user profile:', createError);
      return false;
    }
    
    console.log('Successfully created new profile with premium status');
    return true;
  } catch (error) {
    console.error('Exception creating profile:', error);
    return false;
  }
}

// Verify profile was updated successfully
export async function verifyProfileUpdate(supabase: any, userId: string) {
  let retries = 0;
  const maxRetries = 3;
  
  console.log(`Verifying profile update for user ${userId}`);
  
  while (retries < maxRetries) {
    try {
      console.log(`Verification attempt ${retries + 1} of ${maxRetries}`);
      
      const { data: profile, error: verifyError } = await supabase
        .from('profiles')
        .select('is_premium, subscription_status, subscription_expiry')
        .eq('id', userId)
        .single();
        
      if (verifyError) {
        console.error(`Verification attempt ${retries + 1} failed:`, verifyError);
      } else if (!profile.is_premium) {
        console.error(`Verification attempt ${retries + 1}: Profile found but is_premium is still false`);
      } else {
        console.log('Verified profile status after update:', profile);
        return { success: true, profile };
      }
      
      // Wait before retry
      console.log(`Waiting before retry ${retries + 1}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries++;
    } catch (error) {
      console.error(`Error in verification attempt ${retries + 1}:`, error);
      retries++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.warn(`All ${maxRetries} verification attempts failed`);
  return { success: false, profile: null };
}
