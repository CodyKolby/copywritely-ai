
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.20.0";
import Stripe from "https://esm.sh/stripe@12.1.1";

/**
 * Diagnose user data and identify issues
 */
export async function diagnoseUserData(
  supabase: SupabaseClient, 
  userId: string,
  forceFixPremium = false
) {
  console.log(`[USER-DIAGNOSTICS] Starting diagnostics for user: ${userId}`);
  console.log(`[USER-DIAGNOSTICS] Force fix premium: ${forceFixPremium}`);
  
  const diagnostics: Record<string, any> = {};
  const problems: string[] = [];
  const fixes: string[] = [];
  
  try {
    // Check if user exists in auth
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError) {
      console.error('[USER-DIAGNOSTICS] Error getting user from auth:', userError);
      problems.push('User not found in auth system');
    } else if (!user.user) {
      console.error('[USER-DIAGNOSTICS] User not found in auth system');
      problems.push('User not found in auth system');
    } else {
      console.log('[USER-DIAGNOSTICS] User found in auth system:', user.user.email);
      diagnostics.auth = {
        email: user.user.email,
        emailConfirmed: user.user.email_confirmed_at !== null,
        lastSignIn: user.user.last_sign_in_at
      };
    }
    
    // Check if user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError) {
      console.error('[USER-DIAGNOSTICS] Error checking profile:', profileError);
      problems.push('Error checking user profile');
    } else if (!profile) {
      console.error('[USER-DIAGNOSTICS] Profile not found');
      problems.push('User profile not found');
      
      // Create profile if it doesn't exist
      if (forceFixPremium) {
        console.log('[USER-DIAGNOSTICS] Creating profile for user');
        
        try {
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              is_premium: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (createError) {
            console.error('[USER-DIAGNOSTICS] Error creating profile:', createError);
          } else {
            console.log('[USER-DIAGNOSTICS] Profile created successfully');
            fixes.push('Created missing user profile');
          }
        } catch (e) {
          console.error('[USER-DIAGNOSTICS] Exception creating profile:', e);
        }
      }
    } else {
      console.log('[USER-DIAGNOSTICS] Profile found:', profile);
      diagnostics.profile = {
        isPremium: profile.is_premium || false,
        subscriptionStatus: profile.subscription_status,
        subscriptionId: profile.subscription_id,
        subscriptionExpiry: profile.subscription_expiry
      };
      
      // Check for inconsistent profile data
      if (profile.is_premium && (!profile.subscription_status || profile.subscription_status === 'inactive')) {
        problems.push('User marked as premium but subscription status is inconsistent');
      }
      
      if (profile.subscription_expiry) {
        const expiryDate = new Date(profile.subscription_expiry);
        const now = new Date();
        
        if (expiryDate < now && profile.is_premium) {
          problems.push('Premium subscription has expired but account still marked as premium');
        }
      }
      
      // Try to fix premium status
      if (forceFixPremium) {
        console.log('[USER-DIAGNOSTICS] Forcing premium status fix');
        
        try {
          // First, check payment logs
          const { data: paymentLogs, error: paymentError } = await supabase
            .from('payment_logs')
            .select('*')
            .eq('user_id', userId);
            
          if (paymentError) {
            console.error('[USER-DIAGNOSTICS] Error checking payment logs:', paymentError);
          } else if (paymentLogs && paymentLogs.length > 0) {
            console.log('[USER-DIAGNOSTICS] Found payment logs, updating premium status');
            
            // Set expiry to 30 days from now if not provided
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                is_premium: true,
                subscription_status: 'active',
                subscription_expiry: expiryDate.toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', userId);
              
            if (updateError) {
              console.error('[USER-DIAGNOSTICS] Error updating premium status:', updateError);
            } else {
              console.log('[USER-DIAGNOSTICS] Premium status updated successfully');
              fixes.push('Updated premium status based on payment history');
            }
          } else {
            console.log('[USER-DIAGNOSTICS] No payment logs found, cannot force premium status');
          }
        } catch (e) {
          console.error('[USER-DIAGNOSTICS] Exception updating premium status:', e);
        }
      }
    }
    
    // Check payment logs
    const { data: paymentLogs, error: paymentError } = await supabase
      .from('payment_logs')
      .select('*')
      .eq('user_id', userId);
      
    if (paymentError) {
      console.error('[USER-DIAGNOSTICS] Error checking payment logs:', paymentError);
      problems.push('Error checking payment logs');
    } else if (!paymentLogs || paymentLogs.length === 0) {
      console.log('[USER-DIAGNOSTICS] No payment logs found');
      diagnostics.payments = {
        hasPaymentHistory: false
      };
    } else {
      console.log('[USER-DIAGNOSTICS] Payment logs found:', paymentLogs);
      diagnostics.payments = {
        hasPaymentHistory: true,
        paymentCount: paymentLogs.length,
        latestPayment: paymentLogs.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0]
      };
      
      // Check for premium status inconsistency
      if (profile && !profile.is_premium && paymentLogs.length > 0) {
        problems.push('User has payment history but is not marked as premium');
        
        // Fix this issue if requested
        if (forceFixPremium) {
          console.log('[USER-DIAGNOSTICS] Updating premium status based on payment logs');
          
          // Set expiry to 30 days from now
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              is_premium: true,
              subscription_status: 'active',
              subscription_expiry: expiryDate.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
            
          if (updateError) {
            console.error('[USER-DIAGNOSTICS] Error updating premium status:', updateError);
          } else {
            console.log('[USER-DIAGNOSTICS] Premium status updated successfully');
            fixes.push('Updated premium status based on payment history');
          }
        }
      }
    }
    
    // Check projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId);
      
    if (projectsError) {
      console.error('[USER-DIAGNOSTICS] Error checking projects:', projectsError);
      problems.push('Error checking user projects');
    } else if (!projects || projects.length === 0) {
      console.log('[USER-DIAGNOSTICS] No projects found');
      diagnostics.projects = {
        hasProjects: false
      };
    } else {
      console.log('[USER-DIAGNOSTICS] Projects found:', projects);
      diagnostics.projects = {
        hasProjects: true,
        projectCount: projects.length,
        projects: projects
      };
    }
    
    // Check for Stripe subscription
    if (profile?.subscription_id) {
      try {
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        
        if (!stripeKey) {
          console.error('[USER-DIAGNOSTICS] Stripe key not found');
          problems.push('Stripe key not configured');
        } else {
          console.log('[USER-DIAGNOSTICS] Checking Stripe subscription');
          
          const stripe = new Stripe(stripeKey, {
            apiVersion: '2022-11-15'
          });
          
          const subscription = await stripe.subscriptions.retrieve(profile.subscription_id);
          
          console.log('[USER-DIAGNOSTICS] Stripe subscription:', subscription);
          diagnostics.stripe = {
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          };
          
          // Check for inconsistency between Stripe and database
          if (subscription.status === 'active' && (!profile.is_premium || profile.subscription_status !== 'active')) {
            problems.push('Stripe subscription is active but profile status is not premium');
            
            // Fix this issue if requested
            if (forceFixPremium) {
              console.log('[USER-DIAGNOSTICS] Updating premium status based on Stripe subscription');
              
              const { error: updateError } = await supabase
                .from('profiles')
                .update({
                  is_premium: true,
                  subscription_status: 'active',
                  subscription_expiry: new Date(subscription.current_period_end * 1000).toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('id', userId);
                
              if (updateError) {
                console.error('[USER-DIAGNOSTICS] Error updating premium status:', updateError);
              } else {
                console.log('[USER-DIAGNOSTICS] Premium status updated successfully');
                fixes.push('Updated premium status based on active Stripe subscription');
              }
            }
          } else if (subscription.status !== 'active' && profile.is_premium) {
            problems.push('Profile marked as premium but Stripe subscription is not active');
          }
        }
      } catch (e) {
        console.error('[USER-DIAGNOSTICS] Exception checking Stripe subscription:', e);
        problems.push('Error checking Stripe subscription');
        diagnostics.stripe = {
          error: e.message || 'Unknown error checking subscription'
        };
      }
    }
    
    // Run edge function test for subscription check
    try {
      console.log('[USER-DIAGNOSTICS] Testing check-subscription-status edge function');
      
      const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke(
        'check-subscription-status',
        { body: { userId } }
      );
      
      if (subscriptionError) {
        console.error('[USER-DIAGNOSTICS] Error calling check-subscription-status:', subscriptionError);
        problems.push('Error calling subscription check edge function');
        diagnostics.edgeFunctions = {
          ...diagnostics.edgeFunctions,
          subscriptionCheck: {
            success: false,
            error: subscriptionError
          }
        };
      } else {
        console.log('[USER-DIAGNOSTICS] check-subscription-status result:', subscriptionData);
        diagnostics.edgeFunctions = {
          ...diagnostics.edgeFunctions,
          subscriptionCheck: {
            success: true,
            isPremium: subscriptionData.isPremium
          }
        };
        
        // Check for inconsistency
        if (profile?.is_premium !== subscriptionData.isPremium) {
          problems.push('Inconsistency between profile premium status and subscription check result');
        }
      }
    } catch (e) {
      console.error('[USER-DIAGNOSTICS] Exception testing check-subscription-status edge function:', e);
      problems.push('Exception testing subscription check edge function');
    }
    
    console.log('[USER-DIAGNOSTICS] Diagnostics completed');
    
    return {
      userId,
      diagnostics,
      problems,
      fixes: fixes.length > 0 ? { success: true, fixes } : { success: false },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[USER-DIAGNOSTICS] Error in diagnoseUserData:', error);
    return {
      userId,
      error: error.message || 'Unknown error occurred',
      diagnostics,
      problems: [...problems, 'Exception during diagnostics: ' + (error.message || 'Unknown error')],
      timestamp: new Date().toISOString()
    };
  }
}
