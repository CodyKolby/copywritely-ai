
// Update user profile premium status
export const updatePremiumStatus = async (
  supabase: any, 
  userId: string, 
  isPremium: boolean, 
  status: string = 'active',
  expiryDate?: string
): Promise<boolean> => {
  try {
    const updateData: Record<string, any> = { 
      is_premium: isPremium,
      subscription_status: status,
      updated_at: new Date().toISOString()
    };
    
    if (expiryDate) {
      updateData.subscription_expiry = expiryDate;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);
      
    if (error) {
      console.error(`Error updating profile to ${isPremium ? 'premium' : 'non-premium'}:`, error);
      return false;
    }
    
    console.log(`Successfully updated profile to ${isPremium ? 'premium' : 'non-premium'}${expiryDate ? ` with expiry date ${expiryDate}` : ''}`);
    return true;
  } catch (error) {
    console.error(`Exception updating profile to ${isPremium ? 'premium' : 'non-premium'}:`, error);
    return false;
  }
};

// Get user profile
export const getProfile = async (supabase: any, userId: string) => {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium, subscription_status, subscription_expiry, subscription_id')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return null;
    }
    
    return profile;
  } catch (error) {
    console.error('Exception fetching profile:', error);
    return null;
  }
};
