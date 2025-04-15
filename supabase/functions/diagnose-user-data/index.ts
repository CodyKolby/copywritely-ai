
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.20.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }
  
  try {
    console.log("[DIAGNOSE-USER] Edge function started");
    
    // Send an immediate initial response to prevent timeouts
    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    
    // Create quick initial response
    const initialResponseData = {
      status: "processing",
      message: "Diagnostic process started",
      timestamp: new Date().toISOString()
    };
    
    writer.write(new TextEncoder().encode(JSON.stringify(initialResponseData)));
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[DIAGNOSE-USER] Missing Supabase environment variables');
      throw new Error('Missing required environment variables');
    }
    
    // Get request data
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
    
    // Create Supabase client with a shorter timeout for quicker response
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          'X-Client-Info': 'diagnose-user-data-edge-function'
        }
      },
      db: {
        schema: 'public'
      }
    });
    
    // Perform quick validation check - just to ensure we can connect
    try {
      const startCheck = Date.now();
      console.log('[DIAGNOSE-USER] Performing quick connection check');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .maybeSingle();
        
      const checkDuration = Date.now() - startCheck;
      
      if (error) {
        console.error(`[DIAGNOSE-USER] Connection check failed after ${checkDuration}ms:`, error);
      } else {
        console.log(`[DIAGNOSE-USER] Connection check succeeded in ${checkDuration}ms`);
      }
    } catch (checkError) {
      console.error('[DIAGNOSE-USER] Exception during connection check:', checkError);
    }
    
    // Perform actual diagnostic checks
    const diagnosticResults = await runDiagnostics(userId, supabase, forceFixPremium);
    
    return new Response(JSON.stringify(diagnosticResults), {
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

/**
 * Run actual diagnostic checks for the user
 */
async function runDiagnostics(userId: string, supabase: any, forceFixPremium?: boolean) {
  const services: Record<string, any> = {};
  const problems: string[] = [];
  let servicesFailed = 0;
  let servicesChecked = 0;
  let fixesApplied = 0;
  
  try {
    // Record start time for performance tracking
    const startTime = Date.now();
    console.log(`[DIAGNOSE-USER] Starting diagnostics at ${new Date().toISOString()}`);
    
    // Check 1: Auth service - Can we verify the user exists?
    servicesChecked++;
    try {
      console.log('[DIAGNOSE-USER] Checking user in auth service');
      const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError) {
        servicesFailed++;
        services.auth = { success: false, error: userError.message };
        problems.push('Problem z weryfikacją użytkownika');
        console.error('[DIAGNOSE-USER] User verification error:', userError);
      } else if (!user) {
        servicesFailed++;
        services.auth = { success: false, error: 'User not found' };
        problems.push('Nie znaleziono użytkownika');
        console.error('[DIAGNOSE-USER] User not found for ID:', userId);
      } else {
        services.auth = { success: true, email: user.email };
        console.log('[DIAGNOSE-USER] User verified successfully:', user.email);
      }
    } catch (authError) {
      servicesFailed++;
      services.auth = { success: false, error: String(authError) };
      problems.push('Błąd weryfikacji użytkownika');
      console.error('[DIAGNOSE-USER] Exception in auth check:', authError);
    }
    
    // Check 2: Profile service - Does the user have a profile?
    servicesChecked++;
    try {
      console.log('[DIAGNOSE-USER] Checking user profile');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileError) {
        servicesFailed++;
        services.profile = { success: false, error: profileError.message };
        problems.push('Problem z dostępem do profilu użytkownika');
        console.error('[DIAGNOSE-USER] Profile error:', profileError);
      } else if (!profile) {
        servicesFailed++;
        services.profile = { success: false, error: 'Profile not found' };
        problems.push('Nie znaleziono profilu użytkownika');
        console.log('[DIAGNOSE-USER] Profile not found, attempting to create');
        
        // Try to fix: Create profile
        try {
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (!createError) {
            fixesApplied++;
            problems.push('Utworzono brakujący profil użytkownika');
            console.log('[DIAGNOSE-USER] Profile created successfully');
          } else {
            console.error('[DIAGNOSE-USER] Error creating profile:', createError);
          }
        } catch (createErr) {
          problems.push('Nie udało się utworzyć profilu');
          console.error('[DIAGNOSE-USER] Exception creating profile:', createErr);
        }
      } else {
        services.profile = { success: true };
        console.log('[DIAGNOSE-USER] Profile found:', profile.id);
        
        // Check for premium status consistency
        if (profile.is_premium && (!profile.subscription_status || !profile.subscription_expiry)) {
          problems.push('Niespójne dane subskrypcji premium');
          console.log('[DIAGNOSE-USER] Inconsistent premium data detected');
          
          // Try to fix premium status inconsistency if requested
          if (forceFixPremium) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now
            
            try {
              const { error: fixError } = await supabase
                .from('profiles')
                .update({
                  subscription_status: 'active',
                  subscription_expiry: expiryDate.toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('id', userId);
                
              if (!fixError) {
                fixesApplied++;
                problems.push('Naprawiono dane subskrypcji premium');
                console.log('[DIAGNOSE-USER] Premium data fixed');
              } else {
                console.error('[DIAGNOSE-USER] Error fixing premium data:', fixError);
              }
            } catch (fixErr) {
              problems.push('Nie udało się naprawić danych subskrypcji');
              console.error('[DIAGNOSE-USER] Exception fixing premium data:', fixErr);
            }
          }
        }
      }
    } catch (profileError) {
      servicesFailed++;
      services.profile = { success: false, error: String(profileError) };
      problems.push('Błąd podczas sprawdzania profilu użytkownika');
      console.error('[DIAGNOSE-USER] Exception during profile check:', profileError);
    }
    
    // Determine overall status
    let overallStatus = 'healthy';
    if (servicesFailed > 0) {
      overallStatus = servicesFailed === servicesChecked ? 'critical' : 'degraded';
    }
    
    // Record end time for performance tracking
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`[DIAGNOSE-USER] Diagnostics completed in ${duration}ms`);
    
    // Return the diagnostic results
    return {
      timestamp: new Date().toISOString(),
      userId,
      services,
      problems,
      fixes: {
        applied: fixesApplied,
        fixes: problems.filter(p => p.startsWith('Naprawiono') || p.startsWith('Utworzono'))
      },
      summary: {
        servicesChecked,
        servicesFailed,
        problemsFound: problems.length,
        fixesApplied,
        overallStatus,
        duration
      }
    };
  } catch (error) {
    console.error('[DIAGNOSE-USER] Exception in diagnostics:', error);
    return {
      timestamp: new Date().toISOString(),
      userId,
      services,
      problems: [...problems, 'Błąd podczas diagnostyki: ' + String(error)],
      summary: {
        servicesChecked,
        servicesFailed,
        problemsFound: problems.length + 1,
        fixesApplied,
        overallStatus: 'error',
        error: String(error)
      }
    };
  }
}
