
import { SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export interface WebhookHandlerResponse {
  received: boolean;
  type: string;
  verified: boolean;
}

export interface UnprocessedPayment {
  session_id: string;
  session_data: any;
  processed: boolean;
  timestamp: string;
}

export interface DatabaseOperations {
  logPayment: (data: {
    userId: string;
    sessionId: string;
    subscriptionId?: string;
    customer?: string;
    customerEmail?: string;
  }) => Promise<void>;
  updateProfile: (userId: string, data: {
    is_premium: boolean;
    subscription_id?: string;
    subscription_status?: string;
    subscription_expiry?: string;
    subscription_created_at?: string;
    trial_started_at?: string | null;
    updated_at: string;
  }) => Promise<void>;
  findUserByEmail: (email: string) => Promise<{ id: string } | null>;
  storeUnprocessedPayment: (sessionId: string, sessionData: any) => Promise<void>;
}

