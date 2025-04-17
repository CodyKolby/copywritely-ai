
import { loadStripe } from '@stripe/stripe-js';

// Use the Stripe publishable key from environment variables
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

// Initialize Stripe with the key from environment variables
let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    console.log('Initializing Stripe with environment key');
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Updated price IDs to use more generic naming
export const PRICE_IDS = {
  PRO_MONTHLY: 'price_monthly', // Replace with your actual monthly price ID
  PRO_ANNUAL: 'price_annual'    // Replace with your actual annual price ID
};

