
import { toast } from 'sonner';
import { getStripe, PRICE_IDS } from './client';

// Function to create checkout session
export const createCheckoutSession = async (priceId: string) => {
  try {
    console.log('Starting checkout process with priceId', priceId);
    
    // Basic validation
    if (!priceId) {
      throw new Error('Nieprawidłowy identyfikator cennika');
    }

    // Get stored user email
    const userEmail = localStorage.getItem('userEmail');
    
    // Ensure absolute URLs with full domain
    const fullOrigin = window.location.origin;
    const successUrl = `${fullOrigin}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${fullOrigin}/pricing?canceled=true`;

    console.log('Preparing checkout with params:', {
      priceId,
      userEmail: userEmail ? 'Email provided' : 'Not provided',
      successUrl,
      cancelUrl
    });
    
    // Clear any existing checkout flags
    sessionStorage.removeItem('stripeCheckoutInProgress');
    sessionStorage.removeItem('redirectingToStripe');
    
    toast.info('Rozpoczynam proces płatności', {
      duration: 3000,
    });
    
    // Try direct redirect to Stripe Checkout via their JS SDK
    console.log('Attempting direct Stripe Checkout integration');
    
    // Initialize Stripe
    const stripe = await getStripe();
    
    if (!stripe) {
      console.error('Failed to initialize Stripe');
      throw new Error('Nie można zainicjować systemu płatności');
    }
    
    console.log('Stripe initialized successfully');
    
    // Set checkout options
    const options = {
      lineItems: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      successUrl: successUrl,
      cancelUrl: cancelUrl,
      customerEmail: userEmail || undefined,
      allowPromotionCodes: true,
      billingAddressCollection: 'auto',
      subscriptionData: {
        trial_period_days: 3
      }
    };
    
    console.log('Redirecting to Stripe Checkout with options:', options);
    
    // Redirect to Stripe Checkout
    const result = await stripe.redirectToCheckout(options);
    
    if (result.error) {
      console.error('Stripe checkout redirect error:', result.error);
      throw new Error(result.error.message || 'Nie można przekierować do systemu płatności');
    }
    
    console.log('Stripe checkout redirect initiated');
    return true;
    
  } catch (error) {
    console.error('Stripe checkout error:', error);
    
    // Clear session storage flags
    sessionStorage.removeItem('stripeCheckoutInProgress');
    sessionStorage.removeItem('redirectingToStripe');
    
    let errorMessage = error instanceof Error ? error.message : 'Nie można uruchomić procesu płatności';
    
    toast.error('Wystąpił błąd', {
      description: errorMessage
    });

    return false;
  }
};
