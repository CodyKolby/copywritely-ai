
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { AuthContextType, Profile } from './types'
import { 
  fetchProfile, 
  createProfile,
  checkPremiumStatus, 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  signOut 
} from './auth-utils'
import { useTestUser } from './use-test-user'

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
    console.log("Setting up auth state listener");
    
    const handleAuthStateChange = async (event: string, newSession: Session | null) => {
      console.log("Auth state changed", event, !!newSession?.user);
      
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
        console.log('Initializing auth state');
        
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
          console.error('Error getting session:', error);
        }
        
        if (currentSession?.user) {
          console.log('Found existing session, user ID:', currentSession.user.id);
          console.log('User metadata:', currentSession.user.user_metadata);
          
          if (currentSession.user.email) {
            localStorage.setItem('userEmail', currentSession.user.email);
          }
          
          setSession(currentSession);
          setUser(currentSession.user);
          
          await handleUserAuthenticated(currentSession.user.id);
        } else {
          console.log('No active session found');
          setSession(null);
          setUser(null);
        }
        
        setAuthInitialized(true);
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthInitialized(true);
      }
      
      setLoading(false);
    };

    initializeAuth();

    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [testUser, testSession, testIsPremium, testProfile]);

  const handleUserAuthenticated = async (userId: string) => {
    try {
      console.log('Handling authenticated user:', userId);
      const userProfile = await fetchProfile(userId);
      console.log('User profile after fetch:', userProfile);
      setProfile(userProfile);
      
      if (!userProfile) {
        console.warn('No profile found or created for user:', userId);
        const retryProfile = await createProfile(userId);
        if (retryProfile) {
          console.log('Successfully created profile on retry:', retryProfile);
          setProfile(retryProfile);
        }
      }
      
      // Force get the latest profile data first
      const { data: latestProfile } = await supabase
        .from('profiles')
        .select('is_premium, subscription_id, subscription_status, subscription_expiry')
        .eq('id', userId)
        .single();
        
      console.log('Latest profile data from database:', latestProfile);
      
      // Use the database value directly to immediately update the UI
      if (latestProfile?.is_premium) {
        console.log('User has premium status according to database');
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
        console.log('Premium status after check:', isPremiumStatus);
        setIsPremium(isPremiumStatus);
      }
    } catch (error) {
      console.error('Error in handleUserAuthenticated:', error);
    }
  };

  const checkUserPremiumStatus = async (userId: string, showToast = false) => {
    try {
      console.log('Manual premium status check for user:', userId);
      
      // First try direct database check
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium, subscription_id, subscription_status, subscription_expiry')
        .eq('id', userId)
        .single();
        
      console.log('Profile data from direct check:', profile);
      
      if (profile?.is_premium) {
        console.log('User has premium status according to database');
        setIsPremium(true);
        
        // Update the profile state
        setProfile(prevProfile => {
          if (!prevProfile) return null;
          return {
            ...prevProfile,
            is_premium: true,
            subscription_id: profile.subscription_id,
            subscription_status: profile.subscription_status,
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
      
      // If not premium in database, check with Stripe
      const isPremiumStatus = await checkPremiumStatus(userId, showToast);
      setIsPremium(isPremiumStatus);
      
      // If premium status is true, get the latest profile info
      if (isPremiumStatus) {
        const updatedProfile = await fetchProfile(userId);
        if (updatedProfile) {
          setProfile(updatedProfile);
        }
      }
      
      return isPremiumStatus;
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  };

  const refreshSession = async () => {
    try {
      console.log('Manually refreshing session');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        return false;
      }
      
      if (data.session) {
        console.log('Session refreshed successfully');
        setSession(data.session);
        setUser(data.session.user);
        
        if (data.session.user) {
          await handleUserAuthenticated(data.session.user.id);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Exception refreshing session:', error);
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
