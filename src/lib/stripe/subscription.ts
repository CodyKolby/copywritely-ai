
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
    const { data, error } = await supabase.functions.invoke('subscription-details', {
      body: { userId }
    });
    
    if (error) {
      console.error('Error fetching subscription details:', error);
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
    
    return subscriptionData;
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    return null;
  }
};

// Function to cancel a subscription
export const cancelSubscription = async (userId: string, subscriptionId: string): Promise<any> => {
  try {
    const { data, error } = await supabase.functions.invoke('cancel-subscription', {
      body: { userId, subscriptionId }
    });
    
    if (error) {
      console.error('Error canceling subscription:', error);
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};

// Function to check subscription status
export const checkSubscriptionStatus = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('check-subscription-status', {
      body: { userId }
    });
    
    if (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
    
    return data?.isPremium || false;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
};
