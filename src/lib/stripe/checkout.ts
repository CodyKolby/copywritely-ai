
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
    
    // Call the Supabase Edge Function with direct fetch for more control
    console.log('Calling Supabase function: stripe-checkout');
    
    // Get current session access token
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token || '';
    
    if (!accessToken) {
      console.error('No access token available - user might be logged out');
      throw new Error('Błąd autoryzacji - zaloguj się ponownie');
    }
    
    // Create URL with the full Supabase project domain
    const functionsUrl = `https://jorbqjareswzdrsmepbv.supabase.co/functions/v1/stripe-checkout`;
    console.log('Function URL:', functionsUrl);
    
    const response = await fetch(`${functionsUrl}?t=${timestamp}`, { // Add cache busting to URL
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cache-Control': 'no-cache, no-store',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({
        priceId,
        customerEmail: userEmail || undefined,
        successUrl,
        cancelUrl,
        origin: fullOrigin,
        timestamp: timestamp // Include timestamp to prevent caching
      })
    });
    
    // Handle non-200 responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase function error response:', response.status, errorText);
      throw new Error(`Błąd serwera: ${response.status} ${errorText}`);
    }
    
    // Parse response JSON
    const responseData = await response.json();
    console.log('Supabase function successful response:', responseData);
    
    // If function returned a URL, redirect user
    if (responseData?.url) {
      console.log('Received Stripe Checkout URL, redirecting to:', responseData.url);
      
      // Set redirect flag
      sessionStorage.setItem('redirectingToStripe', timestamp);
      
      toast.success('Przekierowujemy do strony płatności...');
      
      // Force a new page load to avoid browser caching issues
      window.location.href = responseData.url;
      
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
