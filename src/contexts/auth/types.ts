
import { Session, User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  email?: string
  full_name?: string
  avatar_url?: string
  is_premium: boolean
  subscription_id?: string
  subscription_status?: string
  subscription_expiry?: string
}

export interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isPremium: boolean
  profile: Profile | null
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  checkPremiumStatus: (userId: string, showToast?: boolean) => Promise<boolean>
  // For testing auth states
  setTestUserState: (loggedIn: boolean, premium?: boolean) => void
}
