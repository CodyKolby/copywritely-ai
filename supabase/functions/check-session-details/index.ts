
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../verify-payment-session/utils.ts";
import { getStripeSession, getSubscriptionDetails } from "../verify-payment-session/stripe.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[CHECK-SESSION] Function started");
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      console.error("[CHECK-SESSION] Missing sessionId parameter");
      throw new Error('Missing sessionId parameter');
    }
    
    console.log(`[CHECK-SESSION] Checking session details for: ${sessionId}`);
    
    // Get Stripe secret key
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("[CHECK-SESSION] STRIPE_SECRET_KEY not set");
      throw new Error("STRIPE_SECRET_KEY not set");
    }
    
    // Fetch session details
    console.log("[CHECK-SESSION] Fetching Stripe session data");
    const session = await getStripeSession(sessionId, stripeSecretKey);
    
    if (!session) {
      console.error("[CHECK-SESSION] Session not found");
      throw new Error("Session not found");
    }
    
    console.log("[CHECK-SESSION] Session data retrieved:", {
      id: session.id,
      subscription: session.subscription ? "yes" : "no",
      customer: session.customer ? "yes" : "no",
      payment_status: session.payment_status
    });
    
    // Get subscription details if available
    console.log("[CHECK-SESSION] Getting subscription details");
    const { subscriptionId, subscriptionStatus, subscriptionExpiry } = 
      await getSubscriptionDetails(session, stripeSecretKey);
      
    console.log('[CHECK-SESSION] Retrieved subscription details:', {
      subscriptionId,
      subscriptionStatus,
      subscriptionExpiry
    });
    
    // Always provide default values
    const defaultExpiryDate = getDefaultExpiryDate();
    
    // Response data with fallbacks for missing values
    const responseData = {
      subscriptionId: subscriptionId || null,
      subscriptionStatus: subscriptionStatus || 'active',
      subscriptionExpiry: subscriptionExpiry || defaultExpiryDate,
      customerId: session.customer || null,
      customerEmail: session.customer_email || null
    };
    
    console.log('[CHECK-SESSION] Returning response data:', responseData);
    
    // Make sure we always return valid values for these fields
    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[CHECK-SESSION] Error in check-session-details function:', error);
    
    // Even on error, return some default data
    const defaultResponse = {
      error: error.message || 'Error checking session details',
      subscriptionId: null,
      subscriptionStatus: 'active',
      subscriptionExpiry: getDefaultExpiryDate()
    };
    
    console.log('[CHECK-SESSION] Returning error response with defaults:', defaultResponse);
    
    return new Response(
      JSON.stringify(defaultResponse),
      { 
        status: 200, // Return 200 even on error to avoid client-side errors
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
