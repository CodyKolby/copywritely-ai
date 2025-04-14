
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";

export function getSupabaseAdmin() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function updatePremiumStatus(userId: string, isPremium: boolean, subscriptionId?: string, subscriptionStatus = 'active', subscriptionExpiry?: string) {
  try {
    const supabase = getSupabaseAdmin();
    
    // Set expiry to 30 days from now if not provided and isPremium is true
    if (!subscriptionExpiry && isPremium) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      subscriptionExpiry = expiryDate.toISOString();
    }
    
    const updateData: Record<string, any> = { 
      is_premium: isPremium,
      subscription_status: isPremium ? subscriptionStatus : 'inactive',
      updated_at: new Date().toISOString()
    };
    
    if (subscriptionId) {
      updateData.subscription_id = subscriptionId;
    }
    
    if (subscriptionExpiry) {
      updateData.subscription_expiry = subscriptionExpiry;
    }
    
    console.log('[DB] Updating profile with:', updateData);
    
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);
      
    if (error) {
      console.error('[DB] Error updating profile:', error);
      return false;
    }
    
    console.log('[DB] Profile updated successfully');
    return true;
  } catch (error) {
    console.error('[DB] Exception updating profile:', error);
    return false;
  }
}
