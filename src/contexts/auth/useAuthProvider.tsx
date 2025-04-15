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

  const checkConnection = useCallback(async (force = false) => {
    const now = Date.now();
    
    if (!force && now - connectionStatus.lastChecked < 10000) {
      return connectionStatus;
    }
    
    try {
      console.log('[AUTH] Checking connection health');
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

  const fetchAndSetProfile = async (userId: string) => {
    try {
      const connStatus = await checkConnection();
      
      if (!connStatus.online) {
        console.log('[AUTH] Device is offline, skipping profile fetch');
        return null;
      }
      
      if (!connStatus.supabaseConnected) {
        console.log('[AUTH] Connection issues detected, will attempt profile fetch anyway');
      }
      
      console.log('[AUTH] Fetching profile for user:', userId);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const userProfile = await fetchProfile(userId, controller.signal);
        clearTimeout(timeoutId);
        
        if (userProfile) {
          console.log('[AUTH] Profile fetched successfully');
          setProfile(userProfile);
          return userProfile;
        } else {
          console.warn('[AUTH] No profile found for user:', userId);
          
          if (connStatus.supabaseConnected) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
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
              
            clearTimeout(timeoutId);
            
            if (!createError && createData) {
              console.log('[AUTH] Profile created successfully');
              setProfile(createData as Profile);
              return createData as Profile;
            } else {
              console.error('[AUTH] Error creating profile:', createError);
            }
          } else {
            console.log('[AUTH] Skipping profile creation due to connection issues');
          }
        }
      } catch (abortError) {
        clearTimeout(timeoutId);
        if (abortError.name === 'AbortError') {
          console.error('[AUTH] Profile fetch timed out');
        } else {
          console.error('[AUTH] Error during profile fetch:', abortError);
        }
      }
    } catch (profileError) {
      console.error('[AUTH] Error in fetchAndSetProfile:', profileError);
    }
    
    return null;
  };

  useEffect(() => {
    const handleOnline = () => {
      console.log('[AUTH] Device went online');
      setConnectionStatus(prev => ({
        ...prev,
        online: true,
        lastChecked: 0
      }));
      
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
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    checkConnection();
    
    const intervalId = setInterval(() => {
      checkConnection();
    }, 30000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [checkConnection, refreshSession, user]);

  useEffect(() => {
    console.log("[AUTH] Setting up auth state listener");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!testUser) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          if (newSession.user.email) {
            localStorage.setItem('userEmail', newSession.user.email);
          }
          
          let retries = 2;
          let userProfile = null;
          
          while (retries >= 0 && !userProfile) {
            try {
              userProfile = await fetchAndSetProfile(newSession.user.id);
              if (userProfile) break;
            } catch (profileError) {
              console.error(`[AUTH] Error fetching profile (try ${2-retries}/2):`, profileError);
            }
            
            retries--;
            if (retries >= 0) {
              console.log(`[AUTH] Retrying profile fetch, ${retries+1} attempts remaining`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          
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

        const connStatus = await checkConnection(true);
        
        if (!connStatus.supabaseConnected) {
          console.log('[AUTH] Connection issues detected during initialization');
          toast.error('Problem z połączeniem do serwera', {
            description: 'Próbujemy nawiązać połączenie...'
          });
          
          setTimeout(async () => {
            await checkConnection(true);
          }, 3000);
        }

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const { data, error } = await supabase.auth.getSession({
            abortSignal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (error) {
            console.error('[AUTH] Error getting session:', error);
            throw error;
          }
          
          const currentSession = data.session;
          
          if (currentSession?.user) {
            console.log('[AUTH] Found existing session, user ID:', currentSession.user.id);
            
            if (currentSession.user.email) {
              localStorage.setItem('userEmail', currentSession.user.email);
            }
            
            setSession(currentSession);
            setUser(currentSession.user);
            
            let retries = 1;
            let userProfile = null;
            
            while (retries >= 0 && !userProfile) {
              try {
                userProfile = await fetchAndSetProfile(currentSession.user.id);
                if (userProfile) break;
              } catch (profileError) {
                console.error(`[AUTH] Error fetching profile during init (try ${1-retries}/1):`, profileError);
              }
              retries--;
              if (retries >= 0) await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            setTimeout(async () => {
              await handleUserAuthenticated(currentSession.user.id);
            }, 0);
          } else {
            console.log('[AUTH] No active session found');
            setSession(null);
            setUser(null);
            clearPremiumFromLocalStorage();
          }
        } catch (sessionError) {
          if (sessionError.name === 'AbortError') {
            console.error('[AUTH] Session fetch timed out');
            toast.error('Problem z weryfikacją sesji', {
              description: 'Odśwież stronę lub spróbuj ponownie za chwilę'
            });
          } else {
            console.error('[AUTH] Error getting session:', sessionError);
          }
          
          setSession(null);
          setUser(null);
          clearPremiumFromLocalStorage();
        }
      } catch (error) {
        console.error('[AUTH] Error initializing auth:', error);
      }
      
      setAuthInitialized(true);
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
