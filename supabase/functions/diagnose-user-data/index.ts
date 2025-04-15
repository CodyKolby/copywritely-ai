
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Create a Supabase client with the project URL and service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    console.log('Running diagnostics for user:', userId);
    
    // Run diagnostics
    const diagnostics = await runUserDiagnostics(supabaseAdmin, userId);
    
    // Apply fixes if needed
    let fixes = null;
    if (diagnostics.problems.length > 0) {
      fixes = await fixUserDataIssues(supabaseAdmin, userId);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        diagnostics,
        fixes,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/**
 * Run diagnostics on a user's data
 */
async function runUserDiagnostics(supabaseAdmin: any, userId: string) {
  console.log('Running diagnostics for user:', userId);
  
  const problems: string[] = [];
  const details: Record<string, any> = {};
  
  try {
    // Check 1: Verify auth user exists
    try {
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (authError) {
        console.error('Error checking auth user:', authError);
        problems.push('Error checking auth user');
      } else if (!authUser?.user) {
        console.warn('User not found in auth.users');
        problems.push('User not found in auth.users');
      } else {
        console.log('User found in auth.users:', authUser.user.email);
        details.authUser = {
          email: authUser.user.email,
          lastSignIn: authUser.user.last_sign_in_at,
          createdAt: authUser.user.created_at
        };
      }
    } catch (authCheckError) {
      console.error('Error checking auth user:', authCheckError);
      problems.push('Exception checking auth user');
    }
    
    // Check 2: Verify profile exists
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError) {
      console.error('Error checking profile:', profileError);
      problems.push('Error checking profile');
    } else if (!profileData) {
      console.warn('Profile not found');
      problems.push('Profile not found in profiles table');
    } else {
      console.log('Profile found:', profileData);
      details.profile = profileData;
      
      // Check profile data consistency
      if (profileData.is_premium === true) {
        if (!profileData.subscription_id) {
          problems.push('Profile has premium but no subscription_id');
        }
        
        if (!profileData.subscription_expiry) {
          problems.push('Profile has premium but no subscription_expiry');
        } else {
          // Check if subscription has expired
          const expiryDate = new Date(profileData.subscription_expiry);
          const now = new Date();
          
          if (expiryDate < now) {
            problems.push('Subscription has expired');
          }
        }
        
        if (!profileData.subscription_status) {
          problems.push('Profile has premium but no subscription_status');
        } else if (profileData.subscription_status === 'canceled' || 
                  profileData.subscription_status === 'inactive') {
          problems.push(`Profile has premium but subscription_status is ${profileData.subscription_status}`);
        }
      }
    }
    
    // Check 3: Check payment logs
    const { data: paymentLogs, error: paymentError } = await supabaseAdmin
      .from('payment_logs')
      .select('*')
      .eq('user_id', userId);
      
    if (paymentError) {
      console.error('Error checking payment logs:', paymentError);
      problems.push('Error checking payment logs');
    } else {
      console.log(`User has ${paymentLogs?.length || 0} payment logs`);
      details.paymentLogs = paymentLogs;
      
      if (!paymentLogs || paymentLogs.length === 0) {
        // Only add as a problem if the user is marked as premium
        if (profileData?.is_premium) {
          problems.push('User is marked as premium but has no payment logs');
        }
      }
    }
    
    // Check 4: Verify projects
    const { data: projectsData, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('id, title, created_at')
      .eq('user_id', userId);
      
    if (projectsError) {
      console.error('Error checking projects:', projectsError);
      problems.push('Error checking projects');
    } else {
      console.log(`User has ${projectsData?.length || 0} projects`);
      details.projects = {
        count: projectsData?.length || 0,
        ids: projectsData?.map(p => p.id) || []
      };
      
      if (!projectsData || projectsData.length === 0) {
        problems.push('User has no projects');
      }
    }
    
    return {
      success: problems.length === 0,
      problems,
      details,
      profile: profileData || null,
      projectCount: projectsData?.length || 0,
      userId
    };
  } catch (error) {
    console.error('Exception running diagnostics:', error);
    
    return {
      success: false,
      problems: ['Exception running diagnostics: ' + error.message],
      userId
    };
  }
}

/**
 * Fix common user data issues
 */
async function fixUserDataIssues(supabaseAdmin: any, userId: string) {
  console.log('Fixing issues for user:', userId);
  
  const fixes: string[] = [];
  
  try {
    // Fix 1: Ensure profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, is_premium, subscription_status, subscription_expiry')
      .eq('id', userId)
      .maybeSingle();
      
    if (!existingProfile) {
      console.log('Creating profile for user');
      
      const { error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          is_premium: false, // Default to non-premium
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (createError) {
        console.error('Error creating profile:', createError);
        fixes.push('Failed to create profile: ' + createError.message);
      } else {
        fixes.push('Created profile');
      }
    }
    
    // Fix 2: Fix inconsistent premium state
    if (existingProfile && existingProfile.is_premium === true) {
      // Check if there are payment logs
      const { data: paymentLogs } = await supabaseAdmin
        .from('payment_logs')
        .select('subscription_id, session_id')
        .eq('user_id', userId);
        
      const hasPaymentLogs = paymentLogs && paymentLogs.length > 0;
      
      // If premium but missing subscription data, check payment logs
      if (!existingProfile.subscription_id || !existingProfile.subscription_expiry) {
        console.log('Fixing missing subscription data for premium user');
        
        const subscriptionId = hasPaymentLogs ? paymentLogs[0].subscription_id : null;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_id: subscriptionId,
            subscription_status: 'active',
            subscription_expiry: expiryDate.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        if (updateError) {
          console.error('Error updating subscription data:', updateError);
          fixes.push('Failed to update subscription data: ' + updateError.message);
        } else {
          fixes.push('Added missing subscription data');
        }
      }
      
      // Check if subscription has expired
      if (existingProfile.subscription_expiry) {
        const expiryDate = new Date(existingProfile.subscription_expiry);
        const now = new Date();
        
        if (expiryDate < now) {
          console.log('Fixing expired subscription');
          
          // If expired but still marked as premium, update status
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
              is_premium: false,
              subscription_status: 'expired',
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
            
          if (updateError) {
            console.error('Error updating expired subscription:', updateError);
            fixes.push('Failed to update expired subscription: ' + updateError.message);
          } else {
            fixes.push('Updated expired subscription status');
          }
        }
      }
    }
    
    // Fix 3: Add a demo project if user has none
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('user_id', userId);
      
    if (!projects || projects.length === 0) {
      console.log('Creating demo project for user');
      
      const { error: projectError } = await supabaseAdmin
        .from('projects')
        .insert({
          user_id: userId,
          title: 'Demo Project',
          content: 'This is a demo project created automatically.',
          status: 'Draft',
          type: 'script',
          subtype: 'ad',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (projectError) {
        console.error('Error creating demo project:', projectError);
        fixes.push('Failed to create demo project: ' + projectError.message);
      } else {
        fixes.push('Created demo project');
      }
    }
    
    return {
      success: fixes.length > 0,
      fixes,
      userId
    };
  } catch (error) {
    console.error('Exception fixing issues:', error);
    
    return {
      success: false,
      fixes: ['Exception fixing issues: ' + error.message],
      userId
    };
  }
}
