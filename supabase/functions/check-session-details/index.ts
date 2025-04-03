
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
    
    // Make sure we always return valid values for these fields
    return new Response(
      JSON.stringify({
        subscriptionId: subscriptionId || null,
        subscriptionStatus: subscriptionStatus || 'active',
        subscriptionExpiry: subscriptionExpiry || getDefaultExpiryDate(),
        customerId: session.customer || null,
        customerEmail: session.customer_email || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in check-session-details function:', error);
    
    // Even on error, return some default data
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error checking session details',
        subscriptionStatus: 'active',
        subscriptionExpiry: getDefaultExpiryDate()
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper function to get a default expiry date (30 days from now)
function getDefaultExpiryDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString();
}
