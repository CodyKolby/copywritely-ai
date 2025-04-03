
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { AuthContextType, Profile } from './types'
import { 
  fetchProfile, 
  createProfile,
  updatePremiumStatus
} from './profile-utils'
import {
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  signOut
} from './auth-methods'
import { 
  checkPremiumStatus, 
  checkPremiumStatusFallback 
} from './premium-utils'
import { 
  validateLocalStoragePremium, 
  storePremiumInLocalStorage 
} from './local-storage-utils'
import { useTestUser } from './use-test-user'
import { toast } from 'sonner'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [authInitialized, setAuthInitialized] = useState(false)
  const [localStoragePremiumChecked, setLocalStoragePremiumChecked] = useState(false)
  const { 
    testUser, 
    testSession, 
    testIsPremium, 
    testProfile, 
    setTestUserState 
  } = useTestUser()

  // When auth loads, check localStorage for premium status as a first check
  useEffect(() => {
    if (!localStoragePremiumChecked) {
      const localPremium = validateLocalStoragePremium();
      if (localPremium) {
        setIsPremium(true);
      }
      setLocalStoragePremiumChecked(true);
    }
  }, [localStoragePremiumChecked]);

  useEffect(() => {
    console.log("[AUTH] Setting up auth state listener");
    
    const handleAuthStateChange = async (event: string, newSession: Session | null) => {
      console.log("[AUTH] Auth state changed", event, !!newSession?.user);
      
      if (!testUser) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          if (newSession.user.email) {
            localStorage.setItem('userEmail', newSession.user.email);
          }
          
          await handleUserAuthenticated(newSession.user.id);
        } else {
          setIsPremium(false);
          setProfile(null);
        }
      }
    };
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

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
          console.log('[AUTH] User metadata:', currentSession.user.user_metadata);
          
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
  }, [testUser, testSession, testIsPremium, testProfile]);

  const handleUserAuthenticated = async (userId: string) => {
    try {
      console.log('[AUTH] Handling authenticated user:', userId);
      
      // Reset premium state until verified from database
      setIsPremium(false);
      
      // Fetch user profile
      const userProfile = await fetchProfile(userId);
      console.log('[AUTH] User profile after fetch:', userProfile);
      setProfile(userProfile);
      
      if (!userProfile) {
        console.warn('[AUTH] No profile found or created for user:', userId);
        const retryProfile = await createProfile(userId);
        if (retryProfile) {
          console.log('[AUTH] Successfully created profile on retry:', retryProfile);
          setProfile(retryProfile);
        }
      }
      
      // FIRST SOURCE OF TRUTH: Check database directly for premium status
      const { data: latestProfile, error: profileError } = await supabase
        .from('profiles')
        .select('is_premium, subscription_id, subscription_status, subscription_expiry')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('[AUTH] Error getting latest profile:', profileError);
      } else {
        console.log('[AUTH] Latest profile data from database:', latestProfile);
        
        // Update profile state with latest data
        if (userProfile && latestProfile) {
          setProfile({
            ...userProfile,
            is_premium: latestProfile.is_premium,
            subscription_id: latestProfile.subscription_id,
            subscription_status: latestProfile.subscription_status,
            subscription_expiry: latestProfile.subscription_expiry
          });
        }
        
        // Only set premium if database explicitly says so
        if (latestProfile?.is_premium) {
          console.log('[AUTH] User has premium status according to database');
          setIsPremium(true);
          
          // Update localStorage backup
          storePremiumInLocalStorage(true);
          
          return; // Early return as we have confirmed premium status
        }
      }
      
      // SECOND SOURCE OF TRUTH: Check for payment logs as proof of purchase
      try {
        console.log('[AUTH] Checking payment logs for premium confirmation');
        const { data: paymentLogs, error: logsError } = await supabase
          .from('payment_logs')
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false })
          .limit(1);
          
        if (!logsError && paymentLogs && paymentLogs.length > 0) {
          console.log('[AUTH] Found payment logs, assuming premium status');
          
          // Update profile in database to ensure consistency
          await updatePremiumStatus(userId, true);
          
          // Update local state
          setIsPremium(true);
          
          // Update localStorage backup
          storePremiumInLocalStorage(true);
          
          return; // Early return as we have confirmed premium status
        }
      } catch (logsError) {
        console.error('[AUTH] Error checking payment logs:', logsError);
      }
      
      // THIRD SOURCE OF TRUTH: Check localStorage backup if it exists
      const localPremium = validateLocalStoragePremium();
      if (localPremium) {
        console.log('[AUTH] Setting premium status from validated localStorage backup');
        
        // Also update database to ensure consistency
        try {
          await updatePremiumStatus(userId, true);
          
          setIsPremium(true);
          return;
        } catch (e) {
          console.error('[AUTH] Error updating database from localStorage backup:', e);
        }
      }
      
      // FINAL CHECK: Use the edge function as a last resort
      const isPremiumStatus = await checkPremiumStatus(userId);
      console.log('[AUTH] Premium status after final edge function check:', isPremiumStatus);
      setIsPremium(isPremiumStatus);
      
      // If premium was found, update localStorage backup
      if (isPremiumStatus) {
        storePremiumInLocalStorage(true);
      }
    } catch (error) {
      console.error('[AUTH] Error in handleUserAuthenticated:', error);
    }
  };

  const checkUserPremiumStatus = async (userId: string, showToast = false) => {
    try {
      console.log('[AUTH] Manual premium status check for user:', userId);
      
      // Check database directly first
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
          
          // Update localStorage backup
          storePremiumInLocalStorage(true);
          
          if (showToast) {
            toast.success('Twoje konto ma status Premium!', {
              dismissible: true
            });
          }
          
          return true;
        }
      }
      
      // Check for payment logs as evidence
      try {
        const { data: paymentLogs, error: logsError } = await supabase
          .from('payment_logs')
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false })
          .limit(1);
          
        if (!logsError && paymentLogs && paymentLogs.length > 0) {
          console.log('[AUTH] Found payment logs, setting premium status');
          
          // Update profile to ensure consistency
          await updatePremiumStatus(userId, true);
            
          setIsPremium(true);
          
          // Update localStorage backup
          storePremiumInLocalStorage(true);
          
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
      
      // Check localStorage backup
      const localPremium = validateLocalStoragePremium();
      if (localPremium) {
        console.log('[AUTH] Using validated localStorage premium backup');
        
        // Update database for consistency
        try {
          await updatePremiumStatus(userId, true);
            
          setIsPremium(true);
          
          if (showToast) {
            toast.success('Twoje konto ma status Premium!', {
              dismissible: true
            });
          }
          
          return true;
        } catch (e) {
          console.error('[AUTH] Error updating database from localStorage backup:', e);
        }
      }
      
      // Fall back to edge function check
      const isPremiumStatus = await checkPremiumStatus(userId, showToast);
      
      console.log('[AUTH] Setting isPremium state to:', isPremiumStatus);
      setIsPremium(isPremiumStatus);
      
      if (isPremiumStatus) {
        const updatedProfile = await fetchProfile(userId);
        if (updatedProfile) {
          console.log('[AUTH] Updating profile state with latest data:', updatedProfile);
          setProfile(updatedProfile);
        }
        
        // Update localStorage backup
        storePremiumInLocalStorage(true);
      } else {
        // If all checks failed, ensure localStorage backup is cleared
        storePremiumInLocalStorage(false);
      }
      
      return isPremiumStatus;
    } catch (error) {
      console.error('[AUTH] Error checking premium status:', error);
      
      try {
        const fallbackResult = await checkPremiumStatusFallback(userId, false);
        console.log('[AUTH] Fallback premium check result:', fallbackResult);
        setIsPremium(fallbackResult);
        return fallbackResult;
      } catch (fallbackError) {
        console.error('[AUTH] Fallback premium check also failed:', fallbackError);
        return false;
      }
    }
  };

  const refreshSession = async () => {
    try {
      console.log('[AUTH] Manually refreshing session');
      
      if (user?.id) {
        console.log('[AUTH] Checking current premium status before refresh');
        
        // Check current database state
        const { data: currentProfile, error: currentProfileError } = await supabase
          .from('profiles')
          .select('is_premium, subscription_id, subscription_status, subscription_expiry')
          .eq('id', user.id)
          .single();
          
        if (currentProfileError) {
          console.error('[AUTH] Error checking current profile:', currentProfileError);
        } else if (currentProfile?.is_premium) {
          console.log('[AUTH] User already has premium status in database, no need to update');
          setIsPremium(true);
        } else {
          // Check payment logs for evidence of premium purchase
          try {
            const { data: paymentLogs } = await supabase
              .from('payment_logs')
              .select('*')
              .eq('user_id', user.id)
              .order('timestamp', { ascending: false })
              .limit(1);
              
            if (paymentLogs && paymentLogs.length > 0) {
              console.log('[AUTH] Found payment logs, updating premium status');
              
              try {
                await updatePremiumStatus(user.id, true);
                  
                setIsPremium(true);
              } catch (updateErr) {
                console.error('[AUTH] Error updating premium from logs:', updateErr);
              }
            }
          } catch (logsErr) {
            console.error('[AUTH] Error checking payment logs:', logsErr);
          }
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
          try {
            await handleUserAuthenticated(data.session.user.id);
          } catch (e) {
            console.error('[AUTH] Error in handleUserAuthenticated after refresh:', e);
          }
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[AUTH] Exception refreshing session:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user: testUser || user, 
      session: testSession || session, 
      loading, 
      isPremium: testIsPremium || isPremium,
      profile: testProfile || profile,
      authInitialized,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      checkPremiumStatus: checkUserPremiumStatus,
      refreshSession,
      setTestUserState
    }}>
      {children}
    </AuthContext.Provider>
  );
}
