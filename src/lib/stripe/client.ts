
import { loadStripe } from '@stripe/stripe-js';

// Directly use the correct publishable key without relying on environment variables
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51PrJJ7P9eOGurTfEorcNVrn32fyWtYCtYb5Ds6o66LESlNyDGMOsuOTp0GCp2LzFkEahm3f1WJHm3JajJQigNPCn00musc8KaN';

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
  PRO_MONTHLY: 'price_1REoq0P9eOGurTfE6HuKkge0', // Używamy dostarczonego Price ID
  PRO_ANNUAL: 'price_1REoq0P9eOGurTfE6HuKkge0', // Ten sam ID dla planu rocznego (zgodnie z instrukcją)
};
