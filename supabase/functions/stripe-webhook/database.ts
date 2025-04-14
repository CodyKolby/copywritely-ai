
// Replace the regular import with a URL import for Supabase client
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
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const findUserByEmail = async (email: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }

    return data;
  };

  const storeUnprocessedPayment = async (sessionId: string, sessionData: any) => {
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
  };

  return {
    logPayment,
    updateProfile,
    findUserByEmail,
    storeUnprocessedPayment
  };
}
