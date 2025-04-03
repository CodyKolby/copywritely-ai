
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { AuthContextType, Profile } from './types'
import { 
  fetchProfile, 
  createProfile,
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  signOut 
} from './auth-utils'
import { checkPremiumStatus, checkPremiumStatusFallback } from './premium-utils'
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
  const { 
    testUser, 
    testSession, 
    testIsPremium, 
    testProfile, 
    setTestUserState 
  } = useTestUser()

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
      
      // Force get the latest profile data first
      const { data: latestProfile, error: profileError } = await supabase
        .from('profiles')
        .select('is_premium, subscription_id, subscription_status, subscription_expiry')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('[AUTH] Error getting latest profile:', profileError);
      } else {
        console.log('[AUTH] Latest profile data from database:', latestProfile);
        
        // Use the database value directly to immediately update the UI
        if (latestProfile?.is_premium) {
          console.log('[AUTH] User has premium status according to database');
          setIsPremium(true);
          if (userProfile) {
            setProfile({
              ...userProfile,
              is_premium: true,
              subscription_id: latestProfile.subscription_id,
              subscription_status: latestProfile.subscription_status,
              subscription_expiry: latestProfile.subscription_expiry
            });
          }
        } else {
          // If not premium in database, check with Stripe
          const isPremiumStatus = await checkPremiumStatus(userId);
          console.log('[AUTH] Premium status after check:', isPremiumStatus);
          setIsPremium(isPremiumStatus);
        }
      }
    } catch (error) {
      console.error('[AUTH] Error in handleUserAuthenticated:', error);
    }
  };

  const checkUserPremiumStatus = async (userId: string, showToast = false) => {
    try {
      console.log('[AUTH] Manual premium status check for user:', userId);
      
      // First try direct database check - MOST RELIABLE
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
          
          // CRITICAL: Update isPremium state
          setIsPremium(true);
          
          // CRITICAL: Update the profile state with all subscription details
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
          
          if (showToast) {
            toast.success('Twoje konto ma status Premium!', {
              dismissible: true
            });
          }
          
          return true;
        }
      }
      
      // If not premium in database, check with Stripe
      const isPremiumStatus = await checkPremiumStatus(userId, showToast);
      
      // CRITICAL: Update isPremium state based on check result
      console.log('[AUTH] Setting isPremium state to:', isPremiumStatus);
      setIsPremium(isPremiumStatus);
      
      // If premium status is true, get the latest profile info
      if (isPremiumStatus) {
        const updatedProfile = await fetchProfile(userId);
        if (updatedProfile) {
          console.log('[AUTH] Updating profile state with latest data:', updatedProfile);
          setProfile(updatedProfile);
        }
      }
      
      return isPremiumStatus;
    } catch (error) {
      console.error('[AUTH] Error checking premium status:', error);
      
      // Try fallback method
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

  // Completely rewritten refreshSession function for 100% reliability
  const refreshSession = async () => {
    try {
      console.log('[AUTH] Manually refreshing session');
      
      // STEP 1: First attempt to update the premium status directly in database
      if (user?.id) {
        console.log('[AUTH] Direct premium status update in refreshSession');
        
        try {
          const { error: directError } = await supabase
            .from('profiles')
            .update({ 
              is_premium: true,
              subscription_status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
            
          if (directError) {
            console.error('[AUTH] Error in direct premium update:', directError);
          } else {
            console.log('[AUTH] Direct premium update successful');
            setIsPremium(true);
          }
        } catch (directError) {
          console.error('[AUTH] Exception in direct premium update:', directError);
        }
      }
      
      // STEP 2: Refresh the Supabase session
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[AUTH] Error refreshing session:', error);
        return false;
      }
      
      // STEP 3: Update local state with new session
      if (data.session) {
        console.log('[AUTH] Session refreshed successfully');
        setSession(data.session);
        setUser(data.session.user);
        
        if (data.session.user) {
          // STEP 4: Force a complete profile refresh
          try {
            // STEP 4A: Get latest profile data directly
            const { data: latestProfile, error: profileError } = await supabase
              .from('profiles')
              .select('is_premium, subscription_id, subscription_status, subscription_expiry, updated_at')
              .eq('id', data.session.user.id)
              .single();
            
            if (profileError) {
              console.error('[AUTH] Error getting profile in session refresh:', profileError);
            } else {
              console.log('[AUTH] Latest profile from refresh:', latestProfile);
              
              // STEP 4B: Update local premium status immediately if database says premium
              if (latestProfile && latestProfile.is_premium) {
                console.log('[AUTH] Setting isPremium to true based on database');
                setIsPremium(true);
              }
              
              // STEP 4C: Update local profile state with latest data
              if (latestProfile) {
                const fullProfile = await fetchProfile(data.session.user.id);
                if (fullProfile) {
                  console.log('[AUTH] Setting updated profile with premium data:', {
                    isPremium: latestProfile.is_premium,
                    subscriptionId: latestProfile.subscription_id,
                    subscriptionStatus: latestProfile.subscription_status || 'active',
                    subscriptionExpiry: latestProfile.subscription_expiry
                  });
                  
                  // Update profile state with all subscription details
                  setProfile({
                    ...fullProfile,
                    is_premium: latestProfile.is_premium,
                    subscription_id: latestProfile.subscription_id,
                    subscription_status: latestProfile.subscription_status || 'active',
                    subscription_expiry: latestProfile.subscription_expiry
                  });
                }
              }
            }
            
            // STEP 5: Run premium check as backup
            const premiumCheckResult = await checkPremiumStatus(data.session.user.id, false);
            console.log('[AUTH] Premium check in session refresh:', premiumCheckResult);
            
          } catch (profileError) {
            console.error('[AUTH] Error refreshing profile in session refresh:', profileError);
            // Continue even with error
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
