import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner';

export const checkPremiumStatus = async (userId: string, showToast = false): Promise<boolean> => {
  try {
    console.log('Checking premium status for user:', userId);
    
    // First try direct database check as it's most reliable
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium, subscription_id, subscription_status')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('Error checking premium in database:', profileError);
    } else if (profile) {
      console.log('Retrieved profile data:', {
        is_premium: profile.is_premium,
        subscription_id: profile.subscription_id ? 'Has subscription ID' : 'No subscription ID',
        subscription_status: profile.subscription_status || 'Not set'
      });
      
      if (profile.is_premium) {
        console.log('User has premium status according to database:', profile.is_premium);
        
        if (showToast) {
          toast.success('Twoje konto ma status Premium!', {
            dismissible: true
          });
        }
        
        return true;
      }
    }
    
    // Then try edge function
    console.log('DB check did not confirm premium status, trying edge function check');
    const { data, error } = await supabase.functions.invoke('check-subscription-status', {
      body: { userId }
    });
    
    if (error) {
      console.error('Error checking premium status with edge function:', error);
      // Fallback to database check
      return await checkPremiumStatusFallback(userId, showToast);
    }
    
    const isPremium = data?.isPremium || false;
    console.log('Premium status from edge function:', isPremium);
    
    // Add a forced DB check for consistency
    if (isPremium) {
      console.log('Edge function says premium=true, syncing with database');
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_premium')
          .eq('id', userId)
          .single();
          
        if (profile && !profile.is_premium) {
          console.log('Detected inconsistency - edge function says premium but DB says not premium');
          console.log('Forcing update of profile to premium status');
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ is_premium: true })
            .eq('id', userId);
            
          if (updateError) {
            console.error('Error updating premium status in DB:', updateError);
          } else {
            console.log('Successfully synchronized premium status in database');
          }
        }
      } catch (syncError) {
        console.error('Error syncing premium status with database:', syncError);
      }
    }
    
    if (isPremium && showToast) {
      toast.success('Twoje konto ma status Premium!', {
        dismissible: true
      });
    }
    
    return isPremium;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return await checkPremiumStatusFallback(userId, showToast);
  }
}

export const checkPremiumStatusFallback = async (userId: string, showToast = false): Promise<boolean> => {
  try {
    console.log('Using fallback method to check premium status');
    const { data, error } = await supabase
      .from('profiles')
      .select('is_premium, subscription_id, subscription_status, subscription_expiry')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error checking premium status (fallback):', error);
      return false;
    }
    
    // Check multiple indicators of premium status
    let isPremium = data?.is_premium || false;
    
    // Check subscription status if available
    if (data?.subscription_status === 'active' || data?.subscription_status === 'trialing') {
      isPremium = true;
      
      // Update database if there's inconsistency
      if (!data.is_premium) {
        console.log('Subscription is active but is_premium flag is false. Fixing...');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_premium: true })
          .eq('id', userId);
          
        if (updateError) {
          console.error('Error updating premium flag:', updateError);
        } else {
          console.log('Successfully updated is_premium to TRUE based on subscription status');
        }
      }
    }
    
    // Check subscription expiry if available
    if (data?.subscription_expiry && !isPremium) {
      const expiryDate = new Date(data.subscription_expiry);
      const now = new Date();
      
      if (expiryDate > now) {
        console.log('User has valid subscription until:', expiryDate);
        isPremium = true;
        
        // Update database if there's inconsistency
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_premium: true })
          .eq('id', userId);
          
        if (updateError) {
          console.error('Error updating premium flag based on expiry:', updateError);
        } else {
          console.log('Successfully updated is_premium to TRUE based on valid expiry date');
        }
      }
    }
    
    console.log('Premium status from database fallback:', isPremium);
    
    if (isPremium && showToast) {
      toast.success('Twoje konto ma status Premium!', {
        dismissible: true
      });
    }
    
    return isPremium;
  } catch (fallbackError) {
    console.error('Error in fallback premium status check:', fallbackError);
    return false;
  }
}

