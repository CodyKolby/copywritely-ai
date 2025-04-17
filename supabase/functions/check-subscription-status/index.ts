
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";
import { corsHeaders } from "../shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user ID from request
    const requestData = await req.json();
    const userId = requestData.userId;

    if (!userId) {
      console.error('Missing userId parameter in request');
      throw new Error('Missing userId parameter');
    }

    console.log(`Checking subscription status for user: ${userId}`);

    // Create Supabase client with Service Role Key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // First check if user exists in auth system
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData?.user) {
      console.warn('Error verifying user:', userError?.message || 'User not found');
    }

    // Check if the user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium, subscription_expiry, subscription_status, subscription_id')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error retrieving profile:', profileError.message);
    }

    if (!profile) {
      console.log('No profile found, user has no premium status');
      return new Response(
        JSON.stringify({ isPremium: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Profile found:', profile);

    // Check if subscription is explicitly marked as premium
    if (profile.is_premium) {
      // Check if there's an expiry date
      if (profile.subscription_expiry) {
        const expiryDate = new Date(profile.subscription_expiry);
        const now = new Date();

        if (expiryDate < now) {
          console.log('Subscription has expired on:', profile.subscription_expiry);
          
          // Update database to reflect expired status
          await supabase
            .from('profiles')
            .update({
              is_premium: false,
              subscription_status: 'expired',
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
            
          return new Response(
            JSON.stringify({ isPremium: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      console.log('User has valid premium status');
      return new Response(
        JSON.stringify({ isPremium: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // User does not have premium status
    console.log('User does not have premium status');
    return new Response(
      JSON.stringify({ isPremium: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking subscription status:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error checking subscription status',
        isPremium: false
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
