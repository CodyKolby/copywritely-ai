
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { forceUpdatePremiumStatus } from '@/lib/stripe/verification';
import { toast } from 'sonner';
import { updateLocalStoragePremium } from '@/lib/stripe/localStorage-utils';
import { User } from '@supabase/supabase-js';

/**
 * Handle direct database updates for premium status
 */
export const useSuccessStatusVerification = () => {
  /**
   * Update profile directly in database
   */
  const updateProfileDirectly = useCallback(async (userId: string): Promise<boolean> => {
    try {
      console.log("[SUCCESS-VERIFY] Attempting direct profile update for user:", userId);
      
      // Set expiry date to 30 days from now
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: userId,
          is_premium: true,
          subscription_status: 'active',
          subscription_expiry: expiryDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
        
      if (error) {
        console.error("[SUCCESS-VERIFY] Direct update error:", error);
        return false;
      } 
      
      console.log("[SUCCESS-VERIFY] Direct profile update successful");
      return true;
    } catch (error) {
      console.error("[SUCCESS-VERIFY] Error in direct profile update:", error);
      return false;
    }
  }, []);

  /**
   * Add payment to logs if it doesn't exist
   */
  const addPaymentLog = useCallback(async (userId: string, sessionId: string): Promise<boolean> => {
    try {
      const { data: existingLog } = await supabase
        .from('payment_logs')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();
        
      if (!existingLog) {
        console.log("[SUCCESS-VERIFY] Adding payment log as fallback");
        const { error } = await supabase
          .from('payment_logs')
          .insert({
            user_id: userId,
            session_id: sessionId,
            timestamp: new Date().toISOString()
          });
          
        if (error) {
          console.error("[SUCCESS-VERIFY] Error adding payment log:", error);
          return false;
        }
        
        return true;
      }
      
      return true;
    } catch (error) {
      console.error("[SUCCESS-VERIFY] Error adding payment log:", error);
      return false;
    }
  }, []);

  /**
   * Perform complete verification process
   */
  const verifyPaymentSuccess = useCallback(async (
    user: User | null,
    sessionId: string | null,
    refreshSession: () => Promise<boolean>
  ): Promise<boolean> => {
    if (!user?.id || !sessionId) {
      console.error("[SUCCESS-VERIFY] Cannot complete verification - missing user or sessionId");
      return false;
    }
    
    try {
      console.log("[SUCCESS-VERIFY] Payment verification initiated for user:", user.id);
      
      // STEP 1: Verify through edge function
      try {
        console.log("[SUCCESS-VERIFY] Calling verify-payment-session edge function");
        
        const { data, error } = await supabase.functions.invoke('verify-payment-session', {
          body: { 
            userId: user.id,
            sessionId
          }
        });
        
        if (error) {
          console.error("[SUCCESS-VERIFY] Edge function error:", error);
        } else {
          console.log("[SUCCESS-VERIFY] Edge function success:", data);
        }
      } catch (edgeFnError) {
        console.error("[SUCCESS-VERIFY] Edge function exception:", edgeFnError);
      }
      
      // STEP 2: Direct update as backup
      await updateProfileDirectly(user.id);
      
      // STEP 3: Force update premium status with session ID
      await forceUpdatePremiumStatus(user.id, sessionId);
      
      // STEP 4: Add to payment logs
      await addPaymentLog(user.id, sessionId);
      
      // STEP 5: Refresh session to update auth context
      await refreshSession();
      
      // STEP 6: Check result after all updates
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium, subscription_status, subscription_id, subscription_expiry')
        .eq('id', user.id)
        .single();
      
      console.log("[SUCCESS-VERIFY] Profile after updates:", profile);
      
      // STEP 7: Mark as processed in session storage
      sessionStorage.setItem('paymentProcessed', 'true');
      
      // Also store in localStorage as backup
      updateLocalStoragePremium(true);
      
      // Success toast
      toast.success('Gratulacje! Twoje konto zostało zaktualizowane do wersji Premium.', {
        dismissible: true
      });
      
      return true;
    } catch (error) {
      console.error("[SUCCESS-VERIFY] Payment verification process error:", error);
      
      // Final emergency attempt
      try {
        console.log("[SUCCESS-VERIFY] Attempting emergency direct update");
        const success = await updateProfileDirectly(user.id);
        
        if (success) {
          // Mark as processed
          sessionStorage.setItem('paymentProcessed', 'true');
          updateLocalStoragePremium(true);
          
          toast.success('Twoje konto zostało zaktualizowane do wersji Premium!', {
            dismissible: true
          });
          
          return true;
        }
      } catch (finalError) {
        console.error("[SUCCESS-VERIFY] Final emergency attempt failed:", finalError);
      }
      
      return false;
    }
  }, [updateProfileDirectly, addPaymentLog]);
  
  return {
    verifyPaymentSuccess,
    updateProfileDirectly,
    addPaymentLog
  };
};
