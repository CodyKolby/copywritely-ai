
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
    
    // Get Stripe instance - with hardcoded key as fallback
    const stripe = await getStripe();
    
    if (!stripe) {
      console.error('Failed to initialize Stripe - public key may be missing or invalid');
      throw new Error('Nie można zainicjować systemu płatności - brak klucza API');
    }
    
    console.log('Stripe initialized successfully, redirecting to checkout...');
    
    // Set checkout options using valid parameters
    const options = {
      lineItems: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      successUrl,
      cancelUrl,
      customerEmail: userEmail || undefined
    };
    
    console.log('Redirecting to Stripe Checkout with options:', {
      ...options,
      lineItems: options.lineItems.map(item => ({ price: item.price, quantity: item.quantity }))
    });
    
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
