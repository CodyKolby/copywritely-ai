
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { DatabaseOperations } from './types.ts';

export function createDatabaseOperations(): DatabaseOperations {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );

  const logPayment = async (data: {
    userId: string;
    sessionId: string;
    subscriptionId?: string;
    customer?: string;
    customerEmail?: string;
  }) => {
    console.log('Logging payment:', data);
    
    try {
      const { error } = await supabase
        .from('payment_logs')
        .insert({
          user_id: data.userId,
          session_id: data.sessionId,
          subscription_id: data.subscriptionId,
          customer: data.customer,
          customer_email: data.customerEmail,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Error logging payment:', error);
        throw error;
      }
      
      console.log('Payment logged successfully');
    } catch (e) {
      console.error('Exception logging payment:', e);
      throw e;
    }
  };

  const updateProfile = async (userId: string, data: {
    is_premium: boolean;
    subscription_id?: string;
    subscription_status?: string;
    subscription_expiry?: string;
    subscription_created_at?: string;
    trial_started_at?: string | null;
    updated_at: string;
  }) => {
    console.log(`Updating profile for user ${userId} with:`, data);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId);

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
      
      console.log(`Profile updated successfully for user ${userId}`);
      
      // Verify the update by fetching the profile
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('is_premium, subscription_id, subscription_status, subscription_expiry')
        .eq('id', userId)
        .single();
        
      if (fetchError) {
        console.error('Error fetching updated profile:', fetchError);
      } else {
        console.log('Updated profile values:', profile);
      }
    } catch (e) {
      console.error('Exception updating profile:', e);
      throw e;
    }
  };

  const findUserByEmail = async (email: string) => {
    console.log(`Finding user by email: ${email}`);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('Error finding user by email:', error);
        throw error;
      }
      
      if (data) {
        console.log(`Found user with id ${data.id} for email ${email}`);
      } else {
        console.log(`No user found with email ${email}`);
      }

      return data;
    } catch (e) {
      console.error('Exception finding user by email:', e);
      throw e;
    }
  };

  const storeUnprocessedPayment = async (sessionId: string, sessionData: any) => {
    console.log(`Storing unprocessed payment for session ${sessionId}`);
    
    try {
      const { error } = await supabase
        .from('unprocessed_payments')
        .insert({
          session_id: sessionId,
          session_data: sessionData,
          processed: false,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing unprocessed payment:', error);
        throw error;
      }
      
      console.log('Unprocessed payment stored successfully');
    } catch (e) {
      console.error('Exception storing unprocessed payment:', e);
      throw e;
    }
  };

  const findProfileBySubscriptionId = async (subscriptionId: string) => {
    console.log(`Finding profile for subscription: ${subscriptionId}`);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, is_premium, subscription_status')
        .eq('subscription_id', subscriptionId)
        .maybeSingle();

      if (error) {
        console.error('Error finding profile by subscription ID:', error);
        throw error;
      }
      
      if (data) {
        console.log(`Found profile for subscription ${subscriptionId}: user ${data.id}`);
      } else {
        console.log(`No profile found for subscription ${subscriptionId}`);
      }

      return { data, error };
    } catch (e) {
      console.error('Exception finding profile by subscription ID:', e);
      throw e;
    }
  };

  return {
    logPayment,
    updateProfile,
    findUserByEmail,
    storeUnprocessedPayment,
    findProfileBySubscriptionId
  };
}
