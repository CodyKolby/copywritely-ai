
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Run diagnostics on a user account and try to fix any issues
 */
export const diagnoseAndFixUserAccount = async (userId: string) => {
  if (!userId) {
    console.error('[DIAGNOSTICS] No user ID provided for diagnostics');
    return {
      success: false,
      message: 'No user ID provided'
    };
  }
  
  try {
    console.log('[DIAGNOSTICS] Running diagnostics for user:', userId);
    toast.info('Uruchamianie diagnostyki konta...');
    
    // First get the user profile directly to check its state
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError) {
      console.error('[DIAGNOSTICS] Error fetching profile data:', profileError);
    } else {
      console.log('[DIAGNOSTICS] Current profile state:', profileData);
    }
    
    // Check payment logs for this user
    const { data: paymentLogs, error: paymentError } = await supabase
      .from('payment_logs')
      .select('*')
      .eq('user_id', userId);
      
    if (paymentError) {
      console.error('[DIAGNOSTICS] Error fetching payment logs:', paymentError);
    } else {
      console.log('[DIAGNOSTICS] Payment logs:', paymentLogs);
    }
    
    // Check projects for this user
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId);
      
    if (projectsError) {
      console.error('[DIAGNOSTICS] Error fetching projects:', projectsError);
    } else {
      console.log('[DIAGNOSTICS] Projects:', projects);
    }
    
    // Now call the server function for more advanced diagnostics
    const { data, error } = await supabase.functions.invoke('diagnose-user-data', {
      body: { userId }
    });
    
    if (error) {
      console.error('[DIAGNOSTICS] Error invoking diagnostics:', error);
      toast.error('Błąd podczas diagnostyki konta', { 
        description: 'Spróbuj ponownie później lub skontaktuj się z obsługą' 
      });
      
      return {
        success: false,
        message: 'Error invoking diagnostics',
        error,
        profile: profileData,
        paymentLogs,
        projects
      };
    }
    
    console.log('[DIAGNOSTICS] Diagnostics results:', data);
    
    // Show results to user
    if (data.fixes && data.fixes.success) {
      toast.success('Naprawiono problemy z kontem', {
        description: `Zastosowano ${data.fixes.fixes.length} poprawek`
      });
    } else if (data.diagnostics && data.diagnostics.problems.length > 0) {
      toast.warning('Wykryto problemy z kontem', {
        description: `Wykryto ${data.diagnostics.problems.length} problemów`
      });
    } else {
      toast.success('Konto działa poprawnie', {
        description: 'Nie wykryto żadnych problemów'
      });
    }
    
    return {
      success: true,
      data,
      profile: profileData,
      paymentLogs,
      projects
    };
  } catch (error) {
    console.error('[DIAGNOSTICS] Exception running diagnostics:', error);
    toast.error('Wystąpił błąd podczas diagnostyki konta');
    
    return {
      success: false,
      message: 'Exception running diagnostics',
      error
    };
  }
};

/**
 * Test critical user functions with comprehensive logging
 */
