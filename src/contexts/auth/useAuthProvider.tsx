
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
  updatePremiumStatus 
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
  // State
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [premiumChecked, setPremiumChecked] = useState(false);
  
  // Test user state
  const { 
    testUser, 
    testSession, 
    testIsPremium, 
    testProfile, 
    setTestUserState 
  } = useTestUser();

  // Only check localStorage once on initial mount to prevent flicker
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

  // Process authenticated user - fetch profile, check premium status
  const handleUserAuthenticated = useCallback(async (userId: string) => {
    try {
      console.log('[AUTH] Handling authenticated user:', userId);
      
      // First, attempt to fetch the user profile
      const userProfile = await fetchProfile(userId);
      console.log('[AUTH] User profile after fetch:', userProfile);
      setProfile(userProfile);
      
      // Create a profile if none exists
      if (!userProfile) {
        console.warn('[AUTH] No profile found or created for user:', userId);
        const retryProfile = await createProfile(userId);
        if (retryProfile) {
          console.log('[AUTH] Successfully created profile on retry:', retryProfile);
          setProfile(retryProfile);
        }
      }
      
      // CRITICAL: Always check premium status with server first
      const serverPremiumStatus = await checkPremiumStatus(userId);
      console.log('[AUTH] Server premium status:', serverPremiumStatus);
      
      if (serverPremiumStatus) {
        console.log('[AUTH] Setting premium status from server verification');
        setIsPremium(true);
        updateAllPremiumStorages(true); // Update localStorage as backup only
        return;
      }
      
      // If server check shows not premium, fallback to direct database check
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
          updateAllPremiumStorages(true); // Update localStorage as backup only
          return;
        } else {
          console.log('[AUTH] User does not have premium status according to database');
          setIsPremium(false);
          updateAllPremiumStorages(false);
        }
      }
    } catch (error) {
      console.error('[AUTH] Error in handleUserAuthenticated:', error);
      
      // Last resort: check localStorage if server checks fail
      const localPremium = checkAllPremiumStorages();
      if (localPremium) {
        console.log('[AUTH] Using backup premium status from localStorage after server error');
        setIsPremium(true);
        
        // Try to update the database based on localStorage backup
        try {
          await updatePremiumStatus(userId, true);
        } catch (e) {
          console.error('[AUTH] Error updating database from localStorage backup:', e);
        }
      }
    }
  }, []);

  // Function to manually check premium status
  const checkUserPremiumStatus = useCallback(async (userId: string, showToast = false) => {
    try {
      console.log('[AUTH] Manual premium status check for user:', userId);
      
      // CRITICAL: Always prioritize server check first
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
      
      // If server check fails, try direct database check
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
      
      // Additional fallback checks are in a separate function now
      return fallbackPremiumChecks(userId, showToast, setIsPremium);
    } catch (error) {
      console.error('[AUTH] Error checking premium status:', error);
      
      // Last attempt with fallback method
      const fallbackResult = await checkPremiumStatusFallback(userId, false);
      setIsPremium(fallbackResult);
      
      if (fallbackResult) {
        updateAllPremiumStorages(true);
      }
      
      return fallbackResult;
    }
  }, []);

  // Function to refresh session data and premium status
  const refreshSession = useCallback(async () => {
    try {
      console.log('[AUTH] Manually refreshing session');
      
      if (user?.id) {
        // First priority: server check for premium status
        const serverPremiumStatus = await checkPremiumStatus(user.id, false);
        
        if (serverPremiumStatus) {
          console.log('[AUTH] Server confirmed premium status');
          setIsPremium(true);
          updateAllPremiumStorages(true);
        } else {
          await checkDatabasePremiumStatus(user.id, setIsPremium);
        }
      }
      
      // Refresh the Supabase session
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
          // Recheck profile and premium status
          await handleUserAuthenticated(data.session.user.id);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[AUTH] Exception refreshing session:', error);
      return false;
    }
  }, [user, handleUserAuthenticated]);

  // Set up auth state change listener and initialize
  useEffect(() => {
    console.log("[AUTH] Setting up auth state listener");
    
    // Set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("[AUTH] Auth state changed", event, !!newSession?.user);
      
      if (!testUser) {
        // Update basic session state immediately
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          if (newSession.user.email) {
            localStorage.setItem('userEmail', newSession.user.email);
          }
          
          // Process the authenticated user (fetch profile, check premium, etc)
          setTimeout(() => {
            handleUserAuthenticated(newSession.user.id);
          }, 0);
        } else {
          // User logged out
          setIsPremium(false);
          setProfile(null);
          clearPremiumFromLocalStorage();
        }
      }
    });

    // Check for existing session
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

        // Check if user is already logged in
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AUTH] Error getting session:', error);
        }
        
        if (currentSession?.user) {
          console.log('[AUTH] Found existing session, user ID:', currentSession.user.id);
          
          if (currentSession.user.email) {
            localStorage.setItem('userEmail', currentSession.user.email);
          }
          
          // Update basic session state
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Process the authenticated user (fetch profile, check premium, etc)
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

  // Clean up on unmount
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
      // Clear localStorage premium backup on logout
      clearPremiumFromLocalStorage();
      return signOut();
    },
    checkPremiumStatus: checkUserPremiumStatus,
    refreshSession,
    setTestUserState
  };
};

// Helper functions to reduce complexity

async function fallbackPremiumChecks(
  userId: string, 
  showToast: boolean, 
  setIsPremium: (isPremium: boolean) => void
): Promise<boolean> {
  try {
    // Check payment logs as final resort
    const { data: paymentLogs, error: logsError } = await supabase
      .from('payment_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(1);
      
    if (!logsError && paymentLogs && paymentLogs.length > 0) {
      console.log('[AUTH] Found payment logs, setting premium status');
      
      // Update database
      await updatePremiumStatus(userId, true);
        
      setIsPremium(true);
      
      // Update storage as backup only
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
  
  // Last resort: check localStorage
  const localPremium = checkAllPremiumStorages();
  if (localPremium) {
    console.log('[AUTH] Using backup premium status from localStorage for UI');
    setIsPremium(true);
    
    // Try to update database from localStorage
    try {
      await updatePremiumStatus(userId, true);
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
  
  // All checks failed - user does not have premium
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
    // Check database directly
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
      // Not premium in database, check payment logs
      try {
        const { data: paymentLogs } = await supabase
          .from('payment_logs')
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false })
          .limit(1);
            
        if (paymentLogs && paymentLogs.length > 0) {
          console.log('[AUTH] Found payment logs, updating premium status');
          await updatePremiumStatus(userId, true);
          setIsPremium(true);
          updateAllPremiumStorages(true);
          return true;
        } else {
          // No premium indicators found
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
