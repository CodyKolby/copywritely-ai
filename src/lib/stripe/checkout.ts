
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PRICE_IDS } from './client';

// Function to create checkout session - simplified for reliability
export const createCheckoutSession = async (priceId: string) => {
  try {
    console.log('Starting checkout process with clean state');
    
    // CRITICAL: Clear ANY existing flags at the start of checkout process
    sessionStorage.removeItem('redirectingToStripe');
    sessionStorage.removeItem('stripeCheckoutInProgress');
    localStorage.removeItem('stripeCheckoutInProgress');
    
    // Basic validation
    if (!priceId) {
      console.error('Missing priceId');
      throw new Error('Nieprawidłowy identyfikator cennika');
    }

    const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
    if (!stripePublicKey) {
      console.error('Missing Stripe public key');
      throw new Error('Brak klucza Stripe');
    }

    // Get stored user email
    const userEmail = localStorage.getItem('userEmail');
    
    // Ensure absolute URLs with full domain
    const fullOrigin = window.location.origin;
    const successUrl = `${fullOrigin}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${fullOrigin}/pricing?canceled=true`;

    console.log('Stripe checkout parameters:', {
      priceId,
      userEmail: userEmail ? 'Email provided' : 'Not provided',
      successUrl,
      cancelUrl,
      fullOrigin
    });

    // Set a new checkout flag with timestamp
    const timestamp = Date.now().toString();
    sessionStorage.setItem('stripeCheckoutInProgress', timestamp);

    // Direct API call to Supabase function - with simplified error handling
    const { data, error } = await supabase.functions.invoke('stripe-checkout', {
      body: {
        priceId,
        customerEmail: userEmail || undefined,
        successUrl,
        cancelUrl,
        origin: fullOrigin
      }
    });

    if (error) {
      // Clear flags when there's an error
      sessionStorage.removeItem('stripeCheckoutInProgress');
      sessionStorage.removeItem('redirectingToStripe');
      console.error('Supabase function error:', error);
      throw new Error(error.message || 'Błąd przy wywoływaniu funkcji Stripe');
    }

    // Check for API-level errors
    if (data?.error) {
      // Clear flags when there's an error
      sessionStorage.removeItem('stripeCheckoutInProgress');
      sessionStorage.removeItem('redirectingToStripe');
      console.error('Stripe error:', data.error);
      throw new Error(data.error);
    }

    // If function returned a URL, redirect user
    if (data?.url) {
      console.log('Redirecting to Stripe Checkout URL:', data.url);
      
      // Success toast
      toast.success('Przekierowujemy do strony płatności...');
      
      // Set redirect flag - WITH A TIMESTAMP to avoid stale flags
      sessionStorage.setItem('redirectingToStripe', timestamp);
      
      // Immediate redirect
      window.location.href = data.url;
      return true;
    } else {
      // Clear flags when there's an error
      sessionStorage.removeItem('stripeCheckoutInProgress');
      sessionStorage.removeItem('redirectingToStripe');
      throw new Error('Nie otrzymano poprawnej odpowiedzi z serwera');
    }
  } catch (error) {
    console.error('Stripe checkout error:', error);
    
    // CRITICAL: Clear flags when there's an error
    sessionStorage.removeItem('stripeCheckoutInProgress');
    sessionStorage.removeItem('redirectingToStripe');
    
    let errorMessage = error instanceof Error ? error.message : 'Nie można uruchomić procesu płatności';
    
    toast.error('Wystąpił błąd', {
      description: errorMessage
    });
    return false;
  }
};
