
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PRICE_IDS } from './client';

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
    
    // Set a new checkout flag with timestamp
    const timestamp = Date.now().toString();
    sessionStorage.setItem('stripeCheckoutInProgress', timestamp);
    
    toast.info('Rozpoczynam proces płatności', {
      duration: 3000,
    });
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('stripe-checkout', {
      body: {
        priceId,
        customerEmail: userEmail || undefined,
        successUrl,
        cancelUrl,
        origin: fullOrigin
      }
    });
    
    // Handle API errors
    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`Błąd funkcji: ${error.message}`);
    }
    
    // If function returned a URL, redirect user
    if (data?.url) {
      console.log('Received Stripe Checkout URL, redirecting to:', data.url);
      
      // Set redirect flag
      sessionStorage.setItem('redirectingToStripe', timestamp);
      
      toast.success('Przekierowujemy do strony płatności...');
      
      // Use window.location.href for immediate redirect
      window.location.href = data.url;
      
      return true;
    } else {
      toast.error('Brak URL', { description: 'Nie otrzymano poprawnej odpowiedzi z serwera' });
      throw new Error('Nie otrzymano poprawnej odpowiedzi z serwera');
    }
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
