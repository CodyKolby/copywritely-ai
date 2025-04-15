
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0'

// CORS headers for the function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role for admin privileges
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { userId } = await req.json()
    
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: 'User ID is required',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Get user data from auth.users
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (userError) {
      console.error('Error fetching user:', userError)
      return new Response(
        JSON.stringify({
          error: 'Could not fetch user data',
          details: userError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }
    
    if (!userData?.user) {
      return new Response(
        JSON.stringify({
          error: 'User not found',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    const user = userData.user
    const email = user.email
    const metadata = user.user_metadata || {}
    
    console.log('Create profile function - user data:', {
      id: userId,
      email: email,
      metadata: metadata
    })
    
    // Generate a default name from email if no name is available
    const defaultName = email ? email.split('@')[0] : `User-${userId.substring(0, 8)}`
    const fullName = metadata.full_name || metadata.name || defaultName

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    // Insert or update the profile
    let operation
    if (existingProfile) {
      console.log(`Profile exists for user ${userId}, updating it`)
      operation = supabaseAdmin
        .from('profiles')
        .update({
          email: email || null,
          full_name: fullName,
          avatar_url: metadata.avatar_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
    } else {
      console.log(`Creating new profile for user ${userId}`)
      operation = supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email: email || null,
          full_name: fullName,
          avatar_url: metadata.avatar_url || null,
          is_premium: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    }

    const { data: profile, error: profileError } = await operation.select().single()

    if (profileError) {
      console.error('Error creating/updating profile:', profileError)
      return new Response(
        JSON.stringify({
          error: 'Failed to create/update profile',
          details: profileError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        profile
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Exception:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
