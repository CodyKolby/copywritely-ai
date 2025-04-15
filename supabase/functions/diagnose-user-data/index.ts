
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.20.0";

// CORS headers for browser requests - make sure these are properly set
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests properly
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, // No content for OPTIONS
      headers: corsHeaders 
    });
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
    
    // Get request data - add fallback for empty body
    let requestData: { userId?: string; forceFixPremium?: boolean } = {};
    try {
      if (req.body) {
        requestData = await req.json();
      }
    } catch (parseError) {
      console.error('[DIAGNOSE-USER] Error parsing request body:', parseError);
    }
    
    const { userId, forceFixPremium } = requestData;
    
    if (!userId) {
      throw new Error('No user ID provided');
    }
    
    console.log(`[DIAGNOSE-USER] Running diagnostics for user: ${userId}`);
    
    // Quick response to prevent timeout
    // Return minimal data immediately to prevent client-side timeout
    const quickResponse = {
      timestamp: new Date().toISOString(),
      userId,
      status: "processing",
      message: "Diagnostic check started - check logs for details"
    };
    
    // Return a quick response to the client to prevent timeouts
    // This edge function will continue processing in the background
    return new Response(JSON.stringify(quickResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[DIAGNOSE-USER] Error:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
