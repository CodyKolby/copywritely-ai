
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
        description: error.message,
        dismissible: true
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
    toast.success('Signed in successfully', {
      dismissible: true
    })
  } catch (error) {
    if (error instanceof Error) {
      toast.error('Error signing in', {
        description: error.message,
        dismissible: true
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
    toast.success('Account created! Check your email for verification link.', {
      dismissible: true
    })
  } catch (error) {
    if (error instanceof Error) {
      toast.error('Error creating account', {
        description: error.message,
        dismissible: true
      })
    }
    console.error('Error signing up with email:', error)
  }
}

export const signOut = async () => {
  try {
    toast.loading('Wylogowywanie...', {
      dismissible: true
    });
    
    // Force clear local storage auth data immediately to ensure logout works
    const allKeys = Object.keys(localStorage);
    const supabaseAuthKeys = allKeys.filter(key => key.startsWith('sb-') && key.includes('-auth-token'));
    for (const key of supabaseAuthKeys) {
      localStorage.removeItem(key);
    }
    
    // Call the Supabase signOut method, but don't wait for it
    supabase.auth.signOut().catch(error => {
      console.error('Error in Supabase signOut:', error);
    });
    
    // Success message
    toast.success('Wylogowano pomyślnie', {
      dismissible: true
    });
    
    // Force reload the page immediately to ensure all auth state is reset
    setTimeout(() => window.location.reload(), 100);
  } catch (error) {
    console.error('Error signing out:', error);
    
    // Force clear local storage auth data as a fallback
    const allKeys = Object.keys(localStorage);
    const supabaseAuthKeys = allKeys.filter(key => key.startsWith('sb-') && key.includes('-auth-token'));
    for (const key of supabaseAuthKeys) {
      localStorage.removeItem(key);
    }
    
    // Show error message
    if (error instanceof Error) {
      toast.error('Błąd podczas wylogowywania', {
        description: error.message,
        dismissible: true
      })
    }
    
    // Force reload anyway
    setTimeout(() => window.location.reload(), 100);
  }
}
