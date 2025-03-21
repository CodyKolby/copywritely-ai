
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isPremium: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  // For testing auth states
  setTestUserState: (loggedIn: boolean, premium?: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Check premium status if user is logged in
      if (session?.user) {
        checkPremiumStatus(session.user.id)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Check premium status if user is logged in
      if (session?.user) {
        checkPremiumStatus(session.user.id)
      } else {
        setIsPremium(false) // Reset premium status when logged out
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])
  
  // Function to check premium status from Supabase
  const checkPremiumStatus = async (userId: string) => {
    try {
      // In a real app, this would query a subscriptions or users table
      // For now, we'll simulate this by checking if the user exists in the database
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .limit(1)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking premium status:', error)
        return
      }
      
      // For now, just check if user exists in profiles table
      // In a real implementation, you'd check a premium field or subscription status
      setIsPremium(!!data)
    } catch (error) {
      console.error('Error checking premium status:', error)
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`
        }
      })
      
      if (error) throw error
    } catch (error) {
      if (error instanceof Error) {
        toast.error('Error signing in with Google', {
          description: error.message
        })
      }
      console.error('Error signing in with Google:', error)
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      toast.success('Signed in successfully')
    } catch (error) {
      if (error instanceof Error) {
        toast.error('Error signing in', {
          description: error.message
        })
      }
      console.error('Error signing in with email:', error)
    }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      })
      
      if (error) throw error
      toast.success('Account created! Check your email for verification link.')
    } catch (error) {
      if (error instanceof Error) {
        toast.error('Error creating account', {
          description: error.message
        })
      }
      console.error('Error signing up with email:', error)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success('Signed out successfully')
    } catch (error) {
      if (error instanceof Error) {
        toast.error('Error signing out', {
          description: error.message
        })
      }
      console.error('Error signing out:', error)
    }
  }

  // Special function just for testing auth states locally
  const setTestUserState = (loggedIn: boolean, premium: boolean = false) => {
    if (loggedIn) {
      // Create a fake user and session for testing
      // Must match the User type from @supabase/supabase-js
      const testUser = {
        id: 'test-user-id',
        app_metadata: {},
        user_metadata: {
          avatar_url: '',
          full_name: 'Test User'
        },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: 'test@example.com',
        role: '',
        updated_at: new Date().toISOString()
      } as User;
      
      const testSession = {
        user: testUser,
        access_token: 'fake-token',
        refresh_token: 'fake-refresh-token',
        expires_at: Date.now() + 3600000, // 1 hour from now
      } as Session;
      
      setUser(testUser);
      setSession(testSession);
      setIsPremium(premium); // Set premium status based on parameter
      toast.success(`Test user logged in (${premium ? 'Premium' : 'Free'} account)`);
    } else {
      setUser(null);
      setSession(null);
      setIsPremium(false);
      toast.success('Test user logged out');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      isPremium,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
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
