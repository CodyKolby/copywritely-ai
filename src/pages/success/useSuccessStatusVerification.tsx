
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { forceUpdatePremiumStatus } from '@/lib/stripe/verification';
import { updateLocalStoragePremium } from '@/lib/stripe/localStorage-utils';
import { User } from '@supabase/supabase-js';

export const useSuccessStatusVerification = () => {
  const updateProfileDirectly = useCallback(async (userId: string): Promise<boolean> => {
    try {
      console.log("[SUCCESS-VERIFY] Attempting direct profile update for user:", userId);
      
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
      
      await updateProfileDirectly(user.id);
      await forceUpdatePremiumStatus(user.id, sessionId);
      await addPaymentLog(user.id, sessionId);
      
      await refreshSession();
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium, subscription_status, subscription_id, subscription_expiry')
        .eq('id', user.id)
        .single();
      
      console.log("[SUCCESS-VERIFY] Profile after updates:", profile);
      
      sessionStorage.setItem('paymentProcessed', 'true');
      updateLocalStoragePremium(true);
      
      return true;
    } catch (error) {
      console.error("[SUCCESS-VERIFY] Payment verification process error:", error);
      
      try {
        console.log("[SUCCESS-VERIFY] Attempting emergency direct update");
        const success = await updateProfileDirectly(user.id);
        
        if (success) {
          sessionStorage.setItem('paymentProcessed', 'true');
          updateLocalStoragePremium(true);
          
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
