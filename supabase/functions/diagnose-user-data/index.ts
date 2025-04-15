
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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[DIAGNOSE-USER] Missing Supabase environment variables');
      throw new Error('Missing required environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
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
    
    // Perform actual diagnostic checks
    const diagnosticResults = await runDiagnostics(userId, supabase);
    
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
async function runDiagnostics(userId: string, supabase: any) {
  const services: Record<string, any> = {};
  const problems: string[] = [];
  let servicesFailed = 0;
  let servicesChecked = 0;
  let fixesApplied = 0;
  
  try {
    // Check 1: Auth service - Can we verify the user exists?
    servicesChecked++;
    try {
      const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError) {
        servicesFailed++;
        services.auth = { success: false, error: userError.message };
        problems.push('Problem z weryfikacją użytkownika');
      } else if (!user) {
        servicesFailed++;
        services.auth = { success: false, error: 'User not found' };
        problems.push('Nie znaleziono użytkownika');
      } else {
        services.auth = { success: true, email: user.email };
      }
    } catch (authError) {
      servicesFailed++;
      services.auth = { success: false, error: String(authError) };
      problems.push('Błąd weryfikacji użytkownika');
    }
    
    // Check 2: Profile service - Does the user have a profile?
    servicesChecked++;
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileError) {
        servicesFailed++;
        services.profile = { success: false, error: profileError.message };
        problems.push('Problem z dostępem do profilu użytkownika');
      } else if (!profile) {
        servicesFailed++;
        services.profile = { success: false, error: 'Profile not found' };
        problems.push('Nie znaleziono profilu użytkownika');
        
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
          }
        } catch (createErr) {
          problems.push('Nie udało się utworzyć profilu');
        }
      } else {
        services.profile = { success: true };
        
        // Check for premium status consistency
        if (profile.is_premium && (!profile.subscription_status || !profile.subscription_expiry)) {
          problems.push('Niespójne dane subskrypcji premium');
          
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
              }
            } catch (fixErr) {
              problems.push('Nie udało się naprawić danych subskrypcji');
            }
          }
        }
      }
    } catch (profileError) {
      servicesFailed++;
      services.profile = { success: false, error: String(profileError) };
      problems.push('Błąd podczas sprawdzania profilu użytkownika');
    }
    
    // Determine overall status
    let overallStatus = 'healthy';
    if (servicesFailed > 0) {
      overallStatus = servicesFailed === servicesChecked ? 'critical' : 'degraded';
    }
    
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
        overallStatus
      }
    };
  } catch (error) {
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
        overallStatus: 'error'
      }
    };
  }
}
