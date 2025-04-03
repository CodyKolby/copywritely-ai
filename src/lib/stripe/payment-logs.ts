
import { supabase } from '@/integrations/supabase/client';

/**
 * Check if payment is logged in database
 */
export const checkPaymentLogs = async (sessionId: string): Promise<boolean> => {
  try {
    console.log(`[PAYMENT-LOGS] Checking payment logs for session: ${sessionId}`);
    
    const { data, error } = await supabase
      .from('payment_logs')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();
      
    if (error) {
      console.error('[PAYMENT-LOGS] Error checking payment logs:', error);
      return false;
    }
    
    console.log('[PAYMENT-LOGS] Payment log data:', data);
    return !!data;
  } catch (error) {
    console.error('[PAYMENT-LOGS] Exception checking payment logs:', error);
    return false;
  }
};

/**
 * Add payment log entry
 */
export const addPaymentLog = async (userId: string, sessionId: string, subscriptionId?: string, customer?: string, customerEmail?: string): Promise<boolean> => {
  try {
    const { data: existingLog } = await supabase
      .from('payment_logs')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();
      
    if (existingLog) {
      console.log('[PAYMENT-LOGS] Payment log already exists for session:', sessionId);
      return true;
    }
    
    console.log('[PAYMENT-LOGS] Adding payment log for session:', sessionId);
    
    // Create properly typed object for insertion
    const logData = {
      user_id: userId,
      session_id: sessionId,
      timestamp: new Date().toISOString()
    };
    
    // Add optional fields only if they exist
    if (subscriptionId) {
      logData['subscription_id'] = subscriptionId;
    }
    
    if (customer) {
      logData['customer'] = customer;
    }
    
    if (customerEmail) {
      logData['customer_email'] = customerEmail;
    }
    
    const { error } = await supabase
      .from('payment_logs')
      .insert(logData);
      
    if (error) {
      console.error('[PAYMENT-LOGS] Error adding payment log:', error);
      return false;
    }
    
    console.log('[PAYMENT-LOGS] Payment log added successfully');
    return true;
  } catch (error) {
    console.error('[PAYMENT-LOGS] Exception adding payment log:', error);
    return false;
  }
};
