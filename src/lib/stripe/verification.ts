
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Direct verification with the Edge Function
export const verifyStripePayment = async (sessionId: string, userId: string): Promise<boolean> => {
  try {
    console.log(`Verifying payment for session: ${sessionId}, user: ${userId}`);
    
    const { data, error } = await supabase.functions.invoke('verify-payment-session', {
      body: { sessionId, userId }
    });
    
    if (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
    
    return data?.success || false;
  } catch (error) {
    console.error('Exception verifying payment:', error);
    return false;
  }
};

// Manual premium status update as fallback
export const forceUpdatePremiumStatus = async (userId: string): Promise<boolean> => {
  try {
    console.log(`Forcing premium status update for user: ${userId}`);
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_premium: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (error) {
      console.error('Error updating premium status:', error);
      return false;
    }
    
    toast.success('Twoje konto zostało zaktualizowane do wersji Premium!');
    return true;
  } catch (error) {
    console.error('Exception updating premium status:', error);
    return false;
  }
};

// Check if payment is logged in database
export const checkPaymentLogs = async (sessionId: string): Promise<boolean> => {
  try {
    console.log(`Checking payment logs for session: ${sessionId}`);
    
    const { data, error } = await supabase
      .from('payment_logs')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();
      
    if (error) {
      console.error('Error checking payment logs:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Exception checking payment logs:', error);
    return false;
  }
};
