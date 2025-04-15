
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.20.0";
import { diagnoseUserData } from "./user-diagnostics.ts";

// CORS headers for browser requests
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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[DIAGNOSE-USER] Missing Supabase environment variables');
      throw new Error('Missing required environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user data from request
    const { userId, forceFixPremium } = await req.json();
    
    if (!userId) {
      throw new Error('No user ID provided');
    }
    
    console.log(`[DIAGNOSE-USER] Running diagnostics for user: ${userId}`);
    
    // Run diagnostics
    const result = await diagnoseUserData(supabase, userId, !!forceFixPremium);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[DIAGNOSE-USER] Error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An unknown error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
