
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Test all critical user functions with fast, independent checks
 */
export const testCriticalFunctions = async (userId: string) => {
  console.log('[CRITICAL-TEST] ===== BEGINNING CRITICAL FUNCTION TESTS =====');
  console.log('[CRITICAL-TEST] Testing for user ID:', userId);
  
  // Results object to store all test outcomes
  const results: Record<string, any> = {
    userId,
    tests: {},
    timestamp: new Date().toISOString()
  };
  
  // Show initial toast that will be updated or dismissed later
  const toastId = 'diagnostics-running';
  toast({
    id: toastId,
    title: 'Diagnostyka w toku...',
    description: 'Sprawdzanie połączenia z serwerem...',
    duration: 30000 // Set a long duration as we'll dismiss it manually
  });
  
  // Use an AbortController to cancel ongoing tests if needed
  const controller = new AbortController();
  
  // Function to safely run an edge function with timeout
  const safeEdgeInvoke = async <T>(
    functionName: string, 
    payload: any, 
    timeoutMs: number
  ): Promise<{ data?: T; error?: string; timedOut?: boolean }> => {
    try {
      // Set up a timeout that rejects the promise
      const timeoutPromise = new Promise<{ data?: T; error: string; timedOut: true }>(
        (_, reject) => {
          setTimeout(() => {
            reject({ error: `${functionName} timeout`, timedOut: true });
          }, timeoutMs);
        }
      );
      
      // Make the actual request
      const functionPromise = supabase.functions.invoke(functionName, {
        body: payload
      });
      
      // Race the request against the timeout
      const result = await Promise.race([functionPromise, timeoutPromise]);
      
      // Type assertion for proper typing
      const typedResult = result as { data?: T; error?: any };
      
      if (typedResult.error) {
        return { 
          error: typeof typedResult.error === 'string' 
            ? typedResult.error 
            : JSON.stringify(typedResult.error),
          timedOut: false
        };
      }
      
      return { data: typedResult.data as T };
    } catch (error) {
      // If the error is our timeout rejection, return the timeout error
      if (typeof error === 'object' && error !== null && 'timedOut' in error) {
        return error as { error: string; timedOut: true };
      }
      
      // Otherwise, return a generic error
      return { 
        error: error instanceof Error ? error.message : 'Unknown error',
        timedOut: false
      };
    }
  };
  
  // Test 1: Local Browser Session Test (independent of supabase.auth.getSession)
  console.log('[CRITICAL-TEST] Test 1: Testing local browser session');
  try {
    const localSessionStart = Date.now();
    const storedSession = localStorage.getItem('sb-jorbqjareswzdrsmepbv-auth-token');
    const localSessionDuration = Date.now() - localSessionStart;
    
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        const expiresAt = parsedSession?.expires_at;
        const currentUserId = parsedSession?.user?.id;
        
        results.tests.localSession = {
          success: true,
          hasSession: true,
          userId: currentUserId,
          matchesProvidedId: userId === currentUserId,
          expiresAt: expiresAt,
          expiresIn: expiresAt ? new Date(expiresAt * 1000).toISOString() : null,
          duration: localSessionDuration
        };
      } catch (parseError) {
        results.tests.localSession = {
          success: false,
          hasSession: true,
          error: 'Could not parse session data',
          duration: localSessionDuration
        };
      }
    } else {
      results.tests.localSession = {
        success: false,
        hasSession: false,
        error: 'No local session found',
        duration: localSessionDuration
      };
    }
  } catch (e) {
    results.tests.localSession = {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error checking local session'
    };
  }
  
  // Test 2: Direct Call to Edge Function
  console.log('[CRITICAL-TEST] Test 2: Testing diagnose-user-data edge function');
  try {
    const edgeStart = Date.now();
    
    const diagnosticResponse = await safeEdgeInvoke(
      'diagnose-user-data',
      { userId },
      10000 // 10 seconds timeout
    );
    
    const edgeDuration = Date.now() - edgeStart;
    
    if (diagnosticResponse.error) {
      results.tests.edgeFunction = {
        success: false,
        error: diagnosticResponse.error,
        timedOut: !!diagnosticResponse.timedOut,
        duration: edgeDuration
      };
    } else {
      results.tests.edgeFunction = {
        success: true,
        data: diagnosticResponse.data,
        duration: edgeDuration
      };
      
      // Save edge function diagnostic data for later use
      results.edgeDiagnostics = diagnosticResponse.data;
    }
  } catch (e) {
    results.tests.edgeFunction = {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error in edge function test'
    };
  }
  
  // Test 3: Direct Supabase Check (with timeout)
  console.log('[CRITICAL-TEST] Test 3: Testing direct database connection');
  try {
    const start = Date.now();
    
    // Create a promise that times out
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Direct supabase query timeout')), 3000);
    });
    
    // Create the actual query promise
    const queryPromise = supabase
      .from('profiles')
      .select('id, is_premium, subscription_status')
      .eq('id', userId)
      .maybeSingle();
    
    // Race them
    const result = await Promise.race([queryPromise, timeoutPromise]) as {
      data: any;
      error: any;
    };
    
    const duration = Date.now() - start;
    
    if (result.error) {
      results.tests.directDbQuery = {
        success: false,
        error: typeof result.error === 'string' 
          ? result.error 
          : (result.error?.message || JSON.stringify(result.error)),
        duration
      };
    } else {
      results.tests.directDbQuery = {
        success: true,
        profileFound: !!result.data,
        isPremium: result.data?.is_premium || false,
        subscriptionStatus: result.data?.subscription_status,
        duration
      };
    }
  } catch (e) {
    results.tests.directDbQuery = {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error in direct DB test'
    };
  }
  
  // Test 4: Connectivity Test - Replace supabase.io with a more reliable endpoint
  console.log('[CRITICAL-TEST] Test 4: Testing general internet connectivity');
  try {
    const connectStart = Date.now();
    
    // Create a timeout promise
    const connectTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connectivity test timeout')), 3000);
    });
    
    // Use a more reliable endpoint that supports CORS
    // Google's homepage is generally reliable and supports CORS
    const connectTest = fetch('https://www.google.com', { 
      method: 'HEAD',
      mode: 'no-cors', // Important: Use no-cors mode to prevent CORS errors
      signal: controller.signal 
    });
    
    try {
      // Race them - note that with no-cors we can't check status or ok
      await Promise.race([connectTest, connectTimeout]);
      const connectDuration = Date.now() - connectStart;
      
      // If we get here without error, the connection worked
      results.tests.connectivity = {
        success: true,
        info: 'Connection test successful',
        duration: connectDuration
      };
    } catch (error) {
      const connectDuration = Date.now() - connectStart;
      results.tests.connectivity = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown connectivity error',
        duration: connectDuration
      };
    }
  } catch (e) {
    results.tests.connectivity = {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error in connectivity test'
    };
  }
  
  // Create comprehensive summary
  results.summary = analyzeTestResults(results);
  
  console.log('[CRITICAL-TEST] All tests completed. Summary:', results.summary);
  console.log('[CRITICAL-TEST] Full test results:', results);
  
  // Dismiss the loading toast
  toast({
    id: toastId,
    title: 'Diagnostyka zakończona',
    description: 'Przetwarzanie wyników...',
    duration: 2000
  });
  
  // Show results to user
  showDiagnosticResults(results);
  
  // Abort any pending requests
  controller.abort();
  
  console.log('[CRITICAL-TEST] ===== CRITICAL FUNCTION TESTS COMPLETE =====');
  
  return results;
};

