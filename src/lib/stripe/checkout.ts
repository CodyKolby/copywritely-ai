
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
    
    // Use Netlify function for improved reliability
    console.log('Calling Netlify function: stripe-checkout');
    
    // Check if we're running locally or in production
    let netlifyFunctionUrl = '';
    
    // Get domain from current URL
    const currentDomain = window.location.hostname;
    
    // Special handling to use either deployed Netlify functions or local dev setup
    if (currentDomain.includes('localhost') || currentDomain.includes('127.0.0.1')) {
      // Local development
      netlifyFunctionUrl = 'http://localhost:8888/.netlify/functions/stripe-checkout';
      console.log('Using local Netlify function URL');
    } else {
      // Production - construct full URL with current origin
      netlifyFunctionUrl = `${fullOrigin}/.netlify/functions/stripe-checkout`;
      console.log('Using production Netlify function URL:', netlifyFunctionUrl);
    }
    
    console.log('Making POST request to:', netlifyFunctionUrl);
    
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
      
      if (response.status === 405) {
        throw new Error('Błąd metody HTTP: 405 - Method Not Allowed. Spróbuj odświeżyć stronę lub skontaktuj się z obsługą techniczną.');
      } else {
        throw new Error(`Błąd serwera: ${response.status} ${errorText}`);
      }
    }
    
    // Parse response JSON
    let responseData;
    try {
      responseData = await response.json();
      console.log('Function successful response:', responseData);
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      throw new Error('Nieprawidłowa odpowiedź z serwera płatności');
    }
    
    // If function returned a URL, redirect user
    if (responseData?.url) {
      console.log('Received Stripe Checkout URL, redirecting to:', responseData.url);
      
      // Set redirect flag
      sessionStorage.setItem('redirectingToStripe', timestamp);
      
      toast.success('Przekierowujemy do strony płatności...');
      
      // Use setTimeout to avoid MutationObserver errors
      setTimeout(() => {
        window.location.assign(responseData.url);
      }, 1500);
      
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
