
import { useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from './types';
import { 
  fetchProfile, 
  createProfile,
} from './profile-utils';
import {
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  signOut
} from './auth-methods';
import { 
  checkPremiumStatus, 
  checkPremiumStatusFallback 
} from './premium-verification';
import { 
  updateProfilePremiumStatus 
} from './premium-database';
import { 
  validateLocalStoragePremium, 
  updateAllPremiumStorages,
  checkAllPremiumStorages,
  clearPremiumFromLocalStorage
} from './local-storage-utils';
import { useTestUser } from './use-test-user';
import { toast } from 'sonner';

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [premiumChecked, setPremiumChecked] = useState(false);
  
  const { 
    testUser, 
    testSession, 
    testIsPremium, 
    testProfile, 
    setTestUserState 
  } = useTestUser();

  useEffect(() => {
    if (!premiumChecked) {
      const localPremium = validateLocalStoragePremium();
      if (localPremium) {
        console.log('[AUTH] Using localStorage premium backup for initial state only');
        setIsPremium(true);
      }
      setPremiumChecked(true);
    }
  }, [premiumChecked]);

  const handleUserAuthenticated = useCallback(async (userId: string) => {
    try {
      console.log('[AUTH] Handling authenticated user:', userId);
      
      const userProfile = await fetchProfile(userId);
      console.log('[AUTH] User profile after fetch:', userProfile);
      setProfile(userProfile);
      
      if (!userProfile) {
        console.warn('[AUTH] No profile found or created for user:', userId);
        
        const retryProfile = await createProfile(userId);
        if (retryProfile) {
          console.log('[AUTH] Successfully created profile on retry:', retryProfile);
          setProfile(retryProfile);
        } else {
          console.log('[AUTH] Attempting profile creation via edge function');
          try {
            // Fix: Get the current session token correctly
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;
            
            const response = await fetch(`https://jorbqjareswzdrsmepbv.supabase.co/functions/v1/create-profile`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
              },
              body: JSON.stringify({ userId })
            });
            
            if (response.ok) {
              const result = await response.json();
              if (result.profile) {
                console.log('[AUTH] Successfully created profile via edge function:', result.profile);
                setProfile(result.profile);
              }
            } else {
              console.error('[AUTH] Edge function returned error:', await response.text());
            }
          } catch (edgeFuncError) {
            console.error('[AUTH] Error calling profile edge function:', edgeFuncError);
          }
        }
      }
      
      const serverPremiumStatus = await checkPremiumStatus(userId);
      console.log('[AUTH] Server premium status:', serverPremiumStatus);
      
      if (serverPremiumStatus) {
        console.log('[AUTH] Setting premium status from server verification');
        setIsPremium(true);
        updateAllPremiumStorages(true);
        return;
      }
      
      const { data: latestProfile, error: profileError } = await supabase
        .from('profiles')
        .select('is_premium, subscription_id, subscription_status, subscription_expiry')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('[AUTH] Error getting latest profile:', profileError);
      } else {
        console.log('[AUTH] Latest profile data from database:', latestProfile);
        
        if (userProfile && latestProfile) {
          setProfile({
            ...userProfile,
            is_premium: latestProfile.is_premium,
            subscription_id: latestProfile.subscription_id,
            subscription_status: latestProfile.subscription_status,
            subscription_expiry: latestProfile.subscription_expiry
          });
        }
        
        if (latestProfile?.is_premium) {
          console.log('[AUTH] User has premium status according to database');
          setIsPremium(true);
          updateAllPremiumStorages(true);
          return;
        } else {
          console.log('[AUTH] User does not have premium status according to database');
          setIsPremium(false);
          updateAllPremiumStorages(false);
        }
      }
    } catch (error) {
      console.error('[AUTH] Error in handleUserAuthenticated:', error);
      
      const localPremium = checkAllPremiumStorages();
      if (localPremium) {
        console.log('[AUTH] Using backup premium status from localStorage after server error');
        setIsPremium(true);
        
        try {
          await updateProfilePremiumStatus(userId, true);
        } catch (e) {
          console.error('[AUTH] Error updating database from localStorage backup:', e);
        }
      }
    }
  }, []);

  const checkUserPremiumStatus = useCallback(async (userId: string, showToast = false) => {
    try {
      console.log('[AUTH] Manual premium status check for user:', userId);
      
      const serverPremiumStatus = await checkPremiumStatus(userId, false);
      console.log('[AUTH] Server premium status check result:', serverPremiumStatus);
      
      if (serverPremiumStatus) {
        setIsPremium(true);
        updateAllPremiumStorages(true);
        
        if (showToast) {
          toast.success('Twoje konto ma status Premium!', {
            dismissible: true
          });
        }
        
        return true;
      }
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_premium, subscription_id, subscription_status, subscription_expiry')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('[AUTH] Error in direct profile check:', profileError);
      } else {
        console.log('[AUTH] Profile data from direct check:', profile);
        
        if (profile?.is_premium) {
          console.log('[AUTH] User has premium status according to database');
          
          setIsPremium(true);
          
          setProfile(prevProfile => {
            if (!prevProfile) return null;
            return {
              ...prevProfile,
              is_premium: true,
              subscription_id: profile.subscription_id,
              subscription_status: profile.subscription_status || 'active',
              subscription_expiry: profile.subscription_expiry
            };
          });
          
          updateAllPremiumStorages(true);
          
          if (showToast) {
            toast.success('Twoje konto ma status Premium!', {
              dismissible: true
            });
          }
          
          return true;
        }
      }
      
      return fallbackPremiumChecks(userId, showToast, setIsPremium);
    } catch (error) {
      console.error('[AUTH] Error checking premium status:', error);
      
      const fallbackResult = await checkPremiumStatusFallback(userId, false);
      setIsPremium(fallbackResult);
      
      if (fallbackResult) {
        updateAllPremiumStorages(true);
      }
      
      return fallbackResult;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      console.log('[AUTH] Manually refreshing session');
      
      if (user?.id) {
        const serverPremiumStatus = await checkPremiumStatus(user.id, false);
        
        if (serverPremiumStatus) {
          console.log('[AUTH] Server confirmed premium status');
          setIsPremium(true);
          updateAllPremiumStorages(true);
        } else {
          await checkDatabasePremiumStatus(user.id, setIsPremium);
        }
      }
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[AUTH] Error refreshing session:', error);
        return false;
      }
      
      if (data.session) {
        console.log('[AUTH] Session refreshed successfully');
        setSession(data.session);
        setUser(data.session.user);
        
        if (data.session.user) {
          setTimeout(() => {
            handleUserAuthenticated(data.session.user.id);
          }, 0);
        } else {
          setIsPremium(false);
          setProfile(null);
          clearPremiumFromLocalStorage();
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[AUTH] Exception refreshing session:', error);
      return false;
    }
  }, [user, handleUserAuthenticated]);

  useEffect(() => {
    console.log("[AUTH] Setting up auth state listener");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("[AUTH] Auth state changed", event, !!newSession?.user);
      
      if (!testUser) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          if (newSession.user.email) {
            localStorage.setItem('userEmail', newSession.user.email);
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
  }, [testUser, testSession, testIsPremium, testProfile, handleUserAuthenticated]);

  useEffect(() => {
    return () => {
      console.log('[AUTH] Cleaning up AuthProvider');
    };
  }, []);

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
    setTestUserState
  };
};