/**
 * Analyze test results and create a summary
 */
const analyzeTestResults = (results: Record<string, any>) => {
  const summary: Record<string, any> = {
    criticalIssuesCount: 0,
    warningsCount: 0,
    issues: [] as string[],
    mainIssue: '',
    suggestedFixes: [] as string[]
  };
  
  // Add network connectivity issues first if they exist
  if (!results.tests.connectivity?.success) {
    summary.criticalIssuesCount++;
    summary.issues.push('Problem z połączeniem internetowym');
    summary.suggestedFixes.push('Sprawdź połączenie internetowe i stabilność sieci');
  }
  
  // Check local session issues
  if (!results.tests.localSession?.success || !results.tests.localSession?.hasSession) {
    summary.criticalIssuesCount++;
    summary.issues.push('Sesja użytkownika jest nieprawidłowa lub wygasła');
    summary.suggestedFixes.push('Wyloguj i zaloguj się ponownie');
  }
  
  // Check edge function connectivity
  if (!results.tests.edgeFunction?.success) {
    if (results.tests.edgeFunction?.timedOut) {
      summary.criticalIssuesCount++;
      summary.issues.push('Połączenie z serwerem przekroczyło limit czasu');
      
      if (results.tests.connectivity?.success) {
        summary.suggestedFixes.push('Problem z dostępnością serwera - spróbuj ponownie później');
      } else {
        summary.suggestedFixes.push('Sprawdź połączenie internetowe lub spróbuj ponownie później');
      }
    } else {
      summary.criticalIssuesCount++;
      summary.issues.push('Błąd połączenia z funkcją diagnostyczną');
    }
  }
  
  // Check database connectivity
  if (!results.tests.directDbQuery?.success) {
    summary.criticalIssuesCount++;
    summary.issues.push('Błąd połączenia z bazą danych');
    
    if (results.tests.connectivity?.success) {
      summary.suggestedFixes.push('Problem z połączeniem do bazy danych - spróbuj ponownie później');
    } else {
      summary.suggestedFixes.push('Sprawdź połączenie internetowe');
    }
  } else if (results.tests.directDbQuery?.success && !results.tests.directDbQuery?.profileFound) {
    summary.criticalIssuesCount++;
    summary.issues.push('Brak profilu użytkownika w bazie danych');
    summary.suggestedFixes.push('Utwórz nowy profil użytkownika');
  }
  
  // Check edge diagnostics specific issues if available
  if (results.edgeDiagnostics) {
    if (results.edgeDiagnostics.problems && results.edgeDiagnostics.problems.length > 0) {
      results.edgeDiagnostics.problems.forEach((problem: string) => {
        if (problem.includes('premium') || problem.includes('Premium')) {
          summary.warningsCount++;
          summary.issues.push(problem);
        }
      });
    }
    
    // Add any fixes from the edge function
    if (results.edgeDiagnostics.fixes?.fixes?.length > 0) {
      results.edgeDiagnostics.fixes.fixes.forEach((fix: string) => {
        if (!summary.suggestedFixes.includes(fix)) {
          summary.suggestedFixes.push(fix);
        }
      });
    }
  }
  
  // Remove duplicate fixes
  summary.suggestedFixes = Array.from(new Set(summary.suggestedFixes));
  
  // Set main issue
  if (summary.issues.length > 0) {
    summary.mainIssue = summary.issues[0];
  } else {
    summary.mainIssue = 'Nie wykryto żadnych problemów';
  }
  
  return summary;
};

