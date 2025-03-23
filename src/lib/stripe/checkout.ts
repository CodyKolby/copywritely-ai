
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
    
    // Clear any existing checkout flags - ALWAYS do this first
    sessionStorage.removeItem('stripeCheckoutInProgress');
    sessionStorage.removeItem('redirectingToStripe');
    
    // Set a new checkout flag with timestamp
    const timestamp = Date.now().toString();
    sessionStorage.setItem('stripeCheckoutInProgress', timestamp);
    
    toast.info('Rozpoczynam proces płatności', {
      duration: 3000,
    });
    
    // Use Netlify function instead of Supabase function for improved reliability
    console.log('Calling Netlify function: stripe-checkout');
    
    // We won't need the auth token for the Netlify function
    const netlifyFunctionUrl = `${fullOrigin}/.netlify/functions/stripe-checkout`;
    console.log('Function URL:', netlifyFunctionUrl);
    
    const response = await fetch(netlifyFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({
        priceId,
        customerEmail: userEmail || undefined,
        successUrl,
        cancelUrl,
        timestamp // Include timestamp to prevent caching
      })
    });
    
    console.log('Response status:', response.status);
    
    // Handle non-200 responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Function error response:', response.status, errorText);
      throw new Error(`Błąd serwera: ${response.status} ${errorText}`);
    }
    
    // Parse response JSON
    const responseData = await response.json();
    console.log('Function successful response:', responseData);
    
    // If function returned a URL, redirect user
    if (responseData?.url) {
      console.log('Received Stripe Checkout URL, redirecting to:', responseData.url);
      
      // Set redirect flag
      sessionStorage.setItem('redirectingToStripe', timestamp);
      
      toast.success('Przekierowujemy do strony płatności...');
      
      // Use window.location.assign instead of window.location.href to avoid MutationObserver errors
      window.location.assign(responseData.url);
      
      return true;
    } else {
      console.error('No URL in response:', responseData);
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