export const testCriticalFunctions = async (userId: string) => {
  console.log('[CRITICAL-TEST] ===== BEGINNING CRITICAL FUNCTION TESTS =====');
  console.log('[CRITICAL-TEST] Testing for user ID:', userId);
  
  const results: Record<string, any> = {
    userId,
    tests: {},
    timestamp: new Date().toISOString()
  };
  
  try {
    toast.info('Testowanie krytycznych funkcji aplikacji...');
    
    // Test 1: Check if user session is valid
    console.log('[CRITICAL-TEST] Test 1: Checking user session validity');
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[CRITICAL-TEST] Session error:', sessionError);
        results.tests.session = { success: false, error: sessionError };
      } else {
        console.log('[CRITICAL-TEST] Session data:', sessionData);
        results.tests.session = { 
          success: true, 
          hasSession: !!sessionData.session,
          userId: sessionData.session?.user?.id,
          expiresAt: sessionData.session?.expires_at
        };
      }
    } catch (e) {
      console.error('[CRITICAL-TEST] Exception checking session:', e);
      results.tests.session = { success: false, error: e };
    }
    
    // Test 2: Direct check for profile data
    console.log('[CRITICAL-TEST] Test 2: Checking profile data');
    try {
      const start = Date.now();
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      const duration = Date.now() - start;
      
      if (profileError) {
        console.error('[CRITICAL-TEST] Profile error:', profileError);
        results.tests.profile = { success: false, error: profileError, duration };
      } else {
        console.log('[CRITICAL-TEST] Profile data:', profileData);
        results.tests.profile = { 
          success: true, 
          exists: !!profileData,
          isPremium: profileData?.is_premium || false,
          subscriptionStatus: profileData?.subscription_status,
          subscriptionExpiry: profileData?.subscription_expiry,
          duration
        };
      }
    } catch (e) {
      console.error('[CRITICAL-TEST] Exception checking profile:', e);
      results.tests.profile = { success: false, error: e };
    }
    
    // Test 3: Check subscription via Edge Function
    console.log('[CRITICAL-TEST] Test 3: Testing check-subscription-status edge function');
    try {
      const start = Date.now();
      
      // Set a timeout for the function call
      const functionPromise = supabase.functions.invoke('check-subscription-status', {
        body: { userId }
      });
      
      const timeoutPromise = new Promise<{data: null, error: Error}>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout checking subscription status'));
        }, 5000); // 5 second timeout
      });
      
      // Race between function call and timeout
      const result = await Promise.race([
        functionPromise,
        timeoutPromise
      ]);
      
      const duration = Date.now() - start;
      
      console.log('[CRITICAL-TEST] Subscription status edge function result:', result);
      results.tests.subscriptionEdgeFunction = { 
        success: !result.error, 
        data: result.data, 
        error: result.error,
        duration
      };
    } catch (e) {
      console.error('[CRITICAL-TEST] Exception checking subscription with edge function:', e);
      results.tests.subscriptionEdgeFunction = { 
        success: false, 
        error: e,
        timedOut: e.message?.includes('Timeout') 
      };
    }
    
    // Test 4: Try to create a checkout session
    console.log('[CRITICAL-TEST] Test 4: Testing stripe-checkout edge function');
    try {
      const start = Date.now();
      
      const priceId = 'price_1R5A8aAGO17NLUWtxzthF8lo'; // Sample price ID for test
      const origin = window.location.origin;
      const successUrl = `${origin}/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${origin}/pricing?canceled=true`;
      
      // Set a timeout for the function call
      const functionPromise = supabase.functions.invoke('stripe-checkout', {
        body: {
          priceId,
          userId,
          successUrl,
          cancelUrl,
          timestamp: new Date().toISOString()
        }
      });
      
      const timeoutPromise = new Promise<{data: null, error: Error}>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout creating checkout session'));
        }, 5000); // 5 second timeout
      });
      
      // Race between function call and timeout
      const result = await Promise.race([
        functionPromise,
        timeoutPromise
      ]);
      
      const duration = Date.now() - start;
      
      console.log('[CRITICAL-TEST] Checkout session creation result:', result);
      results.tests.checkoutSession = { 
        success: !result.error && !!result.data?.url, 
        hasUrl: !!result.data?.url,
        error: result.error,
        duration
      };
    } catch (e) {
      console.error('[CRITICAL-TEST] Exception creating checkout session:', e);
      results.tests.checkoutSession = { 
        success: false, 
        error: e,
        timedOut: e.message?.includes('Timeout') 
      };
    }
    
    // Test 5: Fetch projects
    console.log('[CRITICAL-TEST] Test 5: Testing projects fetch');
    try {
      const start = Date.now();
      
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, title, created_at, updated_at')
        .eq('user_id', userId);
        
      const duration = Date.now() - start;
      
      if (projectsError) {
        console.error('[CRITICAL-TEST] Projects fetch error:', projectsError);
        results.tests.projects = { success: false, error: projectsError, duration };
      } else {
        console.log('[CRITICAL-TEST] Projects data:', projects);
        results.tests.projects = { 
          success: true, 
          count: projects?.length || 0,
          projects,
          duration
        };
      }
    } catch (e) {
      console.error('[CRITICAL-TEST] Exception fetching projects:', e);
      results.tests.projects = { success: false, error: e };
    }
    
    // Create comprehensive summary
    results.summary = analyzeFunctionTestResults(results);
    
    console.log('[CRITICAL-TEST] All tests completed. Summary:', results.summary);
    console.log('[CRITICAL-TEST] Full test results:', results);
    
    // Show results to user
    if (results.summary.criticalIssuesCount > 0) {
      toast.error(`Wykryto ${results.summary.criticalIssuesCount} krytyczne problemy`, {
        description: results.summary.mainIssue
      });
    } else if (results.summary.warningsCount > 0) {
      toast.warning(`Wykryto ${results.summary.warningsCount} ostrzeżenia`, {
        description: results.summary.mainIssue
      });
    } else {
      toast.success('Wszystkie funkcje działają poprawnie', {
        description: 'Nie wykryto żadnych problemów'
      });
    }
    
    // Try to fix critical issues
    if (results.summary.criticalIssuesCount > 0 || results.summary.warningsCount > 0) {
      await applyEmergencyFixes(userId, results);
    }
    
    return results;
  } catch (error) {
    console.error('[CRITICAL-TEST] Exception running tests:', error);
    toast.error('Błąd podczas testowania funkcji');
    
    results.overallError = error;
    return results;
  } finally {
    console.log('[CRITICAL-TEST] ===== CRITICAL FUNCTION TESTS COMPLETE =====');
  }
};

