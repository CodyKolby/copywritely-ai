
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from './types';
import { fetchProfile } from './profile-utils';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, signOut } from './auth-methods';
import { clearPremiumFromLocalStorage } from './local-storage-utils';
import { useTestUser } from './use-test-user';
import { usePremiumVerification } from './hooks/usePremiumVerification';
import { useSessionManagement } from './hooks/useSessionManagement';

export const useAuthProvider = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  
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

  // Function to fetch and set user profile
  const fetchAndSetProfile = async (userId: string) => {
    try {
      console.log('[AUTH] Fetching profile for user:', userId);
      const userProfile = await fetchProfile(userId);
      
      if (userProfile) {
        console.log('[AUTH] Profile fetched successfully:', userProfile);
        setProfile(userProfile);
        return userProfile;
      } else {
        console.warn('[AUTH] No profile found for user:', userId);
        
        // Try direct edge function call as a last resort
        try {
          console.log('[AUTH] Attempting profile creation with edge function directly');
          
          const response = await fetch('https://jorbqjareswzdrsmepbv.functions.supabase.co/create-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.profile) {
              console.log('[AUTH] Profile created via edge function:', result.profile);
              setProfile(result.profile);
              return result.profile;
            }
          } else {
            console.error('[AUTH] Edge function call failed:', await response.text());
          }
        } catch (edgeFnError) {
          console.error('[AUTH] Error calling create-profile edge function directly:', edgeFnError);
        }
      }
    } catch (profileError) {
      console.error('[AUTH] Error fetching profile:', profileError);
    }
    return null;
  };

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
          
          await handleUserAuthenticated(currentSession.user.id);
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
  }, [testUser, testSession, testIsPremium, testProfile, handleUserAuthenticated, setIsPremium, setUser, setSession]);

  return {
    user: testUser || user, 
    session: testSession || session, 
    loading, 
    isPremium: testIsPremium || isPremium,
    profile: testProfile || profile,
    authInitialized,
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
