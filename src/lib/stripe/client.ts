
import { loadStripe } from '@stripe/stripe-js';

// Get public key from environment variables
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

// Initialize Stripe
let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise && stripePublicKey) {
    console.log('Initializing Stripe with public key:', stripePublicKey ? 'Available' : 'Missing');
    stripePromise = loadStripe(stripePublicKey);
  }
  return stripePromise;
};

// Actual price IDs from Stripe
export const PRICE_IDS = {
  PRO_MONTHLY: 'price_1R5A8aAGO17NLUWtxzthF8lo', // Test mode price ID
  PRO_ANNUAL: 'price_1R5A8aAGO17NLUWtxzthF8lo', // Using the same ID for testing
};
