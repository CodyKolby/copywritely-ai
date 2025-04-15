
import { supabase } from '@/integrations/supabase/client';
import { Profile } from './types';

/**
 * Fetches user profile from database
 */
export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  try {
    console.log(`[PROFILE-UTILS] Fetching profile for user: ${userId}`);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('[PROFILE-UTILS] Error fetching profile:', error);
      
      // Get user data from current session to use in profile creation
      const { data: sessionData } = await supabase.auth.getSession();
      const userData = sessionData?.session?.user;
      
      if (userData) {
        console.log('[PROFILE-UTILS] User data from session for profile creation:', userData);
      } else {
        console.error('[PROFILE-UTILS] No user data available in current session');
      }
      
      // Attempt to create profile if none exists
      return createProfile(userId);
    }
    
    console.log('[PROFILE-UTILS] Profile fetched successfully:', data);
    return data as Profile;
  } catch (error) {
    console.error('[PROFILE-UTILS] Exception fetching profile:', error);
    return null;
  }
};

/**
 * Creates a new profile for a user
 */
export const createProfile = async (userId: string): Promise<Profile | null> => {
  try {
    console.log(`[PROFILE-UTILS] Creating profile for user: ${userId}`);
    
    // Get current session for user data
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      console.error('[PROFILE-UTILS] No user session available for profile creation');
      
      // Fallback: Fetch user directly from auth.admin (via edge function)
      try {
        const response = await fetch(`${window.location.origin}/.netlify/functions/create-profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData?.session?.access_token || ''}`,
          },
          body: JSON.stringify({ userId }),
        });
        
        if (!response.ok) {
          console.error('[PROFILE-UTILS] Edge function failed with status:', response.status);
          
          // Try Supabase Edge Function directly
          const edgeResponse = await fetch('https://jorbqjareswzdrsmepbv.functions.supabase.co/create-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionData?.session?.access_token || ''}`,
            },
            body: JSON.stringify({ userId }),
          });
          
          if (edgeResponse.ok) {
            const result = await edgeResponse.json();
            console.log('[PROFILE-UTILS] Profile created via Supabase edge function:', result);
            return result.profile as Profile;
          } else {
            console.error('[PROFILE-UTILS] Supabase edge function failed:', await edgeResponse.text());
          }
        } else {
          const result = await response.json();
          console.log('[PROFILE-UTILS] Profile created via Netlify function:', result);
          return result.profile as Profile;
        }
      } catch (edgeFnError) {
        console.error('[PROFILE-UTILS] Error calling create-profile function:', edgeFnError);
      }
      
      return null;
    }
    
    console.log('[PROFILE-UTILS] User data retrieved for profile creation:', user);
    
    // Extract useful data from user object
    const email = user.email;
    const userMetadata = user.user_metadata || {};
    
    console.log('[PROFILE-UTILS] Current user metadata:', userMetadata);
    
    // Generate a default name from email if no name is available in metadata
    const defaultName = email ? email.split('@')[0] : `User-${userId.substring(0, 8)}`;
    const fullName = userMetadata.full_name || userMetadata.name || defaultName;
    
    console.log('[PROFILE-UTILS] Using name for profile:', fullName);
    
    // Create profile with manual data from session if available
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: email || null,
        full_name: fullName,
        avatar_url: userMetadata.avatar_url || null,
        is_premium: false,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) {
      console.error('[PROFILE-UTILS] Error creating profile:', error);
      console.log('[PROFILE-UTILS] Profile creation failed with standard client, error code:', error.code);
      
      if (error.code === '42501' || error.message.includes('permission denied')) {
        console.log('[PROFILE-UTILS] Trying to create profile with edge function due to permissions issue');
        
        // Try calling the edge function directly if we have permission issues
        try {
          const response = await fetch('https://jorbqjareswzdrsmepbv.functions.supabase.co/create-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('[PROFILE-UTILS] Profile created via edge function after permission error:', result);
            return result.profile as Profile;
          } else {
            console.error('[PROFILE-UTILS] Edge function failed after permission error:', await response.text());
          }
        } catch (edgeFnError) {
          console.error('[PROFILE-UTILS] Error calling create-profile edge function after permission error:', edgeFnError);
        }
      }
      
      return null;
    }
    
    console.log('[PROFILE-UTILS] Profile created successfully:', data);
    return data as Profile;
  } catch (error) {
    console.error('[PROFILE-UTILS] Exception creating profile:', error);
    return null;
  }
};

/**
 * Updates premium status for a user profile
 */
export const updatePremiumStatus = async (userId: string, isPremium: boolean): Promise<boolean> => {
  try {
    console.log(`[PROFILE-UTILS] Updating premium status to ${isPremium} for user: ${userId}`);
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_premium: isPremium,
        subscription_status: isPremium ? 'active' : 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (error) {
      console.error('[PROFILE-UTILS] Error updating premium status:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[PROFILE-UTILS] Exception updating premium status:', error);
    return false;
  }
};
