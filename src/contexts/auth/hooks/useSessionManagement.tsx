
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export const useSessionManagement = (
  onUserAuthenticated: (userId: string) => Promise<void>
) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const profileFetchInProgress = useRef(false);
  
  // Refresh session and check auth status
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[SESSION] Refreshing auth session');
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[SESSION] Error refreshing session:', error);
        setUser(null);
        setSession(null);
        return false;
      }
      
      const { session: refreshedSession, user: refreshedUser } = data;
      
      if (refreshedSession && refreshedUser) {
        console.log('[SESSION] Successfully refreshed session');
        setSession(refreshedSession);
        setUser(refreshedUser);
        
        // Only trigger user authenticated handler if this is a newly authenticated user
        const isNewLogin = !user || user.id !== refreshedUser.id;
        if (isNewLogin && !profileFetchInProgress.current) {
          profileFetchInProgress.current = true;
          
          try {
            await onUserAuthenticated(refreshedUser.id);
          } catch (err) {
            console.error('[SESSION] Error in onUserAuthenticated after refresh:', err);
          } finally {
            profileFetchInProgress.current = false;
          }
        }
        
        return true;
      } else {
        console.log('[SESSION] No valid session after refresh');
        setUser(null);
        setSession(null);
        return false;
      }
    } catch (error) {
      console.error('[SESSION] Exception in refreshSession:', error);
      return false;
    }
  }, [user, onUserAuthenticated]);

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
