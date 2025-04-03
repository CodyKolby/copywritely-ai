
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner';

export const checkPremiumStatus = async (userId: string, showToast = false): Promise<boolean> => {
  try {
    console.log('Checking premium status for user:', userId);
    
    // SIMPLIFIED PROCESS: First try direct database check as it's most reliable
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium, subscription_id, subscription_status, subscription_expiry')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('Error checking premium in database:', profileError);
    } else if (profile) {
      console.log('Retrieved profile data:', {
        is_premium: profile.is_premium,
        subscription_id: profile.subscription_id ? 'Has subscription ID' : 'No subscription ID',
        subscription_status: profile.subscription_status || 'Not set',
        subscription_expiry: profile.subscription_expiry || 'No expiry date'
      });
      
      // If profile says premium, trust it and return immediately
      if (profile.is_premium) {
        console.log('User has premium status according to database');
        
        if (showToast) {
          toast.success('Twoje konto ma status Premium!', {
            dismissible: true
          });
        }
        
        return true;
      }
    }
    
    // If DB check didn't confirm premium, try edge function
    console.log('DB check did not confirm premium status, trying edge function check');
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription-status', {
        body: { userId }
      });
      
      if (error) {
        console.error('Error checking premium status with edge function:', error);
      } else {
        const isPremium = data?.isPremium || false;
        console.log('Premium status from edge function:', isPremium);
        
        if (isPremium) {
          // Force sync the database with the edge function result
          try {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ is_premium: true })
              .eq('id', userId);
              
            if (updateError) {
              console.error('Error syncing premium status with database:', updateError);
            }
          } catch (syncError) {
            console.error('Exception syncing premium status with database:', syncError);
          }
          
          if (showToast) {
            toast.success('Twoje konto ma status Premium!', {
              dismissible: true
            });
          }
          
          return true;
        }
      }
    } catch (edgeFunctionError) {
      console.error('Exception in edge function call:', edgeFunctionError);
    }
    
    // Last resort: Try a direct check of payment logs
    try {
      console.log('Checking payment logs for premium status');
      const { data: logs, error: logsError } = await supabase
        .from('payment_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(1);
        
      if (logsError) {
        console.error('Error checking payment logs:', logsError);
      } else if (logs && logs.length > 0) {
        console.log('Found payment logs, assuming premium status');
        
        // Force update of premium status based on payment logs
        try {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ is_premium: true })
            .eq('id', userId);
            
          if (updateError) {
            console.error('Error updating premium status from logs:', updateError);
          }
        } catch (updateError) {
          console.error('Exception updating premium status from logs:', updateError);
        }
        
        if (showToast) {
          toast.success('Znaleziono płatność! Twoje konto ma status Premium!', {
            dismissible: true
          });
        }
        
        return true;
      }
    } catch (logsError) {
      console.error('Exception checking payment logs:', logsError);
    }
    
    return false;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
}

// Simplified fallback function
export const checkPremiumStatusFallback = async (userId: string, showToast = false): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error checking premium status (fallback):', error);
      return false;
    }
    
    // Trust the database value
    const isPremium = data?.is_premium || false;
    
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
