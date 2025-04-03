
// Check for payment logs as evidence of premium purchase
export const checkPaymentLogs = async (supabase: any, userId: string): Promise<boolean> => {
  try {
    const { data: paymentLogs, error: logsError } = await supabase
      .from('payment_logs')
      .select('*')
      .eq('user_id', userId)
      .limit(1);
      
    if (logsError) {
      console.error('Error checking payment logs:', logsError);
      return false;
    } 
    
    return paymentLogs && paymentLogs.length > 0;
  } catch (error) {
    console.error('Exception checking payment logs:', error);
    return false;
  }
};

// Create a basic profile for a user
export const createBasicProfile = async (supabase: any, userId: string, isPremium = false): Promise<boolean> => {
  try {
    const { error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        is_premium: isPremium
      });
      
    if (createError) {
      console.error('Error creating missing profile:', createError);
      return false;
    } 
    
    console.log('Created basic profile for missing user');
    return true;
  } catch (createError) {
    console.error('Exception creating profile:', createError);
    return false;
  }
};

// Update premium status based on payment logs
export const updateProfileFromPaymentLogs = async (supabase: any, userId: string): Promise<boolean> => {
  try {
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({ 
        id: userId,
        is_premium: true,
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      });
      
    if (updateError) {
      console.error('Error creating payment-based profile:', updateError);
      return false;
    } 
    
    console.log('Created/updated profile based on payment logs');
    return true;
  } catch (updateError) {
    console.error('Exception creating payment-based profile:', updateError);
    return false;
  }
};
