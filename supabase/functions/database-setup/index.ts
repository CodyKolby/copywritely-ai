
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
    console.log("Database setup function started");
    
    // Set up Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create tables if they don't exist
    
    // 1. Create payment_logs table
    const { error: paymentLogsError } = await supabase.rpc('execute_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.payment_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          session_id TEXT NOT NULL,
          subscription_id TEXT,
          customer TEXT,
          customer_email TEXT,
          timestamp TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `
    });
    
    if (paymentLogsError) {
      console.error('Error creating payment_logs table:', paymentLogsError);
      throw paymentLogsError;
    }
    
    // 2. Create unprocessed_payments table
    const { error: unprocessedPaymentsError } = await supabase.rpc('execute_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.unprocessed_payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id TEXT NOT NULL,
          session_data JSONB NOT NULL,
          processed BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          processed_at TIMESTAMPTZ
        );
      `
    });
    
    if (unprocessedPaymentsError) {
      console.error('Error creating unprocessed_payments table:', unprocessedPaymentsError);
      throw unprocessedPaymentsError;
    }
    
    // Success response
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Database tables created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in database-setup function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || 'Error setting up database tables',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
