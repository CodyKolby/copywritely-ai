
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
    
    // Collect diagnostic results
    const diagnosticResult: Record<string, any> = {
      timestamp: new Date().toISOString(),
      userId,
      services: {},
      problems: [],
      fixes: { success: false, fixes: [] }
    };
    
    // Check user auth existence
    try {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError) {
        console.error('[DIAGNOSE-USER] User auth check error:', userError);
        diagnosticResult.services.auth = { success: false, error: userError.message };
        diagnosticResult.problems.push(`User auth error: ${userError.message}`);
      } else if (!userData.user) {
        diagnosticResult.services.auth = { success: false, error: 'User not found in auth system' };
        diagnosticResult.problems.push('User not found in auth system');
      } else {
        diagnosticResult.services.auth = { 
          success: true, 
          email: userData.user.email,
          lastSignIn: userData.user.last_sign_in_at
        };
      }
    } catch (e) {
      console.error('[DIAGNOSE-USER] User auth check exception:', e);
      diagnosticResult.services.auth = { 
        success: false, 
        error: e instanceof Error ? e.message : 'Unknown auth check error' 
      };
      diagnosticResult.problems.push('Failed to check user authentication status');
    }
    
    // Check profile existence and premium status
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileError) {
        console.error('[DIAGNOSE-USER] Profile check error:', profileError);
        diagnosticResult.services.profile = { success: false, error: profileError.message };
        diagnosticResult.problems.push(`Profile check error: ${profileError.message}`);
      } else if (!profileData) {
        diagnosticResult.services.profile = { success: false, error: 'Profile not found' };
        diagnosticResult.problems.push('User profile not found in database');
        
        // Try to create profile if it doesn't exist
        if (diagnosticResult.services.auth?.success) {
          try {
            const { error: createError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                email: diagnosticResult.services.auth.email,
                is_premium: false,
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString()
              });
              
            if (createError) {
              console.error('[DIAGNOSE-USER] Profile creation error:', createError);
            } else {
              diagnosticResult.fixes.success = true;
              diagnosticResult.fixes.fixes.push('Created missing user profile');
            }
          } catch (e) {
            console.error('[DIAGNOSE-USER] Profile creation exception:', e);
          }
        }
      } else {
        // Profile exists
        diagnosticResult.services.profile = {
          success: true,
          isPremium: profileData.is_premium,
          subscriptionStatus: profileData.subscription_status,
          subscriptionExpiry: profileData.subscription_expiry,
          subscriptionId: profileData.subscription_id
        };
        
        // Check if expiry date is valid
        if (profileData.subscription_expiry) {
          const expiryDate = new Date(profileData.subscription_expiry);
          const isExpired = expiryDate < new Date();
          
          if (isExpired && profileData.is_premium) {
            diagnosticResult.problems.push('Premium status active but subscription date expired');
          }
        }
        
        // Check profile premium status inconsistency
        if (profileData.is_premium && profileData.subscription_status === 'canceled') {
          diagnosticResult.problems.push('Premium status active but subscription marked as canceled');
        }
        
        // Force fix premium status if requested
        if (forceFixPremium) {
          try {
            // Check payment logs first
            const { data: paymentLogs, error: paymentError } = await supabase
              .from('payment_logs')
              .select('id, created_at, payment_status')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(5);
              
            if (!paymentError && paymentLogs && paymentLogs.length > 0) {
              // User has payment logs, should be premium
              const latestPayment = paymentLogs[0];
              
              if (latestPayment.payment_status === 'succeeded' || 
                  latestPayment.payment_status === 'complete' || 
                  latestPayment.payment_status === 'active') {
                
                // Set premium status to true based on payment logs
                const { error: updateError } = await supabase
                  .from('profiles')
                  .update({
                    is_premium: true,
                    subscription_status: 'active',
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', userId);
                  
                if (updateError) {
                  console.error('[DIAGNOSE-USER] Profile premium update error:', updateError);
                  diagnosticResult.problems.push(`Failed to update premium status: ${updateError.message}`);
                } else {
                  diagnosticResult.fixes.success = true;
                  diagnosticResult.fixes.fixes.push('Updated premium status based on payment history');
                }
              }
            }
          } catch (e) {
            console.error('[DIAGNOSE-USER] Force fix premium exception:', e);
          }
        }
      }
    } catch (e) {
      console.error('[DIAGNOSE-USER] Profile check exception:', e);
      diagnosticResult.services.profile = { 
        success: false, 
        error: e instanceof Error ? e.message : 'Unknown profile check error' 
      };
      diagnosticResult.problems.push('Failed to check user profile data');
    }
    
    // Check payment logs
    try {
      const { data: paymentLogs, error: paymentError } = await supabase
        .from('payment_logs')
        .select('id, created_at, payment_status, amount, currency')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (paymentError) {
        console.error('[DIAGNOSE-USER] Payment logs check error:', paymentError);
        diagnosticResult.services.payments = { success: false, error: paymentError.message };
        diagnosticResult.problems.push(`Payment logs check error: ${paymentError.message}`);
      } else {
        diagnosticResult.services.payments = {
          success: true,
          count: paymentLogs?.length || 0,
          latest: paymentLogs && paymentLogs.length > 0 ? paymentLogs[0] : null
        };
        
        // Check for premium status inconsistency based on payment logs
        if (paymentLogs && paymentLogs.length > 0) {
          const latestPayment = paymentLogs[0];
          
          if ((latestPayment.payment_status === 'succeeded' || 
               latestPayment.payment_status === 'complete' || 
               latestPayment.payment_status === 'active') && 
              diagnosticResult.services.profile?.success &&
              !diagnosticResult.services.profile.isPremium) {
            
            diagnosticResult.problems.push('User has successful payments but premium status is inactive');
            
            // Fix premium status based on payment if forceFixPremium is true
            if (forceFixPremium) {
              try {
                const { error: updateError } = await supabase
                  .from('profiles')
                  .update({
                    is_premium: true,
                    subscription_status: 'active',
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', userId);
                  
                if (updateError) {
                  console.error('[DIAGNOSE-USER] Profile premium update error:', updateError);
                } else {
                  diagnosticResult.fixes.success = true;
                  diagnosticResult.fixes.fixes.push('Updated premium status based on payment history');
                }
              } catch (e) {
                console.error('[DIAGNOSE-USER] Payment-based premium fix exception:', e);
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('[DIAGNOSE-USER] Payment logs check exception:', e);
      diagnosticResult.services.payments = { 
        success: false, 
        error: e instanceof Error ? e.message : 'Unknown payment logs check error' 
      };
      diagnosticResult.problems.push('Failed to check payment history');
    }
    
    // Check projects
    try {
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, title, created_at')
        .eq('user_id', userId)
        .limit(10);
      
      if (projectsError) {
        console.error('[DIAGNOSE-USER] Projects check error:', projectsError);
        diagnosticResult.services.projects = { success: false, error: projectsError.message };
        diagnosticResult.problems.push(`Projects check error: ${projectsError.message}`);
      } else {
        diagnosticResult.services.projects = {
          success: true,
          count: projects?.length || 0,
          latest: projects && projects.length > 0 ? projects[0] : null
        };
      }
    } catch (e) {
      console.error('[DIAGNOSE-USER] Projects check exception:', e);
      diagnosticResult.services.projects = { 
        success: false, 
        error: e instanceof Error ? e.message : 'Unknown projects check error' 
      };
      diagnosticResult.problems.push('Failed to check user projects');
    }
    
    // Generate summary
    diagnosticResult.summary = {
      servicesChecked: Object.keys(diagnosticResult.services).length,
      servicesFailed: Object.values(diagnosticResult.services).filter(s => !s.success).length,
      problemsFound: diagnosticResult.problems.length,
      fixesApplied: diagnosticResult.fixes.fixes.length,
      overallStatus: diagnosticResult.problems.length > 0 ? 'issues-found' : 'healthy'
    };
    
    console.log(`[DIAGNOSE-USER] Diagnostics complete for user ${userId}:`, 
      JSON.stringify(diagnosticResult.summary));
    
    return new Response(JSON.stringify(diagnosticResult), {
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
