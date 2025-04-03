
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
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Get Stripe API key
export function getStripeSecretKey() {
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeSecretKey) {
    throw new Error('Missing Stripe API key in server configuration');
  }
  return stripeSecretKey;
}

// Ensure user profile exists
export async function ensureUserProfile(supabase: any, userId: string) {
  try {
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError) {
      console.error('Error checking profile:', profileError);
    }
    
    // If profile doesn't exist, create it
    if (!profile) {
      console.log(`Creating profile for user ${userId}`);
      
      const { error: createError } = await supabase
        .from('profiles')
        .insert({ id: userId });
        
      if (createError) {
        console.error('Error creating profile:', createError);
      }
    } else {
      console.log(`Profile exists for user ${userId}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring user profile:', error);
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
  try {
    console.log(`Updating premium status for user ${userId}`);
    
    // Prepare update data
    const updateData: Record<string, any> = {
      is_premium: true,
      premium_updated_at: new Date().toISOString()
    };
    
    // Add subscription data if available
    if (subscriptionId) updateData.subscription_id = subscriptionId;
    if (subscriptionStatus) updateData.subscription_status = subscriptionStatus;
    if (subscriptionExpiry) updateData.subscription_expiry = subscriptionExpiry;
    
    console.log('Update data:', updateData);
    
    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error updating profile:', updateError);
      return false;
    }
    
    console.log('Successfully updated profile is_premium to TRUE');
    return true;
  } catch (error) {
    console.error('Error updating profile:', error);
    return false;
  }
}

// Verify profile was updated successfully
export async function verifyProfileUpdate(supabase: any, userId: string) {
  try {
    console.log(`Verifying profile update for user ${userId}`);
    
    // Get profile with retry logic
    for (let i = 0; i < 3; i++) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_premium, subscription_status, subscription_expiry')
        .eq('id', userId)
        .single();
        
      if (profileError) {
        console.error(`Verification attempt ${i+1} failed:`, profileError);
      } else if (profile && profile.is_premium) {
        console.log('Verified profile is premium:', profile);
        return { success: true, profile };
      } else if (profile) {
        console.log(`Attempt ${i+1}: Profile found but is_premium is ${profile.is_premium}`);
      }
      
      // Wait before retry
      if (i < 2) {
        console.log(`Waiting before retry ${i+1}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Final check without retry
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    console.log('Final profile check:', finalProfile);
    
    return { 
      success: finalProfile?.is_premium === true, 
      profile: finalProfile 
    };
  } catch (error) {
    console.error('Error verifying profile update:', error);
    return { success: false, profile: null };
  }
}
