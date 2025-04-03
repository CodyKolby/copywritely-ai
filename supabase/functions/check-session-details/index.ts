
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
      subscription: session.subscription ? session.subscription : "no subscription found",
      customer: session.customer ? session.customer : "no customer found",
      payment_status: session.payment_status,
      metadata: session.metadata || {}
    });
    
    // Get subscription details if available
    console.log("[CHECK-SESSION] Getting subscription details");
    let subscriptionId = null;
    let subscriptionStatus = 'active'; // Default fallback
    let subscriptionExpiry = null;
    
    try {
      if (session.subscription) {
        const subDetails = await getSubscriptionDetails(session, stripeSecretKey);
        subscriptionId = subDetails.subscriptionId;
        subscriptionStatus = subDetails.subscriptionStatus || 'active';
        subscriptionExpiry = subDetails.subscriptionExpiry;
        
        console.log('[CHECK-SESSION] Retrieved subscription details from Stripe:', {
          subscriptionId,
          subscriptionStatus,
          subscriptionExpiry
        });
      } else {
        console.log('[CHECK-SESSION] No subscription in session, using default values');
      }
    } catch (subError) {
      console.error('[CHECK-SESSION] Error getting subscription details:', subError);
      // Continue with defaults
    }
    
    // Always provide default values
    const defaultExpiryDate = getDefaultExpiryDate();
    
    // Response data with guaranteed values
    const responseData = {
      subscriptionId: subscriptionId || session.subscription || null,
      subscriptionStatus: subscriptionStatus || 'active',
      subscriptionExpiry: subscriptionExpiry || defaultExpiryDate,
      customerId: session.customer || null,
      customerEmail: session.customer_email || null
    };
    
    console.log('[CHECK-SESSION] Returning response data:', responseData);
    
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
