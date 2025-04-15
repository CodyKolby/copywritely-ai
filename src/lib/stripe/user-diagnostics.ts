
import { supabase } from '@/integrations/supabase/client';
import { createProfileIfNotExists } from './profile-updates';

/**
 * Run diagnostics on a user ID to verify data consistency
 */
export const runUserDiagnostics = async (userId: string) => {
  if (!userId) {
    console.error('[USER-DIAGNOSTICS] No user ID provided');
    return {
      success: false,
      problems: ['No user ID provided']
    };
  }
  
  console.log('[USER-DIAGNOSTICS] Running diagnostics for user:', userId);
  
  const problems: string[] = [];
  const solutions: string[] = [];
  
  try {
    // Check 1: Does the user exist in auth.users?
    try {
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
      
      if (authError) {
        console.error('[USER-DIAGNOSTICS] Error checking auth.users:', authError);
        problems.push('Error checking if user exists in auth.users');
      } else if (!authUser?.user) {
        console.warn('[USER-DIAGNOSTICS] User not found in auth.users');
        problems.push('User ID not found in auth.users');
      } else {
        console.log('[USER-DIAGNOSTICS] User found in auth.users:', authUser.user.email);
      }
    } catch (authCheckError) {
      console.error('[USER-DIAGNOSTICS] Exception checking auth.users:', authCheckError);
      // Not critical, continue with other checks
    }
    
    // Check 2: Does the user have a profile?
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError) {
      console.error('[USER-DIAGNOSTICS] Error checking profiles:', profileError);
      problems.push('Error checking if user has a profile');
    }
    
    if (!profileData) {
      console.warn('[USER-DIAGNOSTICS] User has no profile');
      problems.push('User has no profile in profiles table');
      solutions.push('Creating profile for user');
      
      // Try to create a profile
      const profileCreated = await createProfileIfNotExists(userId);
      
      if (profileCreated) {
        console.log('[USER-DIAGNOSTICS] Profile created successfully');
        solutions.push('Profile created successfully');
      } else {
        console.error('[USER-DIAGNOSTICS] Failed to create profile');
        solutions.push('Failed to create profile');
      }
    } else {
      console.log('[USER-DIAGNOSTICS] User has a profile:', profileData);
      
      // Check profile data consistency
      if (profileData.is_premium === true && !profileData.subscription_id) {
        console.warn('[USER-DIAGNOSTICS] User has premium status but no subscription_id');
        problems.push('User has premium status but no subscription_id');
      }
      
      if (profileData.is_premium === true && !profileData.subscription_expiry) {
        console.warn('[USER-DIAGNOSTICS] User has premium status but no subscription_expiry');
        problems.push('User has premium status but no subscription_expiry');
        
        // Set a default expiry date
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        
        try {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              subscription_expiry: expiryDate.toISOString()
            })
            .eq('id', userId);
            
          if (updateError) {
            console.error('[USER-DIAGNOSTICS] Error setting default expiry:', updateError);
          } else {
            console.log('[USER-DIAGNOSTICS] Set default expiry date');
            solutions.push('Added default subscription_expiry');
          }
        } catch (updateErr) {
          console.error('[USER-DIAGNOSTICS] Exception setting default expiry:', updateErr);
        }
      }
    }
    
    // Check 3: Does the user have projects?
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', userId);
        
      if (projectsError) {
        console.error('[USER-DIAGNOSTICS] Error checking projects:', projectsError);
        problems.push('Error checking if user has projects');
      } else {
        console.log(`[USER-DIAGNOSTICS] User has ${projectsData?.length || 0} projects`);
        
        if (projectsData?.length === 0) {
          problems.push('User has no projects');
        }
      }
    } catch (projectsCheckError) {
      console.error('[USER-DIAGNOSTICS] Exception checking projects:', projectsCheckError);
    }
    
    // Additional checks can be added here
    
    return {
      success: problems.length === 0,
      problems,
      solutions,
      userId
    };
  } catch (error) {
    console.error('[USER-DIAGNOSTICS] Exception running diagnostics:', error);
    return {
      success: false,
      problems: ['Exception running diagnostics: ' + (error instanceof Error ? error.message : String(error))],
      userId
    };
  }
};

/**
 * Fix common user data issues
 */
export const fixUserDataIssues = async (userId: string) => {
  if (!userId) {
    console.error('[USER-DIAGNOSTICS] No user ID provided for fixes');
    return {
      success: false,
      fixes: ['No user ID provided']
    };
  }
  
  console.log('[USER-DIAGNOSTICS] Applying fixes for user:', userId);
  
  const fixes: string[] = [];
  
  try {
    // Fix 1: Ensure profile exists
    const profileCreated = await createProfileIfNotExists(userId);
    
    if (profileCreated) {
      fixes.push('Ensured profile exists');
    }
    
    // Fix 2: Set default premium status if needed
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium, subscription_expiry, subscription_status')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError) {
      console.error('[USER-DIAGNOSTICS] Error getting profile:', profileError);
    } else if (profile) {
      // If user has premium but no expiry date, set default
      if (profile.is_premium === true && !profile.subscription_expiry) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_expiry: expiryDate.toISOString(),
            subscription_status: profile.subscription_status || 'active'
          })
          .eq('id', userId);
          
        if (updateError) {
          console.error('[USER-DIAGNOSTICS] Error setting expiry:', updateError);
        } else {
          fixes.push('Added default subscription expiry');
        }
      }
    }
    
    return {
      success: true,
      fixes,
      userId
    };
  } catch (error) {
    console.error('[USER-DIAGNOSTICS] Exception applying fixes:', error);
    return {
      success: false,
      fixes: ['Error applying fixes: ' + (error instanceof Error ? error.message : String(error))],
      userId
    };
  }
};
