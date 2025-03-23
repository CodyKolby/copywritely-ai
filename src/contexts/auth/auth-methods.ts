
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'

export const signInWithGoogle = async () => {
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

export const signInWithEmail = async (email: string, password: string) => {
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

export const signUpWithEmail = async (email: string, password: string) => {
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

export const signOut = async () => {
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
