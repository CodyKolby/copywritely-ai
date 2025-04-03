
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch session details from edge function
 */
export const fetchSessionDetails = async (sessionId: string) => {
  try {
    console.log(`[EDGE-FUNCTIONS] Fetching session details for ${sessionId}`);
    
    const { data, error } = await supabase.functions.invoke('check-session-details', {
      body: { sessionId }
    });
    
    if (error) {
      console.error('[EDGE-FUNCTIONS] Error fetching session details:', error);
      return null;
    }
    
    console.log('[EDGE-FUNCTIONS] Session details:', data);
    return data;
  } catch (error) {
    console.error('[EDGE-FUNCTIONS] Exception fetching session details:', error);
    return null;
  }
};

/**
 * Verify payment with edge function
 */
export const verifyPaymentWithEdgeFunction = async (sessionId: string, userId: string) => {
  try {
    console.log('[EDGE-FUNCTIONS] Calling verify-payment-session edge function');
    
    const { data, error } = await supabase.functions.invoke('verify-payment-session', {
      body: { sessionId, userId }
    });
    
    if (error) {
      console.error('[EDGE-FUNCTIONS] Error from verify-payment-session:', error);
      return false;
    }
    
    console.log('[EDGE-FUNCTIONS] verify-payment-session response:', data);
    return data?.success || false;
  } catch (error) {
    console.error('[EDGE-FUNCTIONS] Error invoking verify-payment-session:', error);
    return false;
  }
};
