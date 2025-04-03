
import Stripe from "https://esm.sh/stripe@12.1.1";

// Initialize the Stripe client with the secret key
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

if (!stripeSecretKey) {
  console.error("STRIPE_SECRET_KEY is not set in environment variables");
}

export const stripe = new Stripe(stripeSecretKey || "", {
  apiVersion: "2023-10-16", // Use a stable API version
  httpClient: Stripe.createFetchHttpClient(),
});

// Helper function to handle webhook construction more gracefully
export const constructWebhookEvent = async (
  body: string,
  signature: string | null,
  secret: string | null
): Promise<{ event: any; verified: boolean }> => {
  // Always try to parse the body as JSON first
  let eventData: any;
  try {
    eventData = JSON.parse(body);
  } catch (parseError) {
    console.error("Failed to parse webhook body as JSON:", parseError);
    throw new Error(`Invalid JSON in webhook body: ${parseError.message}`);
  }

  // If we have signature and secret, try to verify
  if (signature && secret) {
    try {
      const verifiedEvent = stripe.webhooks.constructEvent(body, signature, secret);
      console.log("Signature verified successfully");
      return { event: verifiedEvent, verified: true };
    } catch (err) {
      console.warn(`Webhook signature verification failed: ${err.message}`);
      console.log("Using unverified event data as fallback");
    }
  } else {
    console.log(
      `${!signature ? "Missing stripe-signature header" : ""}${
        !secret ? (signature ? ", m" : "M") + "issing webhook secret" : ""
      }. Processing without verification.`
    );
  }

  // Return unverified event data as fallback
  return { event: eventData, verified: false };
};
