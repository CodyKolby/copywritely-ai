
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
      }
    }
    
    // Check 3: Verify projects
    const { data: projectsData, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('id, title, created_at')
      .eq('user_id', userId);
      
    if (projectsError) {
      console.error('Error checking projects:', projectsError);
      problems.push('Error checking projects');
    } else {
      console.log(`User has ${projectsData?.length || 0} projects`);
      
      if (!projectsData || projectsData.length === 0) {
        problems.push('User has no projects');
      }
    }
    
    return {
      success: problems.length === 0,
      problems,
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
      .select('id')
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
    
    // Fix 2: Ensure premium users have expiry date
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_premium, subscription_expiry, subscription_status')
      .eq('id', userId)
      .maybeSingle();
      
    if (profile && profile.is_premium === true && !profile.subscription_expiry) {
      console.log('Adding expiry date for premium user');
      
      // Set expiry to 30 days from now
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          subscription_expiry: expiryDate.toISOString(),
          subscription_status: profile.subscription_status || 'active'
        })
        .eq('id', userId);
        
      if (updateError) {
        console.error('Error updating subscription expiry:', updateError);
        fixes.push('Failed to update subscription expiry: ' + updateError.message);
      } else {
        fixes.push('Added subscription expiry date');
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
      success: true,
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
