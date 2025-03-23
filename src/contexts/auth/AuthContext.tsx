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
} from './auth-utils'
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      console.log("Auth state changed", _event, !!newSession)
      
      // Only update if we're not using a test user
      if (!testUser) {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        
        if (newSession?.user) {
          handleUserAuthenticated(newSession.user.id)
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
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      
      if (currentSession?.user) {
        await handleUserAuthenticated(currentSession.user.id)
      }
      
      setLoading(false)
    }

    initializeAuth()

    return () => {
      subscription.unsubscribe()
    }
  }, [testUser, testSession, testIsPremium, testProfile])

  const handleUserAuthenticated = async (userId: string) => {
    const userProfile = await fetchProfile(userId)
    setProfile(userProfile)
    
    const isPremiumStatus = await checkPremiumStatus(userId)
    setIsPremium(isPremiumStatus)
  }

  const checkUserPremiumStatus = async (userId: string) => {
    const isPremiumStatus = await checkPremiumStatus(userId)
    setIsPremium(isPremiumStatus)
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
