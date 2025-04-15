
import { User, Session } from '@supabase/supabase-js';
import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { clearPremiumFromLocalStorage } from '../local-storage-utils';

export const useSessionManagement = (
  handleUserAuthenticated: (userId: string) => Promise<void>
) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const refreshInProgress = useRef(false);
  const authErrorCount = useRef(0);
  const lastRefreshAttempt = useRef<number>(0);
  const profileFetchInProgress = useRef(false);

  // Reset error count periodically
  useEffect(() => {
    const resetInterval = setInterval(() => {
      if (authErrorCount.current > 0) {
        console.log('[SESSION] Resetting auth error counter');
        authErrorCount.current = 0;
      }
    }, 60000); // Reset every minute
    
    return () => clearInterval(resetInterval);
  }, []);

  const refreshSession = useCallback(async () => {
    // Prevent refreshing too frequently (minimum 3 seconds between refreshes)
    const now = Date.now();
    if (now - lastRefreshAttempt.current < 3000) {
      console.log('[SESSION] Refresh attempted too soon, skipping');
      return false;
    }
    
    // Prevent concurrent refresh calls
    if (refreshInProgress.current) {
      console.log('[SESSION] Session refresh already in progress, skipping');
      return false;
    }
    
    lastRefreshAttempt.current = now;
    
    try {
      refreshInProgress.current = true;
      console.log('[SESSION] Manually refreshing session');
      
      // First check if session exists at all
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[SESSION] Error getting session:', sessionError);
        return false;
      }
      
      if (!sessionData.session) {
        console.log('[SESSION] No session found during refresh');
        return false;
      }
      
      // Now try to refresh token if needed
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[SESSION] Error refreshing session:', error);
        authErrorCount.current += 1;
        
        if (authErrorCount.current > 5) {
          console.error('[SESSION] Too many auth errors, clearing local state');
          clearPremiumFromLocalStorage();
        }
        
        return false;
      }
      
      if (data.session) {
        console.log('[SESSION] Session refreshed successfully, updating state with user:', data.session.user?.id);
        setSession(data.session);
        setUser(data.session.user);
        authErrorCount.current = 0;
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[SESSION] Exception refreshing session:', error);
      authErrorCount.current += 1;
      return false;
    } finally {
      // Add a small delay before allowing another refresh
      setTimeout(() => {
        refreshInProgress.current = false;
      }, 1000);
    }
  }, []);

  return {
    user,
    setUser,
    session,
    setSession,
    loading,
    setLoading,
    authInitialized,
    setAuthInitialized,
    refreshSession,
    profileFetchInProgress
  };
};