/**
 * Analyze test results and create a summary
 */
const analyzeFunctionTestResults = (results: Record<string, any>) => {
  const summary: Record<string, any> = {
    criticalIssuesCount: 0,
    warningsCount: 0,
    issues: [] as string[],
    mainIssue: '',
    suggestedFixes: [] as string[]
  };
  
  // Check session issues
  if (!results.tests.session?.success || !results.tests.session?.hasSession) {
    summary.criticalIssuesCount++;
    summary.issues.push('Sesja użytkownika jest nieprawidłowa lub wygasła');
    summary.suggestedFixes.push('Wyloguj i zaloguj się ponownie');
  }
  
  // Check profile issues
  if (!results.tests.profile?.success || !results.tests.profile?.exists) {
    summary.criticalIssuesCount++;
    summary.issues.push('Brak profilu użytkownika w bazie danych');
    summary.suggestedFixes.push('Utwórz nowy profil użytkownika');
  } else if (results.tests.profile.duration > 1000) {
    summary.warningsCount++;
    summary.issues.push('Pobieranie profilu trwa zbyt długo');
  }
  
  // Check subscription edge function issues
  if (!results.tests.subscriptionEdgeFunction?.success) {
    if (results.tests.subscriptionEdgeFunction?.timedOut) {
      summary.criticalIssuesCount++;
      summary.issues.push('Funkcja sprawdzania subskrypcji przekroczyła limit czasu');
      summary.suggestedFixes.push('Sprawdź połączenie z internetem lub spróbuj ponownie później');
    } else {
      summary.criticalIssuesCount++;
      summary.issues.push('Funkcja sprawdzania subskrypcji zwróciła błąd');
    }
  } else if (results.tests.subscriptionEdgeFunction.duration > 2000) {
    summary.warningsCount++;
    summary.issues.push('Sprawdzanie subskrypcji trwa zbyt długo');
  }
  
  // Check checkout session issues
  if (!results.tests.checkoutSession?.success) {
    if (results.tests.checkoutSession?.timedOut) {
      summary.criticalIssuesCount++;
      summary.issues.push('Funkcja tworzenia sesji płatności przekroczyła limit czasu');
      summary.suggestedFixes.push('Sprawdź połączenie z internetem lub spróbuj ponownie później');
    } else {
      summary.criticalIssuesCount++;
      summary.issues.push('Funkcja tworzenia sesji płatności zwróciła błąd');
    }
  } else if (results.tests.checkoutSession.duration > 2000) {
    summary.warningsCount++;
    summary.issues.push('Tworzenie sesji płatności trwa zbyt długo');
  }
  
  // Check projects issues
  if (!results.tests.projects?.success) {
    summary.criticalIssuesCount++;
    summary.issues.push('Błąd podczas pobierania projektów');
  } else if (results.tests.projects.duration > 1000) {
    summary.warningsCount++;
    summary.issues.push('Pobieranie projektów trwa zbyt długo');
  }
  
  // Set main issue
  if (summary.issues.length > 0) {
    summary.mainIssue = summary.issues[0];
  } else {
    summary.mainIssue = 'Nie wykryto żadnych problemów';
  }
  
  return summary;
};

