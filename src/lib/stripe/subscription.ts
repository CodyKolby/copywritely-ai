
import { supabase } from '@/integrations/supabase/client';

// Interface for subscription data
export interface SubscriptionDetails {
  subscriptionId: string;
  status: string;
  currentPeriodEnd: string;
  daysUntilRenewal: number;
  cancelAtPeriodEnd: boolean;
  portalUrl: string | null;
  hasSubscription: boolean;
  plan: string;
  trialEnd: string | null;
  isTrial: boolean;
}

// Function to fetch subscription details
export const getSubscriptionDetails = async (userId: string): Promise<SubscriptionDetails | null> => {
  try {
    console.log('[SUBSCRIPTION] Fetching subscription details for user:', userId);
    
    // Set a timeout for the function call
    const functionPromise = supabase.functions.invoke('subscription-details', {
      body: { userId }
    });
    
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Przekroczono czas oczekiwania na dane subskrypcji'));
      }, 5000); // 5 second timeout
    });
    
    // Race between function call and timeout
    const { data, error } = await Promise.race([
      functionPromise,
      timeoutPromise
    ]);
    
    if (error) {
      console.error('[SUBSCRIPTION] Error fetching subscription details:', error);
      
      // Try direct DB check as fallback
      console.log('[SUBSCRIPTION] Trying direct DB check as fallback');
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium, subscription_status, subscription_expiry, subscription_id')
        .eq('id', userId)
        .maybeSingle();
        
      if (profile?.is_premium) {
        console.log('[SUBSCRIPTION] User has premium status in DB, creating fallback data');
        
        // Create fallback subscription data
        const currentDate = new Date();
        const expiryDate = profile.subscription_expiry 
          ? new Date(profile.subscription_expiry) 
          : new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
          
        const daysUntilRenewal = Math.ceil((expiryDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));
        
        return {
          subscriptionId: profile.subscription_id || 'fallback_id',
          status: profile.subscription_status || 'active',
          currentPeriodEnd: expiryDate.toISOString(),
          daysUntilRenewal: Math.max(1, daysUntilRenewal),
          cancelAtPeriodEnd: false,
          portalUrl: null,
          hasSubscription: true,
          plan: 'Pro',
          trialEnd: null,
          isTrial: false
        };
      }
      
      return null;
    }
    
    // Ensure all required fields are present
    const subscriptionData = data as SubscriptionDetails;
    
    if (!subscriptionData.trialEnd && subscriptionData.isTrial) {
      subscriptionData.trialEnd = subscriptionData.currentPeriodEnd;
    }
    
    if (typeof subscriptionData.isTrial !== 'boolean') {
      subscriptionData.isTrial = subscriptionData.status === 'trialing';
    }
    
    console.log('[SUBSCRIPTION] Successfully retrieved subscription details:', subscriptionData);
    return subscriptionData;
  } catch (error) {
    console.error('[SUBSCRIPTION] Error fetching subscription details:', error);
    
    // Try direct DB check as fallback
    try {
      console.log('[SUBSCRIPTION] Trying direct DB check after exception');
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium, subscription_status, subscription_expiry, subscription_id')
        .eq('id', userId)
        .maybeSingle();
        
      if (profile?.is_premium) {
        console.log('[SUBSCRIPTION] User has premium status in DB, creating fallback data');
        
        // Create fallback subscription data
        const currentDate = new Date();
        const expiryDate = profile.subscription_expiry 
          ? new Date(profile.subscription_expiry) 
          : new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
          
        const daysUntilRenewal = Math.ceil((expiryDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));
        
        return {
          subscriptionId: profile.subscription_id || 'fallback_id',
          status: profile.subscription_status || 'active',
          currentPeriodEnd: expiryDate.toISOString(),
          daysUntilRenewal: Math.max(1, daysUntilRenewal),
          cancelAtPeriodEnd: false,
          portalUrl: null,
          hasSubscription: true,
          plan: 'Pro',
          trialEnd: null,
          isTrial: false
        };
      }
    } catch (dbErr) {
      console.error('[SUBSCRIPTION] Error in DB fallback check:', dbErr);
    }
    
    return null;
  }
};

// Function to cancel a subscription
export const cancelSubscription = async (userId: string, subscriptionId: string): Promise<any> => {
  try {
    console.log('[SUBSCRIPTION] Canceling subscription for user:', userId);
    console.log('[SUBSCRIPTION] Subscription ID:', subscriptionId);
    
    // Set a timeout for the function call
    const functionPromise = supabase.functions.invoke('cancel-subscription', {
      body: { userId, subscriptionId }
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Przekroczono czas oczekiwania na anulowanie subskrypcji'));
      }, 5000); // 5 second timeout
    });
    
    // Race between function call and timeout
    const { data, error } = await Promise.race([
      functionPromise,
      timeoutPromise
    ]);
    
    if (error) {
      console.error('[SUBSCRIPTION] Error canceling subscription:', error);
      throw new Error(error.message);
    }
    
    console.log('[SUBSCRIPTION] Successfully canceled subscription:', data);
    return data;
  } catch (error) {
    console.error('[SUBSCRIPTION] Error canceling subscription:', error);
    throw error;
  }
};

// Function to check subscription status
export const checkSubscriptionStatus = async (userId: string): Promise<boolean> => {
  try {
    console.log('[SUBSCRIPTION] Checking subscription status for user:', userId);
    
    // First check DB directly for faster response
    try {
      console.log('[SUBSCRIPTION] Checking DB directly for premium status');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_premium, subscription_status, subscription_expiry')
        .eq('id', userId)
        .maybeSingle();
        
      if (!profileError && profile) {
        console.log('[SUBSCRIPTION] Found profile data:', profile);
        
        // Check if subscription has expired
        if (profile.subscription_expiry) {
          const expiry = new Date(profile.subscription_expiry);
          const now = new Date();
          
          if (expiry < now) {
            console.log('[SUBSCRIPTION] Subscription has expired');
            return false;
          }
        }
        
        if (profile.is_premium === true) {
          console.log('[SUBSCRIPTION] User has premium status in DB');
          return true;
        }
      }
    } catch (dbErr) {
      console.error('[SUBSCRIPTION] Error in direct DB check:', dbErr);
      // Continue with edge function check
    }
    
    // Set a timeout for the function call
    const functionPromise = supabase.functions.invoke('check-subscription-status', {
      body: { userId }
    });
    
    const timeoutPromise = new Promise<{data: {isPremium: boolean}}>((resolve) => {
      setTimeout(() => {
        // On timeout, default to what we found in the database
        resolve({data: {isPremium: false}});
      }, 5000); // 5 second timeout
    });
    
    // Race between function call and timeout
    const { data, error } = await Promise.race([
      functionPromise,
      timeoutPromise
    ]);
    
    if (error) {
      console.error('[SUBSCRIPTION] Error checking subscription status:', error);
      return false;
    }
    
    console.log('[SUBSCRIPTION] Subscription status check result:', data);
    return data?.isPremium || false;
  } catch (error) {
    console.error('[SUBSCRIPTION] Error checking subscription status:', error);
    return false;
  }
};
