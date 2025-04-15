
import { User, Session } from '@supabase/supabase-js';
import { useState, useCallback, useRef } from 'react';
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

  const refreshSession = useCallback(async () => {
    // Prevent concurrent refresh calls
    if (refreshInProgress.current) {
      console.log('[SESSION] Session refresh already in progress, skipping');
      return false;
    }
    
    try {
      refreshInProgress.current = true;
      console.log('[SESSION] Manually refreshing session');
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[SESSION] Error refreshing session:', error);
        return false;
      }
      
      if (data.session) {
        console.log('[SESSION] Session refreshed successfully, updating state with user:', data.session.user?.id);
        setSession(data.session);
        setUser(data.session.user);
        
        if (data.session.user) {
          // Use setTimeout to prevent potential auth deadlocks
          setTimeout(() => {
            handleUserAuthenticated(data.session.user.id);
          }, 0);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[SESSION] Exception refreshing session:', error);
      return false;
    } finally {
      refreshInProgress.current = false;
    }
  }, [handleUserAuthenticated]);

  return {
    user,
    setUser,
    session,
    setSession,
    loading,
    setLoading,
    authInitialized,
    setAuthInitialized,
    refreshSession
  };
};
