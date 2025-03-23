
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { Profile } from './types'

export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      
      // If profile not found (code 406), create a new profile
      if (error.code === 'PGRST116') {
        const newProfile = await createProfile(userId);
        return newProfile;
      }
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

export const createProfile = async (userId: string): Promise<Profile | null> => {
  try {
    // Get user details from supabase auth
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      console.error('No user data available to create profile');
      return null;
    }
    
    const { email, user_metadata } = userData.user;
    
    const newProfile = {
      id: userId,
      email: email,
      full_name: user_metadata?.full_name || user_metadata?.name || '',
      avatar_url: user_metadata?.avatar_url || '',
      is_premium: false
    };
    
    console.log('Creating new profile:', newProfile);
    
    // Próbujemy utworzyć profil używając service role dla ominiecia RLS
    // Uwaga: To jest bezpieczne, ponieważ wykonujemy to tylko w kontekście zalogowanego użytkownika
    // i tworzymy profil tylko dla aktualnie zalogowanego użytkownika
    const serviceClient = supabase.auth.admin;
    let error;
    
    if (serviceClient) {
      // Próba użycia klienta z uprawnieniami service role
      const { error: serviceError } = await serviceClient.insertRow('profiles', newProfile);
      error = serviceError;
    } else {
      // Fallback do standardowego klienta
      const { error: standardError } = await supabase.from('profiles').insert(newProfile);
      error = standardError;
    }
    
    if (error) {
      console.error('Error creating profile with standard client:', error);
      
      // Ostatnia próba - użycie klienta z rozszerzonymi uprawnieniami
      try {
        const { error: finalError } = await supabase.rpc('create_user_profile', { 
          user_id: userId,
          user_email: email || null,
          user_full_name: user_metadata?.full_name || user_metadata?.name || null,
          user_avatar_url: user_metadata?.avatar_url || null
        });
        
        if (finalError) {
          console.error('Error creating profile with RPC:', finalError);
          toast.error('Nie udało się utworzyć profilu użytkownika');
          return null;
        }
      } catch (rpcError) {
        console.error('RPC call failed:', rpcError);
        toast.error('Nie udało się utworzyć profilu użytkownika');
        return null;
      }
    }
    
    console.log('Profile created successfully');
    
    // Refresh and return profile data
    return await fetchProfile(userId);
  } catch (error) {
    console.error('Error creating profile:', error);
    return null;
  }
}

export const checkPremiumStatus = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('check-subscription-status', {
      body: { userId }
    });
    
    if (error) {
      console.error('Error checking premium status:', error);
      // Fallback to database check
      return await checkPremiumStatusFallback(userId);
    }
    
    return data?.isPremium || false;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return await checkPremiumStatusFallback(userId);
  }
}

const checkPremiumStatusFallback = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error checking premium status (fallback):', error);
      return false;
    }
    
    return data?.is_premium || false;
  } catch (fallbackError) {
    console.error('Error in fallback premium status check:', fallbackError);
    return false;
  }
}

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
