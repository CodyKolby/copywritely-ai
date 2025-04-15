
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { clearPremiumFromLocalStorage } from './local-storage-utils'

export const signInWithGoogle = async () => {
  try {
    console.log('[AUTH] Attempting Google sign in');
    
    // Force clean any potential stale auth state
    localStorage.removeItem('supabase.auth.token');
    
    // Use the full URL to ensure proper redirect handling
    const origin = window.location.origin;
    const redirectUrl = `${origin}/login`;
    
    console.log(`[AUTH] Setting redirectTo to: ${redirectUrl}`);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    
    if (error) throw error
    
    console.log('[AUTH] Google sign in response:', data);
  } catch (error) {
    if (error instanceof Error) {
      toast.error('Error signing in with Google', {
        description: error.message,
        dismissible: true
      })
    }
    console.error('[AUTH] Error signing in with Google:', error)
  }
}

export const signInWithEmail = async (email: string, password: string) => {
  try {
    console.log('[AUTH] Attempting email sign in');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    
    console.log('[AUTH] Email sign in success:', data.user?.id);
    
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
    console.error('[AUTH] Error signing in with email:', error)
  }
}

export const signUpWithEmail = async (email: string, password: string) => {
  try {
    console.log('[AUTH] Attempting email sign up with email:', email);
    
    // Extract a simple username from email for the full_name field
    const username = email.split('@')[0];
    console.log('[AUTH] Using generated username for full_name:', username);
    
    // Enhanced user metadata with additional fields
    const userData = {
      full_name: username,
      name: username,  // Add name as fallback
      avatar_url: null
    };
    
    console.log('[AUTH] Including user metadata in signup:', userData);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: userData
      }
    })
    
    if (error) throw error
    
    console.log('[AUTH] Email sign up success:', data);
    
    // After successful signup, try to create the profile directly
    // This is a backup in case the RLS policies or triggers fail
    if (data.user) {
      try {
        console.log('[AUTH] Attempting direct profile creation after signup');
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            full_name: username,
            avatar_url: null,
            is_premium: false,
            updated_at: new Date().toISOString()
          })
          
        if (profileError) {
          console.error('[AUTH] Error creating profile after signup:', profileError);
          
          // Try with create-profile edge function as a fallback
          try {
            console.log('[AUTH] Attempting profile creation with edge function');
            
            const response = await fetch('https://jorbqjareswzdrsmepbv.functions.supabase.co/create-profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userId: data.user.id }),
            });
            
            if (response.ok) {
              console.log('[AUTH] Edge function profile creation successful');
            } else {
              console.error('[AUTH] Edge function profile creation failed:', await response.text());
            }
          } catch (edgeFunctionError) {
            console.error('[AUTH] Error calling create-profile edge function:', edgeFunctionError);
          }
        } else {
          console.log('[AUTH] Profile created successfully after signup');
        }
      } catch (profileErr) {
        console.error('[AUTH] Exception creating profile after signup:', profileErr);
      }
    }
    
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
    console.error('[AUTH] Error signing up with email:', error)
  }
}

export const signOut = async () => {
  try {
    toast.loading('Wylogowywanie...', {
      dismissible: true
    });
    
    // Clear premium from localStorage
    clearPremiumFromLocalStorage();
    
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
    clearPremiumFromLocalStorage();
    
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
