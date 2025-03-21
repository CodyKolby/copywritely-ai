
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface Profile {
  id: string
  email?: string
  full_name?: string
  avatar_url?: string
  is_premium: boolean
  subscription_id?: string
  subscription_status?: string
  subscription_expiry?: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isPremium: boolean
  profile: Profile | null
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  checkPremiumStatus: (userId: string) => Promise<void>
  // For testing auth states
  setTestUserState: (loggedIn: boolean, premium?: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      if (session?.user) {
        fetchProfile(session.user.id)
        checkPremiumStatus(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      if (session?.user) {
        fetchProfile(session.user.id)
        checkPremiumStatus(session.user.id)
      } else {
        setIsPremium(false)
        setProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setProfile(data);
      setIsPremium(data?.is_premium || false);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  const checkPremiumStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription-status', {
        body: { userId }
      });
      
      if (error) {
        console.error('Error checking premium status:', error);
        return;
      }
      
      setIsPremium(data?.isPremium || false);
    } catch (error) {
      console.error('Error checking premium status:', error);
      
      // Fallback - sprawdzamy w tabeli profiles
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_premium')
          .eq('id', userId)
          .single();
        
        if (error) {
          console.error('Error checking premium status (fallback):', error);
          return;
        }
        
        setIsPremium(data?.is_premium || false);
      } catch (fallbackError) {
        console.error('Error in fallback premium status check:', fallbackError);
      }
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

  const setTestUserState = (loggedIn: boolean, premium: boolean = false) => {
    if (loggedIn) {
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
        expires_at: Date.now() + 3600000,
      } as Session;
      
      setUser(testUser);
      setSession(testSession);
      setIsPremium(premium);
      setProfile({
        id: testUser.id,
        email: testUser.email,
        full_name: 'Test User',
        is_premium: premium
      });
      toast.success(`Test user logged in (${premium ? 'Premium' : 'Free'} account)`);
    } else {
      setUser(null);
      setSession(null);
      setIsPremium(false);
      setProfile(null);
      toast.success('Test user logged out');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      isPremium,
      profile,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      checkPremiumStatus,
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
