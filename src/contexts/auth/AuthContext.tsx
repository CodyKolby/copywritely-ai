import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { AuthContextType, Profile } from './types'
import { 
  fetchProfile, 
  checkPremiumStatus, 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  signOut 
} from './auth-utils'  // This import still works because of the re-exports
import { useTestUser } from './use-test-user'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const { 
    testUser, 
    testSession, 
    testIsPremium, 
    testProfile, 
    setTestUserState 
  } = useTestUser()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      console.log("Auth state changed", _event, !!newSession)
      
      // Only update if we're not using a test user
      if (!testUser) {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        
        if (newSession?.user) {
          await handleUserAuthenticated(newSession.user.id)
        } else {
          setIsPremium(false)
          setProfile(null)
        }
      }
    })

    const initializeAuth = async () => {
      // If we have a test user active, use that
      if (testUser) {
        setUser(testUser)
        setSession(testSession)
        setIsPremium(testIsPremium)
        setProfile(testProfile)
        setLoading(false)
        return
      }

      // Otherwise check for a real session
      try {
        console.log('Initializing auth state');
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        
        if (currentSession?.user) {
          console.log('Found existing session, user ID:', currentSession.user.id);
          console.log('User metadata:', currentSession.user.user_metadata);
          await handleUserAuthenticated(currentSession.user.id)
        } else {
          console.log('No active session found');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
      
      setLoading(false)
    }

    initializeAuth()

    return () => {
      subscription.unsubscribe()
    }
  }, [testUser, testSession, testIsPremium, testProfile])

  const handleUserAuthenticated = async (userId: string) => {
    try {
      console.log('Handling authenticated user:', userId);
      const userProfile = await fetchProfile(userId)
      console.log('User profile after fetch:', userProfile);
      setProfile(userProfile)
      
      if (!userProfile) {
        console.warn('No profile found or created for user:', userId);
        // Try to create profile one more time
        const retryProfile = await createProfile(userId);
        if (retryProfile) {
          console.log('Successfully created profile on retry:', retryProfile);
          setProfile(retryProfile);
        }
      }
      
      // Don't show any toast here - we'll handle that in the Success page
      const isPremiumStatus = await checkPremiumStatus(userId)
      setIsPremium(isPremiumStatus)
    } catch (error) {
      console.error('Error in handleUserAuthenticated:', error);
    }
  }

  const checkUserPremiumStatus = async (userId: string, showToast = false) => {
    try {
      console.log('Manual premium status check for user:', userId);
      const isPremiumStatus = await checkPremiumStatus(userId, showToast)
      setIsPremium(isPremiumStatus)
      return isPremiumStatus;
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user: testUser || user, 
      session: testSession || session, 
      loading, 
      isPremium: testIsPremium || isPremium,
      profile: testProfile || profile,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      checkPremiumStatus: checkUserPremiumStatus,
      setTestUserState
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
