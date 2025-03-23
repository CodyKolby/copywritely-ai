
import { loadStripe } from '@stripe/stripe-js';

// Get public key from environment variables
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

// Initialize Stripe
let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise && stripePublicKey) {
    console.log('Initializing Stripe with public key:', stripePublicKey ? 'Key available' : 'Missing');
    stripePromise = loadStripe(stripePublicKey);
  }
  return stripePromise;
};

// Use the actual price IDs from your Stripe account
export const PRICE_IDS = {
  PRO_MONTHLY: 'price_1RlTaxAGO17NLUWtX1RPFdcT', // Updated price ID for monthly
  PRO_ANNUAL: 'price_1RlTaxAGO17NLUWtX1RPFdcT', // Updated price ID for annual
};
