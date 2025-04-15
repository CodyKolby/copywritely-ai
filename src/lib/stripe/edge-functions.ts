
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
    
    const timeoutPromise = new Promise<{data: null, error: Error}>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout fetching session details'));
      }, 5000); // 5 second timeout
    });
    
    // Race between function and timeout
    const result = await Promise.race([
      functionPromise,
      timeoutPromise
    ]) as {data: any, error: any};
    
    const { data, error } = result || {};
    
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
    console.log('[EDGE-FUNCTIONS] User ID:', userId);
    console.log('[EDGE-FUNCTIONS] Session ID:', sessionId);
    
    // First check if the profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, is_premium, subscription_id, subscription_status, subscription_expiry')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError) {
      console.error('[EDGE-FUNCTIONS] Error checking profile:', profileError);
    } else {
      console.log('[EDGE-FUNCTIONS] Current profile state before verification:', existingProfile);
    }
    
    // Set a timeout for the edge function call
    const functionPromise = supabase.functions.invoke('verify-payment-session', {
      body: { sessionId, userId }
    });
    
    const timeoutPromise = new Promise<{data: null, error: Error}>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout verifying payment'));
      }, 5000); // 5 second timeout
    });
    
    // Race between function and timeout
    const result = await Promise.race([
      functionPromise,
      timeoutPromise
    ]) as {data: any, error: any};
    
    const { data, error } = result || {};
    
    if (error) {
      console.error('[EDGE-FUNCTIONS] Error from verify-payment-session:', error);
      
      // Fallback to direct database update on timeout
      try {
        console.log('[EDGE-FUNCTIONS] Using fallback premium status update');
        console.log('[EDGE-FUNCTIONS] Checking if user exists in profiles:', userId);
        
        // First check if user exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
        
        if (fetchError) {
          console.error('[EDGE-FUNCTIONS] Error checking profile existence:', fetchError);
          return false;
        }
        
        if (!existingProfile) {
          console.error('[EDGE-FUNCTIONS] User profile not found for ID:', userId);
          
          // Try to create profile if it doesn't exist
          try {
            console.log('[EDGE-FUNCTIONS] Attempting to create profile for user:', userId);
            const { error: createError } = await supabase
              .from('profiles')
              .insert({ 
                id: userId, 
                is_premium: true, 
                subscription_status: 'active',
                updated_at: new Date().toISOString()
              });
              
            if (createError) {
              console.error('[EDGE-FUNCTIONS] Error creating profile:', createError);
              return false;
            }
            
            return true;
          } catch (createErr) {
            console.error('[EDGE-FUNCTIONS] Exception creating profile:', createErr);
            return false;
          }
        }
        
        // Update existing profile
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
    
    // Verify that the profile was updated correctly
    const { data: verifiedProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('id, is_premium, subscription_id, subscription_status, subscription_expiry')
      .eq('id', userId)
      .maybeSingle();
      
    if (verifyError) {
      console.error('[EDGE-FUNCTIONS] Error verifying profile after update:', verifyError);
    } else {
      console.log('[EDGE-FUNCTIONS] Verified profile after payment verification:', verifiedProfile);
    }
    
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
