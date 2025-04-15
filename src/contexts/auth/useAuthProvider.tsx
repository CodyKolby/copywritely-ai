
import React, { useState, useEffect, useCallback } from 'react';
import { supabase, checkConnectionHealth } from '@/integrations/supabase/client';
import { Profile } from './types';
import { fetchProfile } from './profile-utils';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, signOut } from './auth-methods';
import { clearPremiumFromLocalStorage } from './local-storage-utils';
import { useTestUser } from './use-test-user';
import { usePremiumVerification } from './hooks/usePremiumVerification';
import { useSessionManagement } from './hooks/useSessionManagement';
import { toast } from 'sonner';

export const useAuthProvider = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    online: boolean;
    supabaseConnected: boolean;
    lastChecked: number;
  }>({
    online: true,
    supabaseConnected: true,
    lastChecked: 0
  });
  
  const { 
    testUser, 
    testSession, 
    testIsPremium, 
    testProfile, 
    setTestUserState 
  } = useTestUser();

  const {
    isPremium,
    setIsPremium,
    handleUserAuthenticated,
    checkUserPremiumStatus
  } = usePremiumVerification();

  const {
    user,
    setUser,
    session,
    setSession,
    loading,
    setLoading,
    authInitialized,
    setAuthInitialized,
    refreshSession
  } = useSessionManagement(handleUserAuthenticated);

  // Check connection health periodically
  const checkConnection = useCallback(async () => {
    const now = Date.now();
    
    // Don't check more than once every 15 seconds unless forced
    if (now - connectionStatus.lastChecked < 15000) {
      return connectionStatus;
    }
    
    try {
      const status = await checkConnectionHealth();
      
      setConnectionStatus({
        online: status.online,
        supabaseConnected: status.supabaseConnected,
        lastChecked: now
      });
      
      return status;
    } catch (e) {
      console.error('[AUTH] Error checking connection health:', e);
      
      setConnectionStatus({
        online: navigator.onLine,
        supabaseConnected: false,
        lastChecked: now
      });
      
      return {
        online: navigator.onLine,
        supabaseConnected: false
      };
    }
  }, [connectionStatus.lastChecked]);

  // Function to fetch and set user profile with connection checks
  const fetchAndSetProfile = async (userId: string) => {
    try {
      // Check connection before fetching profile
      const connStatus = await checkConnection();
      
      if (!connStatus.online) {
        console.log('[AUTH] Device is offline, skipping profile fetch');
        toast.error('Brak połączenia z internetem', {
          description: 'Sprawdź połączenie internetowe i spróbuj ponownie'
        });
        return null;
      }
      
      if (!connStatus.supabaseConnected) {
        console.log('[AUTH] Supabase connection issues, will try profile fetch anyway');
        toast.error('Problem z połączeniem do serwera', {
          description: 'Próbujemy naprawić problem automatycznie...'
        });
      }
      
      console.log('[AUTH] Fetching profile for user:', userId);
      const userProfile = await fetchProfile(userId);
      
      if (userProfile) {
        console.log('[AUTH] Profile fetched successfully:', userProfile);
        setProfile(userProfile);
        return userProfile;
      } else {
        console.warn('[AUTH] No profile found for user:', userId);
        
        console.log('[AUTH] Creating profile through regular methods');
        try {
          const { data: createData, error: createError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              is_premium: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .maybeSingle();
            
          if (!createError && createData) {
            console.log('[AUTH] Profile created successfully:', createData);
            setProfile(createData as Profile);
            return createData as Profile;
          } else {
            console.error('[AUTH] Error creating profile:', createError);
          }
        } catch (e) {
          console.error('[AUTH] Exception creating profile:', e);
        }
      }
    } catch (profileError) {
      console.error('[AUTH] Error fetching profile:', profileError);
    }
    return null;
  };

  // Connection status monitoring
  useEffect(() => {
    const handleOnline = () => {
      console.log('[AUTH] Device went online');
      setConnectionStatus(prev => ({
        ...prev,
        online: true,
        lastChecked: 0 // Force a fresh check
      }));
      
      // Refresh session when going online
      if (user) {
        refreshSession();
      }
    };
    
    const handleOffline = () => {
      console.log('[AUTH] Device went offline');
      setConnectionStatus(prev => ({
        ...prev,
        online: false
      }));
    };
    
    // Setup event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial connection check
    checkConnection();
    
    // Periodic connection checks
    const intervalId = setInterval(() => {
      checkConnection();
    }, 60000); // Check every minute
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [checkConnection, refreshSession, user]);

  useEffect(() => {
    console.log("[AUTH] Setting up auth state listener");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("[AUTH] Auth state changed", event, !!newSession?.user);
      
      if (!testUser) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          if (newSession.user.email) {
            localStorage.setItem('userEmail', newSession.user.email);
          }
          
          // Fetch profile info with retries
          let retries = 3;
          let userProfile = null;
          
          while (retries > 0 && !userProfile) {
            try {
              userProfile = await fetchAndSetProfile(newSession.user.id);
              if (userProfile) break;
            } catch (profileError) {
              console.error(`[AUTH] Error fetching profile during auth change (retry ${4-retries}/3):`, profileError);
            }
            retries--;
            if (retries > 0) await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          // Use setTimeout to avoid deadlocks with auth state change
          setTimeout(() => {
            handleUserAuthenticated(newSession.user.id);
          }, 0);
        } else {
          setIsPremium(false);
          setProfile(null);
          clearPremiumFromLocalStorage();
        }
      }
    });

    const initializeAuth = async () => {
      try {
        console.log('[AUTH] Initializing auth state');
        
        if (testUser) {
          setUser(testUser);
          setSession(testSession);
          setIsPremium(testIsPremium);
          setProfile(testProfile);
          setLoading(false);
          setAuthInitialized(true);
          return;
        }

        // First check connection before attempting to get session
        const connStatus = await checkConnection();
        if (!connStatus.supabaseConnected) {
          console.log('[AUTH] Connection issues detected during initialization');
          toast.error('Problem z połączeniem do serwera', {
            description: 'Próbujemy nawiązać połączenie...'
          });
          
          // Retry connection after a short delay
          setTimeout(async () => {
            const retryStatus = await checkConnection();
            if (!retryStatus.supabaseConnected) {
              console.log('[AUTH] Still having connection issues after retry');
              toast.error('Nadal występują problemy z połączeniem', {
                description: 'Odśwież stronę lub spróbuj ponownie później'
              });
            }
          }, 3000);
        }

        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AUTH] Error getting session:', error);
        }
        
        if (currentSession?.user) {
          console.log('[AUTH] Found existing session, user ID:', currentSession.user.id);
          
          if (currentSession.user.email) {
            localStorage.setItem('userEmail', currentSession.user.email);
          }
          
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Fetch profile info with retries
          let retries = 3;
          let userProfile = null;
          
          while (retries > 0 && !userProfile) {
            try {
              userProfile = await fetchAndSetProfile(currentSession.user.id);
              if (userProfile) break;
            } catch (profileError) {
              console.error(`[AUTH] Error fetching profile during initialization (retry ${4-retries}/3):`, profileError);
            }
            retries--;
            if (retries > 0) await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          // Use setTimeout to avoid deadlocks
          setTimeout(async () => {
            await handleUserAuthenticated(currentSession.user.id);
          }, 0);
        } else {
          console.log('[AUTH] No active session found');
          setSession(null);
          setUser(null);
          clearPremiumFromLocalStorage();
        }
        
        setAuthInitialized(true);
      } catch (error) {
        console.error('[AUTH] Error initializing auth:', error);
        setAuthInitialized(true);
      }
      
      setLoading(false);
    };

    initializeAuth();

    return () => {
      console.log("[AUTH] Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [testUser, testSession, testIsPremium, testProfile, handleUserAuthenticated, setIsPremium, setUser, setSession, checkConnection]);

  return {
    user: testUser || user, 
    session: testSession || session, 
    loading, 
    isPremium: testIsPremium || isPremium,
    profile: testProfile || profile,
    authInitialized,
    connectionStatus,
    checkConnection,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut: () => {
      clearPremiumFromLocalStorage();
      return signOut();
    },
    checkPremiumStatus: checkUserPremiumStatus,
    refreshSession,
    setTestUserState,
    fetchAndSetProfile
  };
};
