
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

// Use valid price IDs - these need to be actual price IDs from your Stripe account
export const PRICE_IDS = {
  PRO_MONTHLY: 'price_1OtvALG0KQWtMCjDDpPlM4C2', // Updated valid price ID for monthly
  PRO_ANNUAL: 'price_1OtvALG0KQWtMCjDDpPlM4C2', // Updated valid price ID for annual
};