/**
 * Apply emergency fixes for critical issues
 */
const applyEmergencyFixes = async (userId: string, testResults: Record<string, any>) => {
  console.log('[EMERGENCY-FIX] Applying emergency fixes for user:', userId);
  
  const fixes: string[] = [];
  
  // Fix 1: If profile doesn't exist, create it
  if (!testResults.tests.profile?.exists) {
    console.log('[EMERGENCY-FIX] Creating missing profile');
    
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          is_premium: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        console.error('[EMERGENCY-FIX] Error creating profile:', error);
      } else {
        console.log('[EMERGENCY-FIX] Profile created successfully');
        fixes.push('Utworzono brakujący profil użytkownika');
      }
    } catch (e) {
      console.error('[EMERGENCY-FIX] Exception creating profile:', e);
    }
  }
  
  // Fix 2: If session is invalid but profile exists, try to force premium update
  if ((!testResults.tests.session?.success || !testResults.tests.session?.hasSession) && 
      testResults.tests.profile?.exists) {
    console.log('[EMERGENCY-FIX] Attempting to refresh premium status');
    
    try {
      // Call edge function directly to fix premium status
      const { data, error } = await supabase.functions.invoke('diagnose-user-data', {
        body: { userId, forceFixPremium: true }
      });
      
      if (error) {
        console.error('[EMERGENCY-FIX] Error fixing premium status:', error);
      } else {
        console.log('[EMERGENCY-FIX] Premium status fixed:', data);
        if (data?.fixes?.success) {
          fixes.push('Naprawiono status premium');
        }
      }
    } catch (e) {
      console.error('[EMERGENCY-FIX] Exception fixing premium status:', e);
    }
  }
  
  // Fix 3: If payment logs exist but profile is not premium, update profile
  if (testResults.tests.profile?.exists && !testResults.tests.profile?.isPremium) {
    try {
      console.log('[EMERGENCY-FIX] Checking payment logs for premium eligibility');
      
      const { data: paymentLogs, error: paymentError } = await supabase
        .from('payment_logs')
        .select('*')
        .eq('user_id', userId);
        
      if (paymentError) {
        console.error('[EMERGENCY-FIX] Error checking payment logs:', paymentError);
      } else if (paymentLogs && paymentLogs.length > 0) {
        console.log('[EMERGENCY-FIX] Found payment logs, updating premium status');
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            is_premium: true,
            subscription_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        if (updateError) {
          console.error('[EMERGENCY-FIX] Error updating premium status:', updateError);
        } else {
          console.log('[EMERGENCY-FIX] Premium status updated successfully');
          fixes.push('Zaktualizowano status premium na podstawie historii płatności');
        }
      } else {
        console.log('[EMERGENCY-FIX] No payment logs found');
      }
    } catch (e) {
      console.error('[EMERGENCY-FIX] Exception checking payment logs:', e);
    }
  }
  
  // Show results
  if (fixes.length > 0) {
    console.log('[EMERGENCY-FIX] Applied fixes:', fixes);
    toast.success('Zastosowano automatyczne poprawki', {
      description: fixes.join(', ')
    });
    return { success: true, fixes };
  } else {
    console.log('[EMERGENCY-FIX] No fixes applied');
    return { success: false };
  }
};
