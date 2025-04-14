
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";
import Stripe from "https://esm.sh/stripe@12.1.1";

// Get keys from environment variables
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Stripe client
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2022-11-15'
}) : null;

// Helper function to check if subscription is expired
const isSubscriptionExpired = (expiryDate: string): boolean => {
  try {
    const expiry = new Date(expiryDate);
    const now = new Date();
    
    return expiry < now;
  } catch (error) {
    console.error('Error checking subscription expiry:', error);
    return true; // Assume expired on error
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user ID from request
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('Missing userId');
    }

    console.log(`Fetching subscription details for user: ${userId}`);

    // Create Supabase client with Service Role Key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile with subscription information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_id, subscription_status, subscription_expiry, is_premium, email')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    console.log('Profile data:', profile);

    // First check if subscription is expired based on the database
    if (profile?.subscription_expiry) {
      if (isSubscriptionExpired(profile.subscription_expiry) && profile.subscription_status !== 'trialing') {
        console.log('Subscription has expired based on database date:', profile.subscription_expiry);
        
        // Update profile to reflect expired status
        await supabase
          .from('profiles')
          .update({
            is_premium: false,
            subscription_status: 'inactive',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        return new Response(
          JSON.stringify({ 
            hasSubscription: false,
            error: 'Subscription has expired'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check for trial status - only if explicitly marked as trialing 
    // or if premium is true but no subscription ID exists
    let isTrial = profile?.subscription_status === 'trialing';
    
    // If user has premium status but no subscription ID, they might be in a trial
    // but only if we're sure a trial was explicitly started
    if (profile?.is_premium && (!profile?.subscription_id || profile.subscription_id === '')) {
      // We assume this is a trial, but will double-check with Stripe later if possible
      isTrial = true;
    }
    
    // If user has premium but no subscription ID or it's marked as a trial,
    // return basic information but continue to check with Stripe if available
    if (profile?.is_premium && (isTrial || !profile?.subscription_id || profile.subscription_id === '')) {
      console.log('User has premium status in trial mode or without subscription ID');
      
      // For premium users without subscription ID, try to check if there's a Stripe customer
      let portalUrl = null;
      let stripeSubscriptionData = null;
      
      try {
        if (stripe && profile.email) {
          console.log('Checking for Stripe customer with email:', profile.email);
          
          // Check if user exists in Stripe using SDK
          const customers = await stripe.customers.list({ 
            email: profile.email,
            limit: 1 
          });
          
          if (customers.data && customers.data.length > 0) {
            const customerId = customers.data[0].id;
            console.log('Found Stripe customer ID for premium user:', customerId);
            
            // Check for active subscriptions
            const subscriptions = await stripe.subscriptions.list({
              customer: customerId,
              status: 'active',
              limit: 1
            });
            
            if (subscriptions.data && subscriptions.data.length > 0) {
              const subscription = subscriptions.data[0];
              console.log('Found active subscription for customer:', subscription.id);
              
              // Update profile with subscription details if missing
              if (!profile.subscription_id || profile.subscription_id !== subscription.id) {
                const expiryDate = new Date(subscription.current_period_end * 1000).toISOString();
                
                console.log('Updating profile with Stripe subscription data:', {
                  subscription_id: subscription.id,
                  subscription_status: subscription.status,
                  subscription_expiry: expiryDate
                });
                
                await supabase
                  .from('profiles')
                  .update({
                    subscription_id: subscription.id,
                    subscription_status: subscription.status,
                    subscription_expiry: expiryDate,
                    is_premium: true,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', userId);
                  
                // Update local data for response
                profile.subscription_id = subscription.id;
                profile.subscription_status = subscription.status;
                profile.subscription_expiry = expiryDate;
                
                // Remember subscription data for response
                stripeSubscriptionData = {
                  id: subscription.id,
                  status: subscription.status,
                  currentPeriodEnd: expiryDate,
                  isTrial: subscription.status === 'trialing',
                  trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
                };
              }
            }
            
            // Create customer portal session
            try {
              console.log('Creating customer portal session for customer:', customerId);
              const session = await stripe.billingPortal.sessions.create({
                customer: customerId,
                return_url: `${req.headers.get('origin') || 'https://copywrite-assist.com'}/`,
              });
              
              portalUrl = session.url;
              console.log('Created customer portal session URL:', portalUrl);
            } catch (portalError) {
              console.error('Error trying to create portal URL:', portalError);
            }
          } else {
            console.log('No Stripe customer found for email:', profile.email);
          }
        }
      } catch (stripeError) {
        console.error('Error checking Stripe for customer/subscription:', stripeError);
      }
      
      // Determine expiry date and days remaining
      let expiryDate = profile.subscription_expiry;
      let daysUntil = 0;
      
      // If we have Stripe data, use it
      if (stripeSubscriptionData) {
        isTrial = stripeSubscriptionData.isTrial;
        expiryDate = stripeSubscriptionData.currentPeriodEnd;
      }
      
      // If no expiry date set, default to 30 days from now for subscriptions
      // or 3 days for trials
      if (!expiryDate) {
        const now = new Date();
        if (isTrial) {
          now.setDate(now.getDate() + 3); // 3-day trial
        } else {
          now.setDate(now.getDate() + 30); // 30-day subscription
        }
        expiryDate = now.toISOString();
        
        // Update the profile with this expiry date
        await supabase
          .from('profiles')
          .update({
            subscription_expiry: expiryDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      }
      
      // Calculate days until expiry
      if (expiryDate) {
        daysUntil = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24));
        
        // If days until is negative, subscription has expired - force update status
        if (daysUntil <= 0) {
          console.log('Subscription has expired based on days calculation');
          
          await supabase
            .from('profiles')
            .update({
              is_premium: false,
              subscription_status: 'inactive',
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
            
          return new Response(
            JSON.stringify({ 
              hasSubscription: false,
              error: 'Subscription has expired'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
        
      return new Response(
        JSON.stringify({ 
          hasSubscription: true,
          subscriptionId: profile.subscription_id || stripeSubscriptionData?.id || 'manual_premium',
          status: profile.subscription_status || stripeSubscriptionData?.status || 'active',
          currentPeriodEnd: expiryDate,
          daysUntilRenewal: daysUntil,
          cancelAtPeriodEnd: false,
          portalUrl: portalUrl,
          plan: isTrial ? 'Trial' : 'Pro',
          isTrial: isTrial,
          trialEnd: isTrial ? expiryDate : null,
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Regular subscription flow - subscription ID exists in profile
    if (profile?.subscription_id) {
      try {
        if (!stripe) {
          throw new Error('Missing Stripe API key or failed to initialize client');
        }
        
        // Get subscription details from Stripe using SDK
        const subscription = await stripe.subscriptions.retrieve(profile.subscription_id);
        
        if (!subscription) {
          throw new Error('Failed to fetch subscription data');
        }

        // Update the profile with latest Stripe data
        const expiryDate = new Date(subscription.current_period_end * 1000).toISOString();
        const subscriptionStatus = subscription.status;
        
        // Only update if there's a difference
        if (profile.subscription_expiry !== expiryDate || profile.subscription_status !== subscriptionStatus) {
          console.log('Updating profile with latest Stripe data:', {
            subscription_status: subscriptionStatus,
            subscription_expiry: expiryDate
          });
          
          await supabase
            .from('profiles')
            .update({
              subscription_status: subscriptionStatus,
              subscription_expiry: expiryDate,
              is_premium: subscriptionStatus === 'active' || subscriptionStatus === 'trialing',
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        }
        
        // Try to create Customer Portal session using Stripe SDK
        let portalUrl = null;
        
        if (subscription.customer) {
          try {
            console.log('Creating customer portal session for customer:', subscription.customer);
            
            // Create customer portal session using SDK
            const portalSession = await stripe.billingPortal.sessions.create({
              customer: subscription.customer,
              return_url: `${req.headers.get('origin') || 'https://copywrite-assist.com'}/`,
            });
            
            portalUrl = portalSession.url;
            console.log('Created customer portal session URL:', portalUrl);
          } catch (portalError) {
            console.error('Error creating customer portal session:', portalError);
          }
        } else {
          console.error('No customer ID found in subscription data');
        }

        // Format and return data
        const currentDate = new Date();
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        const daysUntilRenewal = Math.ceil((currentPeriodEnd.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));
        
        // Check if subscription has expired
        if (daysUntilRenewal <= 0 && subscription.status !== 'trialing') {
          console.log('Subscription has expired based on days calculation');
          
          await supabase
            .from('profiles')
            .update({
              is_premium: false,
              subscription_status: 'inactive',
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
            
          return new Response(
            JSON.stringify({ 
              hasSubscription: false,
              error: 'Subscription has expired'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const formattedData = {
          subscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodEnd: currentPeriodEnd.toISOString(),
          daysUntilRenewal: daysUntilRenewal,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          portalUrl: portalUrl,
          hasSubscription: true,
          plan: subscription.items?.data[0]?.plan?.nickname || 'Pro',
          trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          isTrial: subscription.status === 'trialing',
        };

        return new Response(
          JSON.stringify(formattedData),
          { 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        );
      } catch (stripeError) {
        console.error('Error communicating with Stripe:', stripeError);
        
        // If the error is that subscription doesn't exist but user has premium status
        // Fallback to profile data
        if (profile.is_premium) {
          // Verify expiry date
          let isExpired = false;
          let daysRemaining = 30; // Default
          
          if (profile.subscription_expiry) {
            isExpired = isSubscriptionExpired(profile.subscription_expiry);
            
            if (!isExpired) {
              // Calculate days remaining
              const expiryDate = new Date(profile.subscription_expiry);
              const now = new Date();
              daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
            }
          }
          
          // If expired, update profile and return expired status
          if (isExpired) {
            console.log('Subscription has expired based on profile data');
            
            await supabase
              .from('profiles')
              .update({
                is_premium: false,
                subscription_status: 'inactive',
                updated_at: new Date().toISOString()
              })
              .eq('id', userId);
              
            return new Response(
              JSON.stringify({ 
                hasSubscription: false,
                error: 'Subscription has expired'
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          // If not expired, return basic information
          return new Response(
            JSON.stringify({ 
              hasSubscription: true,
              subscriptionId: profile.subscription_id || 'manual_premium',
              status: profile.subscription_status || 'active',
              currentPeriodEnd: profile.subscription_expiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              daysUntilRenewal: daysRemaining,
              cancelAtPeriodEnd: false,
              portalUrl: null,
              plan: 'Pro',
              trialEnd: null,
              isTrial: false,
            }),
            { 
              headers: { 
                ...corsHeaders,
                'Content-Type': 'application/json' 
              } 
            }
          );
        }
        
        throw new Error('Error communicating with Stripe');
      }
    } else {
      // No subscription found
      console.log('No subscription data found for user');
      return new Response(
        JSON.stringify({ 
          error: 'User does not have an active subscription',
          hasSubscription: false
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
  } catch (error) {
    console.error('Error fetching subscription data:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error fetching subscription data',
        hasSubscription: false,
        trialEnd: null
      }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
