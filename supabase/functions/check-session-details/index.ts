
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../verify-payment-session/utils.ts";
import { getStripeSession, getSubscriptionDetails } from "../verify-payment-session/stripe.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      throw new Error('Missing sessionId parameter');
    }
    
    console.log(`Checking session details for: ${sessionId}`);
    
    // Get Stripe secret key
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not set");
    }
    
    // Fetch session details
    const session = await getStripeSession(sessionId, stripeSecretKey);
    
    if (!session) {
      throw new Error("Session not found");
    }
    
    // Get subscription details if available
    const { subscriptionId, subscriptionStatus, subscriptionExpiry } = 
      await getSubscriptionDetails(session, stripeSecretKey);
      
    console.log('Retrieved subscription details:', {
      subscriptionId,
      subscriptionStatus,
      subscriptionExpiry
    });
    
    return new Response(
      JSON.stringify({
        subscriptionId,
        subscriptionStatus,
        subscriptionExpiry,
        customerId: session.customer || null,
        customerEmail: session.customer_email || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in check-session-details function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error checking session details' 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
