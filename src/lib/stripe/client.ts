
import { loadStripe } from '@stripe/stripe-js';

// Directly use the correct publishable key without relying on environment variables
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51QfM9GAGO17NLUWtTEUDQB0czM3OCU3MFcZatLoi8LH5fil4we3YiXhg9c77yDELN12nlpyd185k0w8c1HX3dsEz0022Os2Bn5';

// Initialize Stripe with the hardcoded key
let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    console.log('Initializing Stripe with hardcoded key');
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Use test mode price IDs that work with test mode
export const PRICE_IDS = {
  PRO_MONTHLY: 'price_1ORzDYAGO17NLUWtQEg4cYBE', // Updated test mode price ID for monthly
  PRO_ANNUAL: 'price_1ORzDYAGO17NLUWtQEg4cYBE', // Same ID for annual for testing
};