async function fallbackPremiumChecks(
  userId: string, 
  showToast: boolean, 
  setIsPremium: (isPremium: boolean) => void
): Promise<boolean> {
  try {
    const { data: paymentLogs, error: logsError } = await supabase
      .from('payment_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(1);
      
    if (!logsError && paymentLogs && paymentLogs.length > 0) {
      console.log('[AUTH] Found payment logs, setting premium status');
      
      await updateProfilePremiumStatus(userId, true);
        
      setIsPremium(true);
      
      updateAllPremiumStorages(true);
      
      if (showToast) {
        toast.success('Znaleziono płatność! Twoje konto ma status Premium!', {
          dismissible: true
        });
      }
      
      return true;
    }
  } catch (logsError) {
    console.error('[AUTH] Error checking payment logs:', logsError);
  }
  
  const localPremium = checkAllPremiumStorages();
  if (localPremium) {
    console.log('[AUTH] Using backup premium status from localStorage for UI');
    setIsPremium(true);
    
    try {
      await updateProfilePremiumStatus(userId, true);
    } catch (e) {
      console.error('[AUTH] Error updating database from localStorage backup:', e);
    }
    
    if (showToast) {
      toast.success('Twoje konto ma status Premium (z backup)!', {
        dismissible: true
      });
    }
    
    return true;
  }
  
  console.log('[AUTH] All premium checks failed - user is not premium');
  setIsPremium(false);
  updateAllPremiumStorages(false);
  
  if (showToast) {
    toast.info('Twoje konto nie ma statusu Premium.', {
      dismissible: true
    });
  }
  
  return false;
}

async function checkDatabasePremiumStatus(
  userId: string,
  setIsPremium: (isPremium: boolean) => void
): Promise<boolean> {
  try {
    const { data: currentProfile, error: currentProfileError } = await supabase
      .from('profiles')
      .select('is_premium, subscription_id, subscription_status, subscription_expiry')
      .eq('id', userId)
      .single();
        
    if (currentProfileError) {
      console.error('[AUTH] Error checking current profile:', currentProfileError);
    } else if (currentProfile?.is_premium) {
      console.log('[AUTH] User has premium status in database');
      setIsPremium(true);
      updateAllPremiumStorages(true);
      return true;
    } else {
      try {
        const { data: paymentLogs } = await supabase
          .from('payment_logs')
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false })
          .limit(1);
            
        if (paymentLogs && paymentLogs.length > 0) {
          console.log('[AUTH] Found payment logs, updating premium status');
          await updateProfilePremiumStatus(userId, true);
          setIsPremium(true);
          updateAllPremiumStorages(true);
          return true;
        } else {
          setIsPremium(false);
          updateAllPremiumStorages(false);
          return false;
        }
      } catch (logsErr) {
        console.error('[AUTH] Error checking payment logs:', logsErr);
      }
    }
  } catch (error) {
    console.error('[AUTH] Error checking database premium status:', error);
  }
  
  return false;
}
