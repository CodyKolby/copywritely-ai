
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  
  // Use to prevent concurrent profile fetch operations
  const fetchingProfile = useRef(false);

  // Limiting connection checks
  const connectionCheckTimeout = useRef<number | null>(null);
  
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
    refreshSession,
    profileFetchInProgress
  } = useSessionManagement(handleUserAuthenticated);

  const checkConnection = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Limit connection checks to once every 2 minutes unless forced
    if (!force && now - connectionStatus.lastChecked < 120000) {
      return connectionStatus;
    }
    
    if (connectionCheckTimeout.current) {
      clearTimeout(connectionCheckTimeout.current);
    }
    
    try {
      console.log('[AUTH] Checking connection health');
      setConnectionStatus(prev => ({...prev, lastChecked: now}));
      
      const isOnline = navigator.onLine;
      let supabaseConnected = connectionStatus.supabaseConnected;
      
      if (isOnline) {
        try {
          // Simple OPTIONS request to check if Supabase is reachable
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || "https://jorbqjareswzdrsmepbv.supabase.co"}/rest/v1/`, {
            method: 'HEAD',
            mode: 'cors'
          });
          
          supabaseConnected = response.ok;
        } catch (e) {
          console.error('[AUTH] Error checking connection with direct fetch:', e);
          supabaseConnected = false;
        }
      }
      
      const newStatus = {
        online: isOnline,
        supabaseConnected,
        lastChecked: now
      };
      
      setConnectionStatus(newStatus);
      return newStatus;
    } catch (e) {
      console.error('[AUTH] Error checking connection health:', e);
      
      const newStatus = {
        online: navigator.onLine,
        supabaseConnected: false,
        lastChecked: now
      };
      
      setConnectionStatus(newStatus);
      return newStatus;
    } finally {
      // Schedule next connection check in 2 minutes
      connectionCheckTimeout.current = window.setTimeout(() => {
        checkConnection(true);
      }, 120000);
    }
  }, [connectionStatus.lastChecked, connectionStatus.supabaseConnected]);

  const fetchAndSetProfile = useCallback(async (userId: string) => {
    // Prevent concurrent fetches
    if (fetchingProfile.current) {
      console.log('[AUTH] Profile fetch already in progress, skipping');
      return null;
    }
    
    fetchingProfile.current = true;
    
    try {
      if (!navigator.onLine) {
        console.log('[AUTH] Device is offline, skipping profile fetch');
        return null;
      }
      
      console.log('[AUTH] Fetching profile for user:', userId);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      try {
        const userProfile = await fetchProfile(userId, controller.signal);
        clearTimeout(timeoutId);
        
        if (userProfile) {
          console.log('[AUTH] Profile fetched successfully');
          setProfile(userProfile);
          return userProfile;
        } else {
          console.warn('[AUTH] No profile found for user:', userId);
          
          if (navigator.onLine) {
            console.log('[AUTH] Creating new profile for user');
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
                .single();
                
              if (!createError && createData) {
                console.log('[AUTH] Profile created successfully');
                setProfile(createData as Profile);
                return createData as Profile;
              } else {
                console.error('[AUTH] Error creating profile:', createError);
              }
            } catch (createError) {
              console.error('[AUTH] Error during profile creation:', createError);
            }
          }
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('[AUTH] Error during profile fetch:', error);
      }
    } catch (profileError) {
      console.error('[AUTH] Error in fetchAndSetProfile:', profileError);
    } finally {
      fetchingProfile.current = false;
    }
    
    return null;
  }, []);

  // Network status event handlers
  useEffect(() => {
    const handleOnline = () => {
      console.log('[AUTH] Device went online');
      setConnectionStatus(prev => ({
        ...prev,
        online: true
      }));
    };
    
    const handleOffline = () => {
      console.log('[AUTH] Device went offline');
      setConnectionStatus(prev => ({
        ...prev,
        online: false
      }));
      
      toast.error('Brak połączenia z internetem', {
        description: 'Niektóre funkcje mogą być niedostępne'
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial connection check
    checkConnection(true);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connectionCheckTimeout.current) {
        clearTimeout(connectionCheckTimeout.current);
      }
    };
  }, [checkConnection]);

  // Auth state listener setup
  useEffect(() => {
    if (testUser) {
      // Skip auth subscription for test users
      setAuthInitialized(true);
      setLoading(false);
      return () => {};
    }
    
    console.log("[AUTH] Setting up auth state listener");
    
    let profileFetchCompleted = false;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("[AUTH] Auth state changed:", event);
      
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      if (newSession?.user) {
        if (newSession.user.email) {
          localStorage.setItem('userEmail', newSession.user.email);
        }
        
        if (!profileFetchCompleted) {
          profileFetchCompleted = true;
          
          // Use setTimeout to avoid potential auth deadlocks
          setTimeout(async () => {
            try {
              const userProfile = await fetchAndSetProfile(newSession.user.id);
              
              if (userProfile) {
                // Use another setTimeout to ensure we don't cause a deadlock
                setTimeout(() => {
                  handleUserAuthenticated(newSession.user.id)
                    .catch(err => console.error(`[AUTH] Error in handleUserAuthenticated:`, err));
                }, 0);
              }
            } catch (profileError) {
              console.error(`[AUTH] Error fetching profile:`, profileError);
            } finally {
              profileFetchCompleted = false;
            }
          }, 0);
        }
      } else {
        setIsPremium(false);
        setProfile(null);
        clearPremiumFromLocalStorage();
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

        try {
          const { data, error } = await supabase.auth.getSession();
          
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
            
            if (!profileFetchCompleted) {
              profileFetchCompleted = true;
              
              try {
                const userProfile = await fetchAndSetProfile(currentSession.user.id);
                
                if (userProfile) {
                  // Use setTimeout to prevent auth deadlocks
                  setTimeout(async () => {
                    try {
                      await handleUserAuthenticated(currentSession.user.id);
                    } catch (err) {
                      console.error(`[AUTH] Error in handleUserAuthenticated:`, err);
                    } finally {
                      profileFetchCompleted = false;
                    }
                  }, 0);
                }
              } catch (profileError) {
                console.error(`[AUTH] Error fetching profile during init:`, profileError);
                profileFetchCompleted = false;
              }
            }
          } else {
            console.log('[AUTH] No active session found');
            setSession(null);
            setUser(null);
            clearPremiumFromLocalStorage();
          }
        } catch (sessionError) {
          console.error('[AUTH] Error getting session:', sessionError);
          
          setSession(null);
          setUser(null);
          clearPremiumFromLocalStorage();
        }
      } catch (error) {
        console.error('[AUTH] Error initializing auth:', error);
      } finally {
        setAuthInitialized(true);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      console.log("[AUTH] Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [testUser, testSession, testIsPremium, testProfile, handleUserAuthenticated, setIsPremium, setUser, setSession, fetchAndSetProfile]);

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