/**
 * Show diagnostic results to the user
 */
const showDiagnosticResults = (results: Record<string, any>) => {
  const { summary } = results;
  
  if (summary.criticalIssuesCount > 0) {
    toast({
      variant: "destructive",
      title: `Wykryto ${summary.criticalIssuesCount} krytyczne problemy`,
      description: summary.mainIssue,
      duration: 8000
    });
    
    // If we have suggested fixes, show them
    if (summary.suggestedFixes.length > 0) {
      setTimeout(() => {
        toast({
          title: 'Sugerowane rozwiązania',
          description: summary.suggestedFixes.join('; '),
          duration: 10000
        });
      }, 1000);
    }
  } else if (summary.warningsCount > 0) {
    toast({
      variant: "destructive",
      title: `Wykryto ${summary.warningsCount} ostrzeżenia`,
      description: summary.mainIssue,
      duration: 8000
    });
  } else {
    toast({
      title: 'Wszystkie funkcje działają poprawnie',
      description: 'Nie wykryto żadnych problemów'
    });
  }
  
  // If edge diagnostics were successful, show detailed report
  if (results.tests.edgeFunction?.success && results.edgeDiagnostics) {
    const services = results.edgeDiagnostics.services || {};
    const servicesChecked = Object.keys(services).length;
    const servicesFailed = Object.values(services).filter((s: any) => !s.success).length;
    
    if (servicesFailed > 0) {
      toast({
        variant: "destructive",
        title: `${servicesFailed}/${servicesChecked} usług nie działa poprawnie`,
        duration: 5000
      });
    } else if (servicesChecked > 0) {
      toast({
        title: `Wszystkie ${servicesChecked} usługi działają poprawnie`,
        duration: 5000
      });
    }
  }
};

/**
 * Run diagnostics on a user account with better error handling
 */
export const diagnoseAndFixUserAccount = async (userId: string) => {
  if (!userId) {
    console.error('[DIAGNOSTICS] No user ID provided for diagnostics');
    toast({
      variant: "destructive",
      title: 'Błąd',
      description: 'Nie podano ID użytkownika'
    });
    return {
      success: false,
      message: 'No user ID provided'
    };
  }
  
  try {
    console.log('[DIAGNOSTICS] Running diagnostics for user:', userId);
    toast({
      title: 'Informacja',
      description: 'Uruchamianie diagnostyki konta...'
    });
    
    // Run comprehensive diagnostics
    const results = await testCriticalFunctions(userId);
    
    return {
      success: true,
      results
    };
  } catch (error) {
    console.error('[DIAGNOSTICS] Exception running diagnostics:', error);
    toast({
      variant: "destructive",
      title: 'Błąd',
      description: 'Wystąpił błąd podczas diagnostyki konta'
    });
    
    return {
      success: false,
      message: 'Exception running diagnostics',
      error
    };
  }
};
