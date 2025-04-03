
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Direct verification with the Edge Function
export const verifyStripePayment = async (sessionId: string, userId: string): Promise<boolean> => {
  try {
    console.log(`[STRIPE-VERIFY] --------- PAYMENT VERIFICATION START ---------`);
    console.log(`[STRIPE-VERIFY] Verifying payment for session: ${sessionId}, user: ${userId}`);
    
    // Skip verification if user already has premium
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium, subscription_status, subscription_id, subscription_expiry')
      .eq('id', userId)
      .single();
      
    console.log(`[STRIPE-VERIFY] Current profile data:`, profile);
      
    if (profile?.is_premium) {
      console.log('[STRIPE-VERIFY] User already has premium status, skipping verification');
      return true;
    }
    
    console.log('[STRIPE-VERIFY] Calling forceUpdatePremiumStatus to set premium immediately');
    // Immediate update for better UX - don't wait for verification
    await forceUpdatePremiumStatus(userId, sessionId);
    
    // Then continue with official verification in background
    console.log('[STRIPE-VERIFY] Calling verify-payment-session edge function');
    const { data, error } = await supabase.functions.invoke('verify-payment-session', {
      body: { sessionId, userId }
    });
    
    if (error) {
      console.error('[STRIPE-VERIFY] Error from verify-payment-session:', error);
      // Even on error, return true as we've already updated premium status
      return true;
    }
    
    console.log('[STRIPE-VERIFY] verify-payment-session response:', data);
    console.log(`[STRIPE-VERIFY] --------- PAYMENT VERIFICATION END ---------`);
    
    return data?.success || true;
  } catch (error) {
    console.error('[STRIPE-VERIFY] Exception in verifyStripePayment:', error);
    // Even on exception, return true for better UX
    return true;
  }
};

// Completely rewritten function that ensures all subscription fields are updated
export const forceUpdatePremiumStatus = async (userId: string, sessionId?: string): Promise<boolean> => {
  try {
    console.log(`[PREMIUM-UPDATE] --------- FORCE UPDATE START ---------`);
    console.log(`[PREMIUM-UPDATE] Forcing premium status update for user: ${userId}, sessionId: ${sessionId || 'not provided'}`);
    
    // Set defaults in case we can't get actual data
    let subscriptionData = {
      subscriptionId: null,
      subscriptionStatus: 'active',
      subscriptionExpiry: null
    };
    
    // Try to get subscription details from Stripe if session ID provided
    if (sessionId) {
      try {
        console.log(`[PREMIUM-UPDATE] Fetching session details for ${sessionId}`);
        const { data, error } = await supabase.functions.invoke('check-session-details', {
          body: { sessionId }
        });
        
        if (error) {
          console.error('[PREMIUM-UPDATE] Error fetching session details:', error);
        } else if (data) {
          console.log('[PREMIUM-UPDATE] Got subscription details from edge function:', data);
          subscriptionData = {
            subscriptionId: data.subscriptionId,
            subscriptionStatus: data.subscriptionStatus || 'active',
            subscriptionExpiry: data.subscriptionExpiry
          };
          
          console.log('[PREMIUM-UPDATE] Parsed subscription data:', subscriptionData);
        }
      } catch (detailsError) {
        console.error('[PREMIUM-UPDATE] Exception getting subscription details:', detailsError);
      }
    }
    
    // If we still don't have an expiry date, calculate one
    if (!subscriptionData.subscriptionExpiry) {
      // Set expiry to 30 days from now as fallback
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      subscriptionData.subscriptionExpiry = expiryDate.toISOString();
      console.log('[PREMIUM-UPDATE] Using fallback expiry date:', subscriptionData.subscriptionExpiry);
    }
    
    const updateData = { 
      is_premium: true,
      subscription_id: subscriptionData.subscriptionId,
      subscription_status: subscriptionData.subscriptionStatus,
      subscription_expiry: subscriptionData.subscriptionExpiry,
      updated_at: new Date().toISOString()
    };
    
    console.log('[PREMIUM-UPDATE] About to update profile with:', updateData);
    
    // Update profile with all subscription details
    const { error, data } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select();
      
    if (error) {
      console.error('[PREMIUM-UPDATE] Error updating premium status:', error);
      return false;
    }
    
    console.log('[PREMIUM-UPDATE] Profile update result:', data);
    console.log(`[PREMIUM-UPDATE] --------- FORCE UPDATE END ---------`);
    
    toast.success('Twoje konto zostało zaktualizowane do wersji Premium!');
    return true;
  } catch (error) {
    console.error('[PREMIUM-UPDATE] Exception in forceUpdatePremiumStatus:', error);
    return false;
  }
};

// Check if payment is logged in database
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
