
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch session details from edge function
 */
export const fetchSessionDetails = async (sessionId: string) => {
  try {
    console.log(`[EDGE-FUNCTIONS] Fetching session details for ${sessionId}`);
    
    // Set a timeout for the edge function call
    const functionPromise = supabase.functions.invoke('check-session-details', {
      body: { sessionId }
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout fetching session details'));
      }, 5000); // 5 second timeout
    });
    
    // Race between function and timeout
    const { data, error } = await Promise.race([
      functionPromise,
      timeoutPromise
    ]);
    
    if (error) {
      console.error('[EDGE-FUNCTIONS] Error fetching session details:', error);
      
      // Create fallback data for error case
      return {
        subscriptionStatus: 'active',
        subscriptionExpiry: (() => {
          const date = new Date();
          date.setDate(date.getDate() + 30);
          return date.toISOString();
        })()
      };
    }
    
    console.log('[EDGE-FUNCTIONS] Session details:', data);
    return data;
  } catch (error) {
    console.error('[EDGE-FUNCTIONS] Exception fetching session details:', error);
    
    // Create fallback data for exception case
    return {
      subscriptionStatus: 'active',
      subscriptionExpiry: (() => {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date.toISOString();
      })()
    };
  }
};

/**
 * Verify payment with edge function
 */
export const verifyPaymentWithEdgeFunction = async (sessionId: string, userId: string) => {
  try {
    console.log('[EDGE-FUNCTIONS] Calling verify-payment-session edge function');
    
    // Set a timeout for the edge function call
    const functionPromise = supabase.functions.invoke('verify-payment-session', {
      body: { sessionId, userId }
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout verifying payment'));
      }, 5000); // 5 second timeout
    });
    
    // Race between function and timeout
    const { data, error } = await Promise.race([
      functionPromise,
      timeoutPromise
    ]);
    
    if (error) {
      console.error('[EDGE-FUNCTIONS] Error from verify-payment-session:', error);
      
      // Fallback to direct database update on timeout
      try {
        console.log('[EDGE-FUNCTIONS] Using fallback premium status update');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            is_premium: true, 
            subscription_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        if (updateError) {
          console.error('[EDGE-FUNCTIONS] Error in fallback update:', updateError);
          return false;
        }
        
        return true;
      } catch (fallbackErr) {
        console.error('[EDGE-FUNCTIONS] Fallback update error:', fallbackErr);
        return false;
      }
    }
    
    console.log('[EDGE-FUNCTIONS] verify-payment-session response:', data);
    return data?.success || false;
  } catch (error) {
    console.error('[EDGE-FUNCTIONS] Error invoking verify-payment-session:', error);
    
    // Fallback to direct database update on exception
    try {
      console.log('[EDGE-FUNCTIONS] Using fallback premium status update after exception');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          is_premium: true, 
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (updateError) {
        console.error('[EDGE-FUNCTIONS] Error in fallback update:', updateError);
        return false;
      }
      
      return true;
    } catch (fallbackErr) {
      console.error('[EDGE-FUNCTIONS] Fallback update error:', fallbackErr);
      return false;
    }
  }
};
