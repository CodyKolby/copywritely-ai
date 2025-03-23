
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
    // Show a loading toast
    const loadingToastId = toast.loading('Wylogowywanie...');
    
    // Implement a timeout to prevent hanging
    const timeoutPromise = new Promise<{error: Error}>((_, reject) => {
      setTimeout(() => reject({error: new Error('Timeout wylogowania')}), 3000);
    });
    
    // Race between actual signOut and timeout
    const result = await Promise.race([
      supabase.auth.signOut(),
      timeoutPromise
    ]);
    
    // Dismiss loading toast
    toast.dismiss(loadingToastId);
    
    if (result.error) throw result.error;
    
    // Force clear local storage auth data to ensure logout works even if Supabase fails
    // Use the correct approach for clearing auth data
    const storageKey = `sb-${window.location.hostname}-auth-token`;
    localStorage.removeItem(storageKey);
    
    // Add a fallback for different key formats
    const allKeys = Object.keys(localStorage);
    const supabaseAuthKeys = allKeys.filter(key => key.startsWith('sb-') && key.includes('-auth-token'));
    for (const key of supabaseAuthKeys) {
      localStorage.removeItem(key);
    }
    
    // Force reload the page to ensure all auth state is reset
    toast.success('Wylogowano pomyślnie');
    setTimeout(() => window.location.reload(), 1000);
  } catch (error) {
    if (error instanceof Error) {
      toast.error('Błąd podczas wylogowywania', {
        description: error.message
      });
      
      // Force clear local storage auth data as a fallback
      // Use the correct approach for clearing auth data
      const storageKey = `sb-${window.location.hostname}-auth-token`;
      localStorage.removeItem(storageKey);
      
      // Add a fallback for different key formats
      const allKeys = Object.keys(localStorage);
      const supabaseAuthKeys = allKeys.filter(key => key.startsWith('sb-') && key.includes('-auth-token'));
      for (const key of supabaseAuthKeys) {
        localStorage.removeItem(key);
      }
      
      // Force reload the page to ensure all auth state is reset
      setTimeout(() => window.location.reload(), 1000);
    }
    console.error('Error signing out:', error);
  }
}
