
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";
import Stripe from "https://esm.sh/stripe@12.1.1";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get configuration from environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    // Get user ID and session ID from request
    const { userId, sessionId } = await req.json();
    
    if (!userId || !sessionId) {
      throw new Error('Missing userId or sessionId');
    }

    console.log(`Verifying payment session for user: ${userId}, session: ${sessionId}`);

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2022-11-15'
    });

    // Initialize Supabase client with Service Role Key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      throw new Error('Failed to retrieve session from Stripe');
    }

    console.log('Session payment status:', session.payment_status);

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      throw new Error('Session payment status is not paid');
    }

    // Get subscription ID
    const subscriptionId = session.subscription;
    
    if (!subscriptionId) {
      throw new Error('No subscription ID found in session');
    }

    console.log('Subscription ID:', subscriptionId);

    // Retrieve subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    if (!subscription) {
      throw new Error('Failed to retrieve subscription from Stripe');
    }

    console.log('Subscription status:', subscription.status);

    // Calculate expiry date
    let expiryDate: string;
    
    if (subscription.current_period_end) {
      expiryDate = new Date(subscription.current_period_end * 1000).toISOString();
    } else {
      // Default to 30 days from now
      const date = new Date();
      date.setDate(date.getDate() + 30);
      expiryDate = date.toISOString();
    }
    
    // Determine if this is a trial subscription
    const isTrial = subscription.status === 'trialing';
    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;
    
    console.log('Expiry date:', expiryDate);
    console.log('Is trial:', isTrial);
    console.log('Trial end:', trialEnd);

    // Update user profile
    const { data, error } = await supabase
      .from('profiles')
      .update({
        is_premium: true,
        subscription_id: subscriptionId,
        subscription_status: subscription.status,
        subscription_expiry: expiryDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();
      
    if (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update user profile');
    }

    console.log('Profile updated successfully');

    // Log payment in payment_logs table
    const { error: logError } = await supabase
      .from('payment_logs')
      .insert({
        user_id: userId,
        session_id: sessionId,
        subscription_id: subscriptionId,
        customer: session.customer,
        customer_email: session.customer_details?.email,
        timestamp: new Date().toISOString()
      });
      
    if (logError) {
      console.error('Error logging payment:', logError);
      // Non-critical error, continue
    } else {
      console.log('Payment logged successfully');
    }

    // Return success with subscription details
    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId,
        status: subscription.status,
        expiryDate,
        isTrial,
        trialEnd,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error verifying payment session:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred' 
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
