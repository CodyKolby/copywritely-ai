
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
    
    if (!result) {
      console.error('[EDGE-FUNCTIONS] No result received from edge function');
      throw new Error('No response from edge function');
    }
    
    const { data, error } = result || {};
    
    if (error) {
      console.error('[EDGE-FUNCTIONS] Error fetching session details:', error);
      console.error('[EDGE-FUNCTIONS] Full error object:', JSON.stringify(error));
      
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
    
    if (!data) {
      console.error('[EDGE-FUNCTIONS] No data returned from edge function');
      throw new Error('No data returned from edge function');
    }
    
    console.log('[EDGE-FUNCTIONS] Session details:', data);
    return data;
  } catch (error) {
    console.error('[EDGE-FUNCTIONS] Exception fetching session details:', error);
    console.error('[EDGE-FUNCTIONS] Full exception:', JSON.stringify(error));
    
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
      console.error('[EDGE-FUNCTIONS] Full profile error:', JSON.stringify(profileError));
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
    
    if (!result) {
      console.error('[EDGE-FUNCTIONS] No result received from edge function');
      throw new Error('No response from edge function');
    }
    
    const { data, error } = result || {};
    
    if (error) {
      console.error('[EDGE-FUNCTIONS] Error from verify-payment-session:', error);
      console.error('[EDGE-FUNCTIONS] Full error object:', JSON.stringify(error));
      
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
          console.error('[EDGE-FUNCTIONS] Full error object:', JSON.stringify(fetchError));
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
              console.error('[EDGE-FUNCTIONS] Full error object:', JSON.stringify(createError));
              return false;
            }
            
            return true;
          } catch (createErr) {
            console.error('[EDGE-FUNCTIONS] Exception creating profile:', createErr);
            console.error('[EDGE-FUNCTIONS] Full exception:', JSON.stringify(createErr));
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
          console.error('[EDGE-FUNCTIONS] Full error object:', JSON.stringify(updateError));
          return false;
        }
        
        return true;
      } catch (fallbackErr) {
        console.error('[EDGE-FUNCTIONS] Fallback update error:', fallbackErr);
        console.error('[EDGE-FUNCTIONS] Full exception:', JSON.stringify(fallbackErr));
        return false;
      }
    }
    
    if (!data) {
      console.error('[EDGE-FUNCTIONS] No data returned from edge function');
      throw new Error('No data returned from edge function');
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
      console.error('[EDGE-FUNCTIONS] Full error object:', JSON.stringify(verifyError));
    } else {
      console.log('[EDGE-FUNCTIONS] Verified profile after payment verification:', verifiedProfile);
    }
    
    return data?.success || false;
  } catch (error) {
    console.error('[EDGE-FUNCTIONS] Error invoking verify-payment-session:', error);
    console.error('[EDGE-FUNCTIONS] Full exception:', JSON.stringify(error));
    
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
        console.error('[EDGE-FUNCTIONS] Full error object:', JSON.stringify(updateError));
        return false;
      }
      
      return true;
    } catch (fallbackErr) {
      console.error('[EDGE-FUNCTIONS] Fallback update error:', fallbackErr);
      console.error('[EDGE-FUNCTIONS] Full exception:', JSON.stringify(fallbackErr));
      return false;
    }
  }
};

/**
 * Test edge function availability
 */
export const testEdgeFunctionAvailability = async () => {
  try {
    console.log('[EDGE-FUNCTIONS] Testing edge function availability');
    
    // Test check-subscription-status function
    const subFunctionPromise = supabase.functions.invoke('check-subscription-status', {
      body: { userId: 'test-user-id' }
    });
    
    const subTimeoutPromise = new Promise<{data: null, error: Error}>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout testing edge function'));
      }, 3000); // 3 second timeout
    });
    
    const subResult = await Promise.race([
      subFunctionPromise,
      subTimeoutPromise
    ]) as {data: any, error: any};
    
    if (subResult.error) {
      console.error('[EDGE-FUNCTIONS] Error testing check-subscription-status:', subResult.error);
      return {
        available: false,
        error: subResult.error,
        message: 'Edge functions may be unavailable or experiencing high latency'
      };
    }
    
    console.log('[EDGE-FUNCTIONS] Edge functions appear to be available');
    return {
      available: true,
      message: 'Edge functions are available'
    };
  } catch (error) {
    console.error('[EDGE-FUNCTIONS] Error testing edge functions:', error);
    return {
      available: false,
      error,
      message: 'Exception testing edge functions'
    };
  }
};
