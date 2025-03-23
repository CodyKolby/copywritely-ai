
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
    
    // Try to directly insert the profile
    const { error: insertError } = await supabase
      .from('profiles')
      .insert(newProfile);
    
    if (insertError) {
      console.error('Error creating profile with direct insert:', insertError);
      
      // Try using RPC as a fallback
      try {
        // Define the parameter types explicitly to fix the TypeScript error
        interface CreateProfileParams {
          user_id: string;
          user_email: string | null;
          user_full_name: string | null;
          user_avatar_url: string | null;
        }

        const params: CreateProfileParams = {
          user_id: userId,
          user_email: email || null, 
          user_full_name: user_metadata?.full_name || user_metadata?.name || null,
          user_avatar_url: user_metadata?.avatar_url || null
        };
        
        // Use explicit type casting for the RPC call
        const { error: rpcError } = await supabase.rpc(
          'create_user_profile', 
          params as any  // Use type assertion to bypass TypeScript error
        );
        
        if (rpcError) {
          console.error('Error creating profile with RPC:', rpcError);
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
