
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner';

export const checkPremiumStatus = async (userId: string, showToast = false): Promise<boolean> => {
  try {
    console.log('Checking premium status for user:', userId);
    const { data, error } = await supabase.functions.invoke('check-subscription-status', {
      body: { userId }
    });
    
    if (error) {
      console.error('Error checking premium status:', error);
      // Fallback to database check
      return await checkPremiumStatusFallback(userId, showToast);
    }
    
    const isPremium = data?.isPremium || false;
    console.log('Premium status from edge function:', isPremium);
    
    if (isPremium && showToast) {
      toast.success('Twoje konto ma status Premium!');
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
      .select('is_premium')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error checking premium status (fallback):', error);
      return false;
    }
    
    const isPremium = data?.is_premium || false;
    console.log('Premium status from database fallback:', isPremium);
    
    if (isPremium && showToast) {
      toast.success('Twoje konto ma status Premium!');
    }
    
    return isPremium;
  } catch (fallbackError) {
    console.error('Error in fallback premium status check:', fallbackError);
    return false;
  }
}
