
import { loadStripe } from '@stripe/stripe-js';

// Get public key from environment variables or use direct value
// Replace this with your actual publishable key if the environment variable isn't working
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51OtvALG0KQWtMCjDDpPlM4C2Gm2MUbZb3O8ZkDTkKCU6Dsk4NQe7EDc9l6XmLhB2Ll9x9pXnLDTWVF8kPmtxEWGh00uzNZCIMh';

// Initialize Stripe
let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise && stripePublicKey) {
    console.log('Initializing Stripe with public key:', stripePublicKey ? 'Key available' : 'Missing');
    stripePromise = loadStripe(stripePublicKey);
  }
  return stripePromise;
};

// Use valid price IDs - these need to be actual price IDs from your Stripe account
export const PRICE_IDS = {
  PRO_MONTHLY: 'price_1OtvALG0KQWtMCjDDpPlM4C2', // Updated valid price ID for monthly
  PRO_ANNUAL: 'price_1OtvALG0KQWtMCjDDpPlM4C2', // Updated valid price ID for annual
};
